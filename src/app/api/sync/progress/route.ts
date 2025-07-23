import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

interface ProgressUpdate {
  id: string;
  data: {
    roadmapId?: string;
    currentPhase?: number;
    currentWeek?: number;
    currentDay?: number;
    progressPercentage?: number;
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
    const { updates } = body as { updates: ProgressUpdate[] };

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'Invalid updates format' }, { status: 400 });
    }

    const processed: string[] = [];
    const failed: string[] = [];

    // Process updates
    for (const update of updates) {
      try {
        const { roadmapId, currentPhase, currentWeek, currentDay, progressPercentage } = update.data;
        
        if (roadmapId) {
          const existingProgress = await prisma.roadmapProgress.findFirst({
            where: {
              userId: user.id,
              roadmapId
            }
          });

          if (existingProgress) {
            await prisma.roadmapProgress.update({
              where: { id: existingProgress.id },
              data: {
                currentPhase: currentPhase ?? existingProgress.currentPhase,
                currentWeek: currentWeek ?? existingProgress.currentWeek,
                currentDay: currentDay ?? existingProgress.currentDay,
                progressPercentage: progressPercentage ?? existingProgress.progressPercentage,
                lastActivityAt: new Date()
              }
            });
          } else {
            // Create new progress entry
            await prisma.roadmapProgress.create({
              data: {
                userId: user.id,
                roadmapId,
                currentPhase: currentPhase ?? 1,
                currentWeek: currentWeek ?? 1,
                currentDay: currentDay ?? 1,
                completedTasks: 0,
                totalTasks: 0, // This should be calculated based on roadmap
                progressPercentage: progressPercentage ?? 0
              }
            });
          }

          // Update user stats
          await prisma.userStats.update({
            where: { userId: user.id },
            data: {
              currentPhase: currentPhase,
              currentWeek: currentWeek,
              lastActivityAt: new Date()
            }
          });
        }

        processed.push(update.id);
      } catch (error) {
        console.error(`Failed to process progress update ${update.id}:`, error);
        failed.push(update.id);
      }
    }

    return NextResponse.json({
      processed,
      failed,
      total: updates.length
    });

  } catch (error) {
    console.error('Error syncing progress:', error);
    return NextResponse.json(
      { error: 'Failed to sync progress' },
      { status: 500 }
    );
  }
}