import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { crossPlatformSync, type PlatformContent } from '@/lib/cross-platform-sync';
import { trackUsage } from '@/lib/usage';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceContent, targetPlatform } = body;

    if (!sourceContent || !targetPlatform) {
      return NextResponse.json(
        { error: 'Source content and target platform are required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Track cross-platform adaptation usage
    const usageCheck = await trackUsage(user.id, 'crossPlatform', true);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Cross-platform adaptation limit reached',
          upgradeRequired: true,
          message: 'Upgrade to adapt content across platforms'
        },
        { status: 403 }
      );
    }

    // Adapt content for target platform
    const adaptation = await crossPlatformSync.adaptContent(
      sourceContent as PlatformContent,
      targetPlatform
    );

    return NextResponse.json(adaptation);

  } catch (error) {
    console.error('Error adapting content:', error);
    return NextResponse.json(
      { error: 'Failed to adapt content' },
      { status: 500 }
    );
  }
}