import { NextRequest, NextResponse } from 'next/server';
import { NotificationScheduler, NotificationTriggers } from '@/lib/notifications';
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

// This endpoint should be called by a cron job service
// In production, you'd use Vercel Cron, Upstash, or similar
export async function GET(request: NextRequest) {
  // Verify the request is authorized (use a secret token in production)
  const headersList = headers();
  const authToken = headersList.get('authorization');
  
  if (authToken !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    // Send daily reminders
    await NotificationScheduler.sendDailyReminders();

    // Check for streak warnings (users who haven't completed tasks today)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const usersAtRisk = await prisma.progress.findMany({
      where: {
        isActive: true,
        lastActivityDate: {
          lt: yesterday
        }
      },
      include: {
        user: true
      }
    });

    // Send streak warnings
    for (const progress of usersAtRisk) {
      const hoursRemaining = 24 - new Date().getHours();
      await NotificationTriggers.onStreakWarning(progress.userId, hoursRemaining);
    }

    // Check for upcoming milestones (next 3 days)
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const upcomingMilestones = await prisma.milestone.findMany({
      where: {
        isCompleted: false,
        targetDate: {
          gte: new Date(),
          lte: threeDaysFromNow
        }
      },
      include: {
        progress: {
          include: {
            user: true
          }
        }
      }
    });

    // Send upcoming milestone notifications
    for (const milestone of upcomingMilestones) {
      const daysUntil = Math.ceil(
        (milestone.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      await NotificationTriggers.onMilestoneUpcoming(
        milestone.progress.userId,
        milestone,
        daysUntil
      );
    }

    // Check for trial ending (7 days warning)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringTrials = await prisma.subscription.findMany({
      where: {
        status: 'trialing',
        currentPeriodEnd: {
          gte: new Date(),
          lte: sevenDaysFromNow
        }
      },
      include: {
        user: true
      }
    });

    // Send trial ending notifications
    for (const subscription of expiringTrials) {
      const daysRemaining = Math.ceil(
        (subscription.currentPeriodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      await NotificationTriggers.onTrialEnding(subscription.userId, daysRemaining);
    }

    return NextResponse.json({
      success: true,
      notifications: {
        dailyReminders: usersAtRisk.length,
        streakWarnings: usersAtRisk.length,
        upcomingMilestones: upcomingMilestones.length,
        trialEndings: expiringTrials.length
      }
    });
  } catch (error) {
    console.error('Error in notification cron job:', error);
    return NextResponse.json(
      { error: 'Failed to process notifications' },
      { status: 500 }
    );
  }
}