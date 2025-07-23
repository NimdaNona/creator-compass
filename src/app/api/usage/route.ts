import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ratelimiters, rateLimit } from '@/lib/ratelimit-api';
import { getUsageStats, trackUsage } from '@/lib/usage';

// Get usage statistics for the current user
export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimit(request, ratelimiters?.user || null);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get timezone from query param or header
    const timezone = request.nextUrl.searchParams.get('timezone') || 
                    request.headers.get('x-timezone') || 
                    'UTC';

    // Use the centralized usage stats function
    const stats = await getUsageStats(user.id, timezone);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Track feature usage
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await rateLimit(request, ratelimiters?.user || null);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { feature, increment = true, timezone = 'UTC' } = body;

    if (!feature || !['templates', 'platforms', 'exports', 'analytics', 'crossPlatform', 'ideas'].includes(feature)) {
      return NextResponse.json({ error: 'Invalid feature' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Use the centralized tracking function
    const result = await trackUsage(user.id, feature, increment, timezone);

    if (!result.allowed && increment) {
      return NextResponse.json({ 
        error: 'Usage limit exceeded',
        current: result.used,
        limit: result.limit,
        resetAt: result.resetAt,
        feature: feature
      }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true,
      usage: {
        feature: feature,
        count: result.used,
        limit: result.limit,
        resetAt: result.resetAt,
        allowed: result.allowed,
      }
    });
  } catch (error) {
    console.error('Usage tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}