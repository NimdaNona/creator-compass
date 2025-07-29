import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rewards } from '@/lib/gamification/rewards';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user's unlocked rewards
    const unlockedRewards = await rewards.getUserUnlockedRewards(userId);
    
    // Get active rewards by category
    const activeRewards = await rewards.getUserActiveRewards(userId);
    
    // Get reward progress
    const rewardProgress = await rewards.getRewardProgress(userId);
    
    // Get reward tiers
    const rewardTiers = await rewards.getRewardTiers(userId);

    return NextResponse.json({
      unlocked: unlockedRewards,
      active: activeRewards,
      progress: rewardProgress,
      tiers: rewardTiers
    });
  } catch (error) {
    console.error('Failed to fetch rewards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}