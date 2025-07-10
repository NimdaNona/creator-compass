import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ratelimiters, rateLimit } from '@/lib/ratelimit';

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
      include: { 
        subscription: true,
        usageTracking: true
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get subscription plan features
    const plan = user.subscription?.plan || 'free';
    const limits = getFeatureLimits(plan);

    // Transform usage tracking data
    const usage = {
      templates: getUsageForFeature(user.usageTracking, 'templates', limits.templates),
      platforms: getUsageForFeature(user.usageTracking, 'platforms', limits.platforms),
      exports: getUsageForFeature(user.usageTracking, 'exports', limits.exports),
      analytics: getUsageForFeature(user.usageTracking, 'analytics', limits.analytics),
    };

    return NextResponse.json({ 
      usage,
      limits,
      plan 
    });
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
    const { feature, increment = 1 } = body;

    if (!feature || !['templates', 'platforms', 'exports', 'analytics'].includes(feature)) {
      return NextResponse.json({ error: 'Invalid feature' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const plan = user.subscription?.plan || 'free';
    const limit = getFeatureLimit(feature, plan);
    
    // Get or create usage tracking record
    const existingUsage = await prisma.usageTracking.findUnique({
      where: {
        userId_feature: {
          userId: user.id,
          feature: feature,
        },
      },
    });

    // Check if reset is needed
    const now = new Date();
    if (existingUsage && existingUsage.resetAt < now) {
      // Reset the count
      await prisma.usageTracking.update({
        where: { id: existingUsage.id },
        data: {
          count: increment,
          resetAt: getNextResetDate(feature),
        },
      });
    } else if (existingUsage) {
      // Check if limit would be exceeded
      if (existingUsage.count + increment > limit) {
        return NextResponse.json({ 
          error: 'Usage limit exceeded',
          current: existingUsage.count,
          limit: limit,
          feature: feature
        }, { status: 403 });
      }

      // Increment usage
      await prisma.usageTracking.update({
        where: { id: existingUsage.id },
        data: {
          count: { increment: increment },
        },
      });
    } else {
      // Create new usage record
      await prisma.usageTracking.create({
        data: {
          userId: user.id,
          feature: feature,
          count: increment,
          limit: limit,
          resetAt: getNextResetDate(feature),
        },
      });
    }

    // Return updated usage
    const updatedUsage = await prisma.usageTracking.findUnique({
      where: {
        userId_feature: {
          userId: user.id,
          feature: feature,
        },
      },
    });

    return NextResponse.json({ 
      success: true,
      usage: {
        feature: updatedUsage?.feature,
        count: updatedUsage?.count || increment,
        limit: limit,
        resetAt: updatedUsage?.resetAt || getNextResetDate(feature),
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

// Helper functions
function getFeatureLimits(plan: string) {
  const limits = {
    free: {
      templates: 5,      // 5 templates per month
      platforms: 1,      // 1 platform only
      exports: 0,        // No exports
      analytics: 0,      // No analytics
    },
    premium: {
      templates: 50,     // 50 templates per month
      platforms: 3,      // All 3 platforms
      exports: 10,       // 10 exports per month
      analytics: 1,      // Full analytics access
    },
    enterprise: {
      templates: -1,     // Unlimited
      platforms: 3,      // All platforms
      exports: -1,       // Unlimited
      analytics: 1,      // Full analytics access
    },
  };

  return limits[plan as keyof typeof limits] || limits.free;
}

function getFeatureLimit(feature: string, plan: string): number {
  const limits = getFeatureLimits(plan);
  return limits[feature as keyof typeof limits] || 0;
}

function getUsageForFeature(
  usageRecords: any[], 
  feature: string, 
  limit: number
) {
  const record = usageRecords.find(u => u.feature === feature);
  
  if (!record) {
    return {
      count: 0,
      limit: limit,
      resetAt: getNextResetDate(feature),
      percentage: 0,
    };
  }

  // Check if reset is needed
  const now = new Date();
  if (record.resetAt < now) {
    return {
      count: 0,
      limit: limit,
      resetAt: getNextResetDate(feature),
      percentage: 0,
    };
  }

  const percentage = limit > 0 ? Math.round((record.count / limit) * 100) : 0;
  
  return {
    count: record.count,
    limit: limit,
    resetAt: record.resetAt,
    percentage: percentage,
  };
}

function getNextResetDate(feature: string): Date {
  const now = new Date();
  
  // All features reset monthly for now
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  nextMonth.setHours(0, 0, 0, 0);
  
  return nextMonth;
}