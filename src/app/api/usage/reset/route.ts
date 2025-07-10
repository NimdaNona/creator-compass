import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

// This endpoint should be called by a cron job to reset usage tracking
// It can also be manually triggered with proper authorization
export async function POST(request: NextRequest) {
  try {
    // Simple authorization check - in production, use a more secure method
    const authHeader = headers().get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    
    // Find all usage records that need to be reset
    const recordsToReset = await prisma.usageTracking.findMany({
      where: {
        resetAt: {
          lte: now,
        },
      },
    });

    // Reset the counts
    const resetPromises = recordsToReset.map(record => 
      prisma.usageTracking.update({
        where: { id: record.id },
        data: {
          count: 0,
          resetAt: getNextResetDate(record.feature),
        },
      })
    );

    const results = await Promise.all(resetPromises);

    console.log(`Reset ${results.length} usage tracking records`);

    return NextResponse.json({ 
      success: true,
      resetCount: results.length,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Usage reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getNextResetDate(feature: string): Date {
  const now = new Date();
  
  // All features reset monthly for now
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  nextMonth.setHours(0, 0, 0, 0);
  
  return nextMonth;
}