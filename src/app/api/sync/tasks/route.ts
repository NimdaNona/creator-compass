import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface TaskUpdate {
  id: string;
  data: {
    taskId: string;
    completed?: boolean;
    quality?: number;
    timeSpent?: number;
    notes?: string;
  };
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { updates } = body as { updates: TaskUpdate[] };

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates format' }, { status: 400 });
    }

    const processed: string[] = [];
    const failed: string[] = [];

    // Process updates in a transaction
    await prisma.$transaction(async (tx) => {
      for (const update of updates) {
        try {
          const { taskId, completed, quality, timeSpent, notes } = update.data;
          
          if (completed === true) {
            // Check if already completed
            const existing = await tx.taskCompletion.findUnique({
              where: {
                userId_taskId: {
                  userId: user.id,
                  taskId
                }
              }
            });

            if (!existing) {
              // Create completion
              await tx.taskCompletion.create({
                data: {
                  userId: user.id,
                  taskId,
                  quality,
                  timeSpent,
                  notes
                }
              });

              // Update stats
              await tx.userStats.update({
                where: { userId: user.id },
                data: {
                  tasksCompleted: { increment: 1 },
                  totalTimeSpent: timeSpent ? { increment: timeSpent } : undefined,
                  lastActivityAt: new Date()
                }
              });

              // Update roadmap progress
              const roadmapProgress = await tx.roadmapProgress.findFirst({
                where: { userId: user.id }
              });

              if (roadmapProgress) {
                await tx.roadmapProgress.update({
                  where: { id: roadmapProgress.id },
                  data: {
                    completedTasks: { increment: 1 },
                    progressPercentage: {
                      set: Math.round(((roadmapProgress.completedTasks + 1) / roadmapProgress.totalTasks) * 100)
                    },
                    lastActivityAt: new Date()
                  }
                });
              }
            }
          } else if (completed === false) {
            // Handle uncomplete (if supported)
            await tx.taskCompletion.deleteMany({
              where: {
                userId: user.id,
                taskId
              }
            });

            // Update stats
            await tx.userStats.update({
              where: { userId: user.id },
              data: {
                tasksCompleted: { decrement: 1 },
                lastActivityAt: new Date()
              }
            });
          }

          processed.push(update.id);
        } catch (error) {
          console.error(`Failed to process update ${update.id}:`, error);
          failed.push(update.id);
        }
      }
    });

    return NextResponse.json({
      processed,
      failed,
      total: updates.length
    });

  } catch (error) {
    console.error('Error syncing tasks:', error);
    return NextResponse.json(
      { error: 'Failed to sync tasks' },
      { status: 500 }
    );
  }
}