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

    const achievements = await dbUtils.getUserAchievements(session.user.id);
    return NextResponse.json({ achievements });
  } catch (error) {
    console.error('Error fetching user achievements:', error);
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
    const { achievementId, type } = body;

    if (!achievementId) {
      return NextResponse.json({ error: 'Achievement ID is required' }, { status: 400 });
    }

    const achievement = await dbUtils.addUserAchievement(session.user.id, achievementId, type);
    
    if (!achievement) {
      return NextResponse.json({ error: 'Achievement already exists' }, { status: 409 });
    }

    return NextResponse.json({ achievement });
  } catch (error) {
    console.error('Error adding user achievement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}