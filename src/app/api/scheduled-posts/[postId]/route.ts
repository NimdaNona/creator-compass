import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContentSchedulerService } from '@/lib/services/content-scheduler';

const schedulerService = new ContentSchedulerService();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updatedPost = await schedulerService.updateScheduledPost(
      session.user.id,
      params.postId,
      body
    );

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating scheduled post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update scheduled post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await schedulerService.cancelScheduledPost(session.user.id, params.postId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting scheduled post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete scheduled post' },
      { status: 500 }
    );
  }
}