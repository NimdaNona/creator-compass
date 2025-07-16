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

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const celebrations = await dbUtils.getUserCelebrations(session.user.id, unreadOnly);
    return NextResponse.json({ celebrations });
  } catch (error) {
    console.error('Error fetching celebrations:', error);
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
    const { type, title, message, icon, color, animation, duration } = body;

    if (!type || !title || !message) {
      return NextResponse.json({ error: 'Type, title, and message are required' }, { status: 400 });
    }

    const celebration = await dbUtils.addCelebration(session.user.id, {
      type,
      title,
      message,
      icon: icon || '🎉',
      color: color || '#FFD700',
      animation: animation || 'confetti',
      duration: duration || 3000,
    });

    return NextResponse.json({ celebration });
  } catch (error) {
    console.error('Error adding celebration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
    const { celebrationIds } = body;

    await dbUtils.markCelebrationsAsRead(session.user.id, celebrationIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking celebrations as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}