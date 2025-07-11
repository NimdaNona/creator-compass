import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { NotificationScheduler } from '@/lib/notifications';

// Vercel Cron Job endpoint for scheduled notifications
export async function GET() {
  try {
    // Verify the request is from Vercel Cron
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hour = new Date().getHours();
    
    // Send different notifications based on the hour
    if (hour === 9) {
      // Morning reminders
      await NotificationScheduler.sendDailyReminders();
    } else if (hour === 14) {
      // Afternoon milestone checks
      await NotificationScheduler.checkUpcomingMilestones();
    } else if (hour === 19) {
      // Evening streak warnings
      await NotificationScheduler.checkStreakWarnings();
    }

    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      hour 
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to run scheduled notifications' },
      { status: 500 }
    );
  }
}