import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { dbUtils } from '@/lib/db';
import { ratelimiters, rateLimit } from '@/lib/ratelimit-api';

export async function GET(request: NextRequest) {
  // Apply rate limiting for user endpoints
  const rateLimitResponse = await rateLimit(request, ratelimiters?.user || null);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await dbUtils.getUserProgress(session.user.id);
    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting for user endpoints
  const rateLimitResponse = await rateLimit(request, ratelimiters?.user || null);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, phaseId, weekId, points } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const progress = await dbUtils.addTaskProgress(session.user.id, taskId, {
      phaseId,
      weekId,
      points,
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error adding task progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}