import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        stats: true,
        profile: true,
        taskCompletions: {
          select: {
            id: true,
            completedAt: true
          },
          orderBy: {
            completedAt: 'desc'
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate additional stats
    const daysSinceStart = user.profile?.startDate 
      ? Math.floor((Date.now() - user.profile.startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Get platform-specific stats (mock data for now)
    const platformStats = {
      youtube: {
        subscribers: 0,
        views: 0,
        watchTime: 0
      },
      tiktok: {
        followers: 0,
        likes: 0,
        views: 0
      },
      twitch: {
        followers: 0,
        averageViewers: 0,
        peakViewers: 0
      }
    };

    return NextResponse.json({
      totalPoints: user.stats?.totalPoints || 0,
      streakDays: user.stats?.streakDays || 0,
      longestStreak: user.stats?.longestStreak || 0,
      totalTasksCompleted: user.stats?.totalTasksCompleted || 0,
      lastActiveDate: user.stats?.lastActiveDate,
      daysSinceStart,
      currentPhase: user.profile?.currentPhase || 1,
      currentWeek: user.profile?.currentWeek || 1,
      platformStats,
      // For milestone calculations
      subscribers: platformStats[user.profile?.selectedPlatform as keyof typeof platformStats]?.subscribers || 0,
      followers: platformStats[user.profile?.selectedPlatform as keyof typeof platformStats]?.followers || 0
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}