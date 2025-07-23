import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { resetExpiredUsage } from '@/lib/usage';

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

    // Use the centralized reset function that handles timezones properly
    const result = await resetExpiredUsage();

    console.log(`Reset ${result.resetCount} usage tracking records`);

    return NextResponse.json({ 
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Usage reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}