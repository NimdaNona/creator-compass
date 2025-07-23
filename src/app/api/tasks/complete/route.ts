import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { NotificationTriggers } from '@/lib/notifications';
import { logger, createLogger } from '@/lib/logger';
import { 
  withApiLogging, 
  successResponse, 
  errorResponse, 
  unauthorizedResponse,
  validationErrorResponse,
  serverErrorResponse,
  withTransactionLogging
} from '@/lib/api-logger';

// Prevent duplicate task completions by using a request ID
const processingRequests = new Map<string, Promise<any>>();

export const POST = withApiLogging(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    logger.authEvent('task_completion_unauthorized', undefined, false);
    return unauthorizedResponse('Authentication required');
  }

  const userLogger = createLogger({ userId: session.user.id });
  userLogger.info('Task completion request started');

  let body;
  try {
    body = await request.json();
  } catch (error) {
    userLogger.error('Invalid request body', error);
    return validationErrorResponse('Invalid request body');
  }

  const { taskId, timeSpent, notes, quality, skipped = false } = body;

  if (!taskId) {
    userLogger.warn('Task completion missing taskId');
    return validationErrorResponse({ taskId: ['Task ID is required'] });
  }

  // Log task completion attempt
  userLogger.info('Attempting task completion', {
    metadata: {
      taskId,
      timeSpent,
      hasNotes: !!notes,
      quality,
      skipped
    }
  });

  // Create a unique key for this request
  const requestKey = `${session.user.email}-${taskId}`;
  
  // Check if a request for this task is already being processed
  if (processingRequests.has(requestKey)) {
    userLogger.warn('Duplicate task completion request detected', {
      metadata: { taskId, requestKey }
    });
    // Wait for the existing request to complete
    return processingRequests.get(requestKey)!;
  }

  // Process the request and store the promise
  const processingPromise = processTaskCompletion(
    session.user.email,
    session.user.id,
    taskId,
    { timeSpent, notes, quality, skipped },
    request
  );

  processingRequests.set(requestKey, processingPromise);

  try {
    const result = await processingPromise;
    return result;
  } finally {
    // Clean up the processing request
    processingRequests.delete(requestKey);
  }
});

async function processTaskCompletion(
  userEmail: string,
  userId: string,
  taskId: string,
  completionData: {
    timeSpent?: number;
    notes?: string;
    quality?: number;
    skipped: boolean;
  },
  request: Request
) {
  const taskLogger = createLogger({ userId, taskId });
  
  // Use a transaction to ensure all operations succeed or fail together
  const result = await withTransactionLogging('task_completion', async () => {
    return await prisma.$transaction(async (tx) => {
    // Get user with all necessary relations
    taskLogger.debug('Fetching user data');
    const user = await tx.user.findUnique({
      where: { email: userEmail },
      include: {
        profile: true,
        stats: true,
        subscription: true
      }
    });

    if (!user) {
      taskLogger.error('User not found', undefined, { metadata: { userEmail } });
      throw new Error('User not found');
    }

    // Get the task details
    taskLogger.debug('Fetching task details');
    const task = await tx.dailyTask.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      taskLogger.error('Task not found', undefined, { metadata: { taskId } });
      throw new Error('Task not found');
    }

    // Log task details for debugging
    taskLogger.info('Task details retrieved', {
      metadata: {
        platform: task.platform,
        niche: task.niche,
        phase: task.phase,
        week: task.week,
        difficulty: task.difficulty
      }
    });

    // Check if task is locked for free users
    const isFreeUser = !user.subscription || user.subscription.status !== 'active';
    const isLocked = isFreeUser && (task.phase > 1 || (task.phase === 1 && task.week > 4));

    if (isLocked) {
      taskLogger.warn('Task locked for free user', {
        metadata: {
          phase: task.phase,
          week: task.week,
          subscriptionStatus: user.subscription?.status || 'none'
        }
      });
      throw new Error('This task is locked. Upgrade to access all tasks.');
    }

    // Check if task already completed to prevent duplicate celebrations
    taskLogger.debug('Checking for existing completion');
    const existingCompletion = await tx.taskCompletion.findUnique({
      where: {
        userId_taskId: {
          userId: user.id,
          taskId: taskId
        }
      }
    });

    if (existingCompletion) {
      taskLogger.info('Task already completed', {
        metadata: {
          completedAt: existingCompletion.completedAt,
          previousQuality: existingCompletion.quality
        }
      });
    }

    // Create or update task completion
    taskLogger.info('Creating/updating task completion record');
    const completion = await tx.taskCompletion.upsert({
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
    const completedTasks = await tx.taskCompletion.count({
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

    await tx.userStats.upsert({
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
    taskLogger.info('Checking for milestone achievements', {
      metadata: { totalTasks: completedTasks, streakDays }
    });
    const milestoneAchievements = await checkMilestoneAchievements(user.id, completedTasks, streakDays, tx);
    
    if (milestoneAchievements.length > 0) {
      taskLogger.info('New milestones achieved', {
        metadata: {
          count: milestoneAchievements.length,
          milestones: milestoneAchievements.map(a => ({
            id: a.milestone.id,
            name: a.milestone.name,
            points: a.milestone.points
          }))
        }
      });
    }
    
    // Only trigger celebrations for new completions
    if (!existingCompletion) {
      taskLogger.debug('Triggering celebrations for new completion');
      
      // Trigger celebrations for new achievements
      for (const achievement of milestoneAchievements) {
        try {
          // Send achievement notification
          await NotificationTriggers.onMilestoneCompleted(user.id, achievement.milestone);
          
          // Trigger celebration
          taskLogger.debug('Sending celebration request', {
            metadata: { milestone: achievement.milestone.name }
          });
          
          await fetch(new URL('/api/celebrations', request.url).toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify({
              type: 'milestone',
              title: `🎉 ${achievement.milestone.name} Achieved!`,
              message: achievement.milestone.description || 'Congratulations on reaching this milestone!',
              icon: achievement.milestone.icon || '🏆',
              color: achievement.milestone.color || '#FFD700',
              animation: 'confetti',
              duration: 5000
            })
          });
        } catch (error) {
          taskLogger.error('Failed to trigger celebration', error, {
            metadata: { milestone: achievement.milestone.name }
          });
        }
      }
      
      // Check for streak celebrations
      if (streakDays === 7 || streakDays === 30 || streakDays === 90) {
        taskLogger.info('Streak milestone reached', {
          metadata: { streakDays }
        });
        try {
          await fetch(new URL('/api/celebrations', request.url).toString(), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || ''
            },
            body: JSON.stringify({
              type: 'streak',
              title: `🔥 ${streakDays}-Day Streak!`,
              message: `Amazing! You've maintained a ${streakDays}-day streak!`,
              icon: '🔥',
              color: '#FF6B6B',
              animation: 'fireworks',
              duration: 5000
            })
          });
        } catch (error) {
          taskLogger.error('Failed to trigger streak celebration', error, {
            metadata: { streakDays }
          });
        }
      }
    }

    // Track engagement for recommendations
    taskLogger.debug('Tracking engagement data');
    await tx.contentEngagement.create({
      data: {
        userId: user.id,
        contentType: 'task',
        contentId: taskId,
        action: skipped ? 'skipped' : 'completed',
        duration: timeSpent
      }
    });

    // Update user's current phase/week if all tasks in current week are completed
    const currentWeekTasks = await tx.dailyTask.findMany({
      where: {
        platform: task.platform,
        niche: task.niche,
        phase: task.phase,
        week: task.week
      }
    });

    const currentWeekCompletions = await tx.taskCompletion.findMany({
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
      const weekExists = await tx.dailyTask.findFirst({
        where: {
          platform: task.platform,
          niche: task.niche,
          phase: task.phase,
          week: nextWeek
        }
      });

      if (weekExists) {
        // Move to next week
        await tx.userProfile.update({
          where: { userId: user.id },
          data: {
            currentWeek: nextWeek
          }
        });
      } else {
        // Move to next phase
        const nextPhase = task.phase + 1;
        const phaseExists = await tx.dailyTask.findFirst({
          where: {
            platform: task.platform,
            niche: task.niche,
            phase: nextPhase
          }
        });

        if (phaseExists) {
          await tx.userProfile.update({
            where: { userId: user.id },
            data: {
              currentPhase: nextPhase,
              currentWeek: 1
            }
          });
        }
      }
    }

    const response = {
      success: true,
      completion,
      points,
      streak: streakDays,
      milestoneAchievements,
      progressUpdate: allCurrentWeekCompleted ? 'advanced' : 'current',
      alreadyCompleted: !!existingCompletion
    };

    taskLogger.info('Task completion successful', {
      metadata: {
        points,
        streakDays,
        newAchievements: milestoneAchievements.length,
        progressUpdate: response.progressUpdate,
        alreadyCompleted: response.alreadyCompleted
      }
    });

    logger.featureUsage('task_completion', user.id, { metadata: { taskId } });

    return successResponse(response);

    }); // End of transaction
  }, { userId, taskId }); // End of withTransactionLogging
  
  return result;
}

async function checkMilestoneAchievements(userId: string, totalTasks: number, streakDays: number, tx: any) {
  const achievements = [];

  // Check task-based milestones
  const taskMilestones = await tx.milestone.findMany({
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
      const existing = await tx.milestoneAchievement.findUnique({
        where: {
          userId_milestoneId: {
            userId,
            milestoneId: milestone.id
          }
        }
      });

      if (!existing) {
        const achievement = await tx.milestoneAchievement.create({
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
    const streakMilestone = await tx.milestone.findFirst({
      where: {
        requirement: {
          path: '$.value',
          equals: '7_day_streak'
        }
      }
    });

    if (streakMilestone) {
      const existing = await tx.milestoneAchievement.findUnique({
        where: {
          userId_milestoneId: {
            userId,
            milestoneId: streakMilestone.id
          }
        }
      });

      if (!existing) {
        const achievement = await tx.milestoneAchievement.create({
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