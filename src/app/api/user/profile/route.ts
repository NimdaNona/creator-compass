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

    const user = await dbUtils.getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: user.profile,
      stats: user.stats,
      progress: user.progress,
      achievements: user.achievements,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
    const {
      selectedPlatform,
      selectedNiche,
      currentPhase,
      currentWeek,
      goals,
      preferences,
      targetTimeframe,
      motivation,
    } = body;

    const updatedProfile = await dbUtils.updateUserProfile(session.user.id, {
      selectedPlatform,
      selectedNiche,
      currentPhase,
      currentWeek,
      goals,
      preferences,
      targetTimeframe,
      motivation,
    });

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}