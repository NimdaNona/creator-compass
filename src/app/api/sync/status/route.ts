import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: {
          select: {
            selectedPlatform: true,
            selectedNiche: true,
            preferences: true
          }
        },
        stats: {
          select: {
            totalPoints: true,
            streakDays: true,
            totalTasksCompleted: true,
            longestStreak: true,
            lastActiveDate: true,
            badges: true,
            titles: true,
            currentTitle: true,
            weeklyGoal: true,
            monthlyGoal: true
          }
        },
        subscription: {
          select: {
            plan: true,
            status: true,
            stripeCustomerId: true,
            stripePriceId: true,
            currentPeriodEnd: true
          }
        },
        taskCompletions: {
          select: {
            taskId: true,
            completedAt: true,
            quality: true,
            timeSpent: true
          },
          orderBy: {
            completedAt: 'desc'
          },
          take: 100 // Recent completions only
        },
        roadmapProgress: {
          select: {
            roadmapId: true,
            currentPhase: true,
            currentWeek: true,
            currentDay: true,
            completedTasks: true,
            totalTasks: true,
            progressPercentage: true,
            startedAt: true,
            lastActivityAt: true
          }
        },
        milestoneAchievements: {
          select: {
            milestoneId: true,
            achievedAt: true,
            milestone: {
              select: {
                id: true,
                name: true,
                description: true,
                requirement: true,
                reward: true,
                celebration: true,
                platform: true,
                niche: true
              }
            }
          },
          orderBy: {
            achievedAt: 'desc'
          },
          take: 50
        },
        usage: {
          select: {
            feature: true,
            count: true,
            limit: true,
            lastUsedAt: true,
            resetAt: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate derived data
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysCompletions = user.taskCompletions.filter(tc => {
      const completedDate = new Date(tc.completedAt);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    });

    const syncData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profile: user.profile,
        stats: user.stats,
        subscription: user.subscription
      },
      progress: {
        roadmaps: user.roadmapProgress,
        todaysCompletions: todaysCompletions.length,
        totalCompletions: user.taskCompletions.length,
        completedTaskIds: user.taskCompletions.map(tc => tc.taskId),
        recentCompletions: user.taskCompletions.slice(0, 20)
      },
      achievements: {
        milestones: user.milestoneAchievements,
        totalPoints: user.stats?.totalPoints || 0,
        streak: user.stats?.streakDays || 0
      },
      usage: user.usage.reduce((acc, u) => {
        acc[u.feature] = {
          count: u.count,
          limit: u.limit,
          lastUsedAt: u.lastUsedAt,
          resetAt: u.resetAt
        };
        return acc;
      }, {} as Record<string, any>),
      syncTimestamp: new Date().toISOString()
    };

    return NextResponse.json(syncData);

  } catch (error) {
    console.error('Error fetching sync status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync status' },
      { status: 500 }
    );
  }
}