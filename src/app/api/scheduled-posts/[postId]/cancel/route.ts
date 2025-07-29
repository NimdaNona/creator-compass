import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContentSchedulerService } from '@/lib/services/content-scheduler';

const schedulerService = new ContentSchedulerService();

export async function POST(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cancelledPost = await schedulerService.cancelScheduledPost(
      session.user.id,
      params.postId
    );

    return NextResponse.json(cancelledPost);
  } catch (error) {
    console.error('Error cancelling scheduled post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel scheduled post' },
      { status: 500 }
    );
  }
}