import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { badgesAndAchievements } from '@/lib/gamification/badges-achievements';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user badges
    const userBadges = await badgesAndAchievements.getUserBadges(userId);
    
    // Get badge progress
    const badgeProgress = await badgesAndAchievements.getBadgeProgress(userId);

    return NextResponse.json({
      earned: userBadges,
      progress: badgeProgress,
      totalBadges: badgesAndAchievements.getBadges().length
    });
  } catch (error) {
    console.error('Failed to fetch badges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    );
  }
}