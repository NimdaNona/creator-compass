import { db } from '@/lib/db';
import { startOfMonth, endOfMonth, addMonths, startOfDay, endOfDay, addDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export type UsageFeature = 'templates' | 'platforms' | 'exports' | 'analytics' | 'crossPlatform' | 'ideas';

interface UsageLimit {
  [key: string]: number;
}

const FREE_LIMITS: UsageLimit = {
  templates: 5,
  platforms: 1,
  exports: 3,
  analytics: 0,  // Premium only
  crossPlatform: 0, // Premium only
  ideas: 5, // 5 ideas per day (daily reset)
};

const PRO_LIMITS: UsageLimit = {
  templates: 50,
  platforms: 3,
  exports: -1,  // Unlimited
  analytics: -1, // Unlimited
  crossPlatform: 10, // 10 adaptations per month
  ideas: -1, // Unlimited
};

const STUDIO_LIMITS: UsageLimit = {
  templates: -1,  // Unlimited
  platforms: -1,  // Unlimited
  exports: -1,   // Unlimited
  analytics: -1,  // Unlimited
  crossPlatform: -1, // Unlimited
  ideas: -1, // Unlimited
};

// Features that reset daily instead of monthly
const DAILY_RESET_FEATURES = ['ideas'];

/**
 * Get the next reset date in UTC
 * @param feature - The feature to get reset date for
 * @param timezone - User's timezone (defaults to UTC)
 */
export function getNextResetDate(feature: string, timezone: string = 'UTC'): Date {
  const nowUtc = new Date();
  const nowInTimezone = toZonedTime(nowUtc, timezone);
  
  let nextResetInTimezone: Date;
  
  if (DAILY_RESET_FEATURES.includes(feature)) {
    // Daily reset at midnight in user's timezone
    nextResetInTimezone = startOfDay(addDays(nowInTimezone, 1));
  } else {
    // Monthly reset at midnight on the 1st in user's timezone
    nextResetInTimezone = startOfMonth(addMonths(nowInTimezone, 1));
  }
  
  // Convert back to UTC for storage
  return fromZonedTime(nextResetInTimezone, timezone);
}

/**
 * Check if a reset date has passed
 */
export function shouldReset(resetAt: Date): boolean {
  return new Date() >= resetAt;
}

/**
 * Get the current period boundaries in UTC
 */
export function getCurrentPeriod(feature: string, timezone: string = 'UTC'): { start: Date; end: Date } {
  const nowUtc = new Date();
  const nowInTimezone = toZonedTime(nowUtc, timezone);
  
  let startInTimezone: Date;
  let endInTimezone: Date;
  
  if (DAILY_RESET_FEATURES.includes(feature)) {
    startInTimezone = startOfDay(nowInTimezone);
    endInTimezone = endOfDay(nowInTimezone);
  } else {
    startInTimezone = startOfMonth(nowInTimezone);
    endInTimezone = endOfMonth(nowInTimezone);
  }
  
  return {
    start: fromZonedTime(startInTimezone, timezone),
    end: fromZonedTime(endInTimezone, timezone),
  };
}

export async function trackUsage(
  userId: string,
  feature: UsageFeature,
  increment: boolean = false,
  timezone: string = 'UTC'
): Promise<{ allowed: boolean; limit: number; used: number; resetAt: Date }> {
  // Get user with subscription and profile (for timezone)
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { 
      subscription: true,
      profile: true 
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Use user's timezone if available
  const userPreferences = user.profile?.preferences as any;
  const userTimezone = userPreferences?.timezone || timezone || 'UTC';

  // Determine limits based on subscription
  let limits = FREE_LIMITS;
  if (user.subscription?.status === 'active') {
    if (user.subscription.stripePriceId?.includes('studio') || 
        user.subscription.yearlyPriceId?.includes('studio')) {
      limits = STUDIO_LIMITS;
    } else {
      limits = PRO_LIMITS;
    }
  }

  const limit = limits[feature];

  // Get or create usage record
  let usage = await db.usageTracking.findUnique({
    where: {
      userId_feature: {
        userId,
        feature,
      },
    },
  });

  // If no usage record exists, create one
  if (!usage) {
    usage = await db.usageTracking.create({
      data: {
        userId,
        feature,
        count: 0,
        limit,
        resetAt: getNextResetDate(feature, userTimezone),
      },
    });
  } else if (shouldReset(usage.resetAt)) {
    // Reset if the reset date has passed
    usage = await db.usageTracking.update({
      where: { id: usage.id },
      data: {
        count: 0,
        resetAt: getNextResetDate(feature, userTimezone),
      },
    });
  }

  // Check if allowed
  const allowed = limit === -1 || usage.count < limit;

  // Increment if requested and allowed
  if (increment && allowed) {
    usage = await db.usageTracking.update({
      where: { id: usage.id },
      data: { count: { increment: 1 } },
    });
  }

  return {
    allowed,
    limit,
    used: usage.count,
    resetAt: usage.resetAt,
  };
}

export async function getUsageStats(userId: string, timezone: string = 'UTC') {
  // Get user with subscription and profile
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { 
      subscription: true,
      profile: true 
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Use user's timezone if available
  const userPreferences = user.profile?.preferences as any;
  const userTimezone = userPreferences?.timezone || timezone || 'UTC';

  // Determine limits based on subscription
  let limits = FREE_LIMITS;
  let plan = 'free';
  
  if (user.subscription?.status === 'active') {
    if (user.subscription.stripePriceId?.includes('studio') || 
        user.subscription.yearlyPriceId?.includes('studio')) {
      limits = STUDIO_LIMITS;
      plan = 'studio';
    } else {
      limits = PRO_LIMITS;
      plan = 'pro';
    }
  }

  // Get all usage records
  const usageRecords = await db.usageTracking.findMany({
    where: { userId },
  });

  // Build usage stats
  const usage: any = {};
  const features: UsageFeature[] = ['templates', 'platforms', 'exports', 'analytics', 'crossPlatform', 'ideas'];

  for (const feature of features) {
    const record = usageRecords.find(r => r.feature === feature);
    
    // Check if we need to reset this record
    if (record && shouldReset(record.resetAt)) {
      // Reset the count (this will be persisted on next trackUsage call)
      record.count = 0;
      record.resetAt = getNextResetDate(feature, userTimezone);
    }
    
    const count = record?.count || 0;
    const limit = limits[feature];
    const resetAt = record?.resetAt || getNextResetDate(feature, userTimezone);
    
    usage[feature] = {
      count,
      limit,
      resetAt: resetAt.toISOString(),
      percentage: limit === -1 ? 0 : Math.round((count / limit) * 100),
      isDaily: DAILY_RESET_FEATURES.includes(feature),
    };
  }

  return {
    usage,
    limits,
    plan,
    timezone: userTimezone,
  };
}

/**
 * Reset usage for all users whose reset dates have passed
 * This should be called by a cron job
 */
export async function resetExpiredUsage() {
  const now = new Date();
  
  // Find all usage records that need to be reset
  const recordsToReset = await db.usageTracking.findMany({
    where: {
      resetAt: {
        lte: now,
      },
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  // Reset the counts
  const resetPromises = recordsToReset.map(record => {
    const userPreferences = record.user.profile?.preferences as any;
    const userTimezone = userPreferences?.timezone || 'UTC';
    
    return db.usageTracking.update({
      where: { id: record.id },
      data: {
        count: 0,
        resetAt: getNextResetDate(record.feature, userTimezone),
      },
    });
  });

  const results = await Promise.all(resetPromises);
  
  return {
    resetCount: results.length,
    timestamp: now.toISOString(),
  };
}