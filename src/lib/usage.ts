import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth } from 'date-fns';

export type UsageFeature = 'templates' | 'platforms' | 'exports' | 'analytics';

interface UsageLimit {
  [key: string]: number;
}

const FREE_LIMITS: UsageLimit = {
  templates: 5,
  platforms: 1,
  exports: 3,
  analytics: 0,  // Premium only
};

const PRO_LIMITS: UsageLimit = {
  templates: 50,
  platforms: 3,
  exports: -1,  // Unlimited
  analytics: -1, // Unlimited
};

const STUDIO_LIMITS: UsageLimit = {
  templates: -1,  // Unlimited
  platforms: -1,  // Unlimited
  exports: -1,   // Unlimited
  analytics: -1,  // Unlimited
};

export async function trackUsage(
  userId: string,
  feature: UsageFeature,
  increment: boolean = false
): Promise<{ allowed: boolean; limit: number; used: number; resetAt: Date }> {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Get user with subscription
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Determine limits based on subscription
  let limits = FREE_LIMITS;
  if (user.subscription?.status === 'active') {
    if (user.subscription.priceId?.includes('studio')) {
      limits = STUDIO_LIMITS;
    } else {
      limits = PRO_LIMITS;
    }
  }

  const limit = limits[feature];

  // Get or create usage record for this month
  let usage = await prisma.usageTracking.findFirst({
    where: {
      userId,
      feature,
      month: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  if (!usage) {
    usage = await prisma.usageTracking.create({
      data: {
        userId,
        feature,
        count: 0,
        month: monthStart,
      },
    });
  }

  // Check if allowed
  const allowed = limit === -1 || usage.count < limit;

  // Increment if requested and allowed
  if (increment && allowed) {
    usage = await prisma.usageTracking.update({
      where: { id: usage.id },
      data: { count: { increment: 1 } },
    });
  }

  return {
    allowed,
    limit,
    used: usage.count,
    resetAt: monthEnd,
  };
}

export async function getUsageStats(userId: string) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Get user with subscription
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Determine limits based on subscription
  let limits = FREE_LIMITS;
  let plan = 'free';
  
  if (user.subscription?.status === 'active') {
    if (user.subscription.priceId?.includes('studio')) {
      limits = STUDIO_LIMITS;
      plan = 'studio';
    } else {
      limits = PRO_LIMITS;
      plan = 'pro';
    }
  }

  // Get all usage records for this month
  const usageRecords = await prisma.usageTracking.findMany({
    where: {
      userId,
      month: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });

  // Build usage stats
  const usage: any = {};
  const features: UsageFeature[] = ['templates', 'platforms', 'exports', 'analytics'];

  for (const feature of features) {
    const record = usageRecords.find(r => r.feature === feature);
    const count = record?.count || 0;
    const limit = limits[feature];
    
    usage[feature] = {
      count,
      limit,
      resetAt: monthEnd.toISOString(),
      percentage: limit === -1 ? 0 : Math.round((count / limit) * 100),
    };
  }

  return {
    usage,
    limits,
    plan,
  };
}