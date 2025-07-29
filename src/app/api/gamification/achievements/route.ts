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

    // Get user achievements
    const userAchievements = await badgesAndAchievements.getUserAchievements(userId);
    
    // Get achievement progress
    const achievementProgress = await badgesAndAchievements.getAchievementProgress(userId);

    return NextResponse.json({
      earned: userAchievements,
      progress: achievementProgress,
      totalAchievements: badgesAndAchievements.getAchievements().length,
      totalPoints: userAchievements.reduce((sum, a) => sum + (a.points || 0), 0)
    });
  } catch (error) {
    console.error('Failed to fetch achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}