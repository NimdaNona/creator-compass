import { NextRequest, NextResponse } from 'next/server';
import { ContentSchedulerService } from '@/lib/services/content-scheduler';

// This endpoint should be called by a cron job service like Vercel Cron
// It processes all scheduled posts that are due

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a trusted source
    // In production, you should verify this is from your cron service
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedulerService = new ContentSchedulerService();
    const results = await schedulerService.processScheduledPosts();

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`Processed ${results.length} scheduled posts: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      processed: results.length,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error('Error processing scheduled posts:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled posts' },
      { status: 500 }
    );
  }
}

// Also support GET for easier testing
export async function GET(request: NextRequest) {
  return POST(request);
}