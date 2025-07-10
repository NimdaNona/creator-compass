import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, timeSpent, notes, quality, skipped = false } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        stats: true,
        subscription: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the task details
    const task = await prisma.dailyTask.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if task is locked for free users
    const isFreeUser = !user.subscription || user.subscription.status !== 'active';
    const isLocked = isFreeUser && (task.phase > 1 || (task.phase === 1 && task.week > 4));

    if (isLocked) {
      return NextResponse.json({ 
        error: 'This task is locked. Upgrade to access all tasks.' 
      }, { status: 403 });
    }

    // Create or update task completion
    const completion = await prisma.taskCompletion.upsert({
      where: {
        userId_taskId: {
          userId: user.id,
          taskId: taskId
        }
      },
      update: {
        completedAt: new Date(),
        timeSpent,
        notes,
        quality,
        skipped
      },
      create: {
        userId: user.id,
        taskId,
        timeSpent,
        notes,
        quality,
        skipped
      }
    });

    // Update user progress
    const completedTasks = await prisma.taskCompletion.count({
      where: { userId: user.id }
    });

    // Update user stats
    const today = new Date().toDateString();
    const lastActiveDate = user.stats?.lastActiveDate 
      ? new Date(user.stats.lastActiveDate).toDateString() 
      : null;

    let streakDays = user.stats?.streakDays || 0;
    let longestStreak = user.stats?.longestStreak || 0;

    // Calculate streak
    if (lastActiveDate === today) {
      // Already active today, no change
    } else if (lastActiveDate === new Date(Date.now() - 86400000).toDateString()) {
      // Was active yesterday, increment streak
      streakDays++;
    } else {
      // Streak broken, reset to 1
      streakDays = 1;
    }

    longestStreak = Math.max(longestStreak, streakDays);

    // Calculate points (base 10 + quality bonus)
    const points = 10 + (quality ? quality * 2 : 0);

    await prisma.userStats.upsert({
      where: { userId: user.id },
      update: {
        totalPoints: { increment: points },
        streakDays,
        longestStreak,
        lastActiveDate: new Date(),
        totalTasksCompleted: completedTasks
      },
      create: {
        userId: user.id,
        totalPoints: points,
        streakDays: 1,
        longestStreak: 1,
        lastActiveDate: new Date(),
        totalTasksCompleted: 1
      }
    });

    // Check for milestone achievements
    const milestoneAchievements = await checkMilestoneAchievements(user.id, completedTasks, streakDays);

    // Track engagement for recommendations
    await prisma.contentEngagement.create({
      data: {
        userId: user.id,
        contentType: 'task',
        contentId: taskId,
        action: skipped ? 'skipped' : 'completed',
        duration: timeSpent
      }
    });

    // Update user's current phase/week if all tasks in current week are completed
    const currentWeekTasks = await prisma.dailyTask.findMany({
      where: {
        platform: task.platform,
        niche: task.niche,
        phase: task.phase,
        week: task.week
      }
    });

    const currentWeekCompletions = await prisma.taskCompletion.findMany({
      where: {
        userId: user.id,
        taskId: {
          in: currentWeekTasks.map(t => t.id)
        }
      }
    });

    const allCurrentWeekCompleted = currentWeekCompletions.length === currentWeekTasks.length;

    if (allCurrentWeekCompleted && user.profile) {
      // Move to next week or phase
      const nextWeek = task.week + 1;
      const weekExists = await prisma.dailyTask.findFirst({
        where: {
          platform: task.platform,
          niche: task.niche,
          phase: task.phase,
          week: nextWeek
        }
      });

      if (weekExists) {
        // Move to next week
        await prisma.userProfile.update({
          where: { userId: user.id },
          data: {
            currentWeek: nextWeek
          }
        });
      } else {
        // Move to next phase
        const nextPhase = task.phase + 1;
        const phaseExists = await prisma.dailyTask.findFirst({
          where: {
            platform: task.platform,
            niche: task.niche,
            phase: nextPhase
          }
        });

        if (phaseExists) {
          await prisma.userProfile.update({
            where: { userId: user.id },
            data: {
              currentPhase: nextPhase,
              currentWeek: 1
            }
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      completion,
      points,
      streak: streakDays,
      milestoneAchievements,
      progressUpdate: allCurrentWeekCompleted ? 'advanced' : 'current'
    });

  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json(
      { error: 'Failed to complete task' },
      { status: 500 }
    );
  }
}

async function checkMilestoneAchievements(userId: string, totalTasks: number, streakDays: number) {
  const achievements = [];

  // Check task-based milestones
  const taskMilestones = await prisma.milestone.findMany({
    where: {
      requirement: {
        path: '$.type',
        equals: 'task_completion'
      }
    }
  });

  for (const milestone of taskMilestones) {
    const requirement = milestone.requirement as any;
    if (totalTasks >= parseInt(requirement.value)) {
      // Check if already achieved
      const existing = await prisma.milestoneAchievement.findUnique({
        where: {
          userId_milestoneId: {
            userId,
            milestoneId: milestone.id
          }
        }
      });

      if (!existing) {
        const achievement = await prisma.milestoneAchievement.create({
          data: {
            userId,
            milestoneId: milestone.id
          },
          include: {
            milestone: true
          }
        });
        achievements.push(achievement);
      }
    }
  }

  // Check streak-based milestones
  if (streakDays === 7) {
    const streakMilestone = await prisma.milestone.findFirst({
      where: {
        requirement: {
          path: '$.value',
          equals: '7_day_streak'
        }
      }
    });

    if (streakMilestone) {
      const existing = await prisma.milestoneAchievement.findUnique({
        where: {
          userId_milestoneId: {
            userId,
            milestoneId: streakMilestone.id
          }
        }
      });

      if (!existing) {
        const achievement = await prisma.milestoneAchievement.create({
          data: {
            userId,
            milestoneId: streakMilestone.id
          },
          include: {
            milestone: true
          }
        });
        achievements.push(achievement);
      }
    }
  }

  return achievements;
}