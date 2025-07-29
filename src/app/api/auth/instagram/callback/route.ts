import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { InstagramService } from '@/lib/platforms/instagram-service';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/integrations?error=${error}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/integrations?error=missing_params', request.url)
      );
    }

    // Verify state
    const stateData = await kv.get(`oauth_state:${state}`);
    if (!stateData) {
      return NextResponse.redirect(
        new URL('/integrations?error=invalid_state', request.url)
      );
    }

    const { userId, platform } = JSON.parse(stateData as string);
    if (platform !== 'instagram') {
      return NextResponse.redirect(
        new URL('/integrations?error=platform_mismatch', request.url)
      );
    }

    // Delete state from KV
    await kv.del(`oauth_state:${state}`);

    // Create Instagram service and connect
    const instagramService = new InstagramService();
    const connection = await instagramService.connect(code);
    
    // Set userId
    connection.userId = userId;

    // Save connection to database
    const saved = await prisma.platformConnection.upsert({
      where: {
        userId_platform_accountId: {
          userId,
          platform: 'instagram',
          accountId: connection.accountId
        }
      },
      update: {
        accessToken: connection.accessToken,
        refreshToken: connection.refreshToken,
        tokenExpiry: connection.tokenExpiry,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        ...connection,
        userId
      }
    });

    return NextResponse.redirect(
      new URL('/integrations?success=instagram', request.url)
    );
  } catch (error) {
    console.error('Instagram OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/integrations?error=connection_failed', request.url)
    );
  }
}