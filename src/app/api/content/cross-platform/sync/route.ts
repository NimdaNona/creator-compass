import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { crossPlatformSync } from '@/lib/cross-platform-sync';
import { trackUsage } from '@/lib/usage';
// Removed unused import

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sourceContentId, targetPlatforms } = body;

    if (!sourceContentId || !targetPlatforms || !Array.isArray(targetPlatforms)) {
      return NextResponse.json(
        { error: 'Source content ID and target platforms are required' },
        { status: 400 }
      );
    }

    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check subscription tier for bulk sync
    const isActive = user.subscription?.status === 'active';
    const priceId = user.subscription?.priceId || '';
    const tier = priceId.includes('studio') ? 'studio' : isActive ? 'pro' : 'free';
    const maxPlatforms = tier === 'studio' ? 3 : tier === 'pro' ? 2 : 1;

    if (targetPlatforms.length > maxPlatforms) {
      return NextResponse.json(
        { 
          error: `Your plan allows syncing to ${maxPlatforms} platform${maxPlatforms > 1 ? 's' : ''} at once`,
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    // Track usage
    const usageCheck = await trackUsage(user.id, 'crossPlatform', true);
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Cross-platform sync limit reached',
          upgradeRequired: true,
          message: 'Upgrade to sync more content across platforms'
        },
        { status: 403 }
      );
    }

    // Perform sync
    const result = await crossPlatformSync.syncContentAcrossPlatforms(
      user.id,
      sourceContentId,
      targetPlatforms
    );

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error syncing content:', error);
    return NextResponse.json(
      { error: 'Failed to sync content' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get sync status
    const status = await crossPlatformSync.getContentSyncStatus(user.id);

    return NextResponse.json(status);

  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}