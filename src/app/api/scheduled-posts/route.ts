import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContentSchedulerService } from '@/lib/services/content-scheduler';

const schedulerService = new ContentSchedulerService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const posts = await schedulerService.getScheduledPosts(session.user.id, {
      platform,
      status,
      limit,
      offset,
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching scheduled posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      platformConnectionId,
      title,
      content,
      media,
      hashtags,
      scheduledFor,
      timezone,
      contentType,
      crossPost,
      crossPostPlatforms,
      metadata,
    } = body;

    const scheduledPost = await schedulerService.createScheduledPost({
      userId: session.user.id,
      platformConnectionId,
      title,
      content,
      media,
      hashtags,
      scheduledFor: new Date(scheduledFor),
      timezone,
      contentType,
      crossPost,
      crossPostPlatforms,
      metadata,
    });

    return NextResponse.json(scheduledPost);
  } catch (error) {
    console.error('Error creating scheduled post:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create scheduled post' },
      { status: 500 }
    );
  }
}