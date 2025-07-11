import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface OptimalTime {
  time: string;
  dayOfWeek: number; // 0-6 (Sunday to Saturday)
  engagement: 'high' | 'medium' | 'low';
  reason: string;
}

// Platform-specific optimal posting times
const OPTIMAL_TIMES: Record<string, OptimalTime[]> = {
  youtube: [
    { time: '14:00', dayOfWeek: -1, engagement: 'high', reason: 'Peak afternoon viewership' },
    { time: '17:00', dayOfWeek: -1, engagement: 'high', reason: 'After work/school hours' },
    { time: '20:00', dayOfWeek: -1, engagement: 'medium', reason: 'Evening entertainment time' },
    { time: '10:00', dayOfWeek: 0, engagement: 'medium', reason: 'Sunday morning viewers' },
    { time: '10:00', dayOfWeek: 6, engagement: 'medium', reason: 'Saturday morning viewers' }
  ],
  tiktok: [
    { time: '06:00', dayOfWeek: -1, engagement: 'high', reason: 'Morning scroll time' },
    { time: '10:00', dayOfWeek: -1, engagement: 'medium', reason: 'Mid-morning break' },
    { time: '19:00', dayOfWeek: -1, engagement: 'high', reason: 'Peak evening usage' },
    { time: '22:00', dayOfWeek: -1, engagement: 'high', reason: 'Before bed scrolling' }
  ],
  twitch: [
    { time: '19:00', dayOfWeek: -1, engagement: 'high', reason: 'Prime time viewing' },
    { time: '21:00', dayOfWeek: -1, engagement: 'high', reason: 'Peak concurrent viewers' },
    { time: '14:00', dayOfWeek: 0, engagement: 'medium', reason: 'Sunday afternoon' },
    { time: '14:00', dayOfWeek: 6, engagement: 'medium', reason: 'Saturday afternoon' },
    { time: '23:00', dayOfWeek: 5, engagement: 'medium', reason: 'Friday late night' },
    { time: '23:00', dayOfWeek: 6, engagement: 'medium', reason: 'Saturday late night' }
  ]
};

// GET /api/calendar/optimal-times - Get optimal posting times
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const dayOfWeek = searchParams.get('dayOfWeek');

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform parameter is required' },
        { status: 400 }
      );
    }

    // Get optimal times for platform
    let optimalTimes = OPTIMAL_TIMES[platform.toLowerCase()] || OPTIMAL_TIMES.youtube;

    // Filter by day of week if specified
    if (dayOfWeek !== null) {
      const day = parseInt(dayOfWeek);
      optimalTimes = optimalTimes.filter(
        time => time.dayOfWeek === -1 || time.dayOfWeek === day
      );
    }

    // Sort by engagement level
    optimalTimes.sort((a, b) => {
      const engagementOrder = { high: 0, medium: 1, low: 2 };
      return engagementOrder[a.engagement] - engagementOrder[b.engagement];
    });

    return NextResponse.json({ 
      platform,
      optimalTimes: optimalTimes.slice(0, 5) // Return top 5 times
    });

  } catch (error) {
    console.error('Error fetching optimal times:', error);
    return NextResponse.json(
      { error: 'Failed to fetch optimal times' },
      { status: 500 }
    );
  }
}