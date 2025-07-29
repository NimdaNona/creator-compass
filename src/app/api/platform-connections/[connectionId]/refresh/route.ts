import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { YouTubeService } from '@/lib/platforms/youtube-service';
import { TikTokService } from '@/lib/platforms/tiktok-service';
import { InstagramService } from '@/lib/platforms/instagram-service';
import { TwitterService } from '@/lib/platforms/twitter-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { connectionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get connection
    const connection = await prisma.platformConnection.findFirst({
      where: {
        id: params.connectionId,
        userId: session.user.id
      }
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Get the appropriate service
    let service;
    switch (connection.platform) {
      case 'youtube':
        service = new YouTubeService();
        break;
      case 'tiktok':
        service = new TikTokService();
        break;
      case 'instagram':
        service = new InstagramService();
        break;
      case 'twitter':
        service = new TwitterService();
        break;
      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    // Refresh the token
    const updatedConnection = await service.refreshToken(connection as any);

    return NextResponse.json(updatedConnection);
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}