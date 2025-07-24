import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export interface SubscriptionCheckResult {
  hasAccess: boolean;
  error?: string;
  subscription?: {
    plan: string;
    status: string;
    isActive: boolean;
  };
  isFreeTier: boolean;
}

/**
 * Server-side subscription check middleware
 * Validates user's subscription status and determines feature access
 */
export async function requireSubscription(
  requiredPlan?: 'free' | 'pro' | 'studio',
  featureName?: string
): Promise<SubscriptionCheckResult> {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return {
        hasAccess: false,
        error: 'Authentication required',
        isFreeTier: false
      };
    }

    // Get user with subscription
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscription: true,
        profile: true
      }
    });

    if (!user) {
      return {
        hasAccess: false,
        error: 'User not found',
        isFreeTier: false
      };
    }

    // Check if user has a subscription
    const subscription = user.subscription;
    
    // If no subscription, user is on free tier
    if (!subscription) {
      return {
        hasAccess: requiredPlan === 'free' || !requiredPlan,
        isFreeTier: true,
        subscription: {
          plan: 'free',
          status: 'active',
          isActive: true
        }
      };
    }

    // Check subscription status
    const isActive = subscription.status === 'active' || 
                    subscription.status === 'trialing';

    // Determine access based on plan hierarchy
    let hasAccess = false;
    
    if (requiredPlan === 'free') {
      // Everyone has access to free features
      hasAccess = true;
    } else if (requiredPlan === 'pro') {
      // Pro and Studio users have access
      hasAccess = isActive && ['pro', 'studio'].includes(subscription.plan);
    } else if (requiredPlan === 'studio') {
      // Only Studio users have access
      hasAccess = isActive && subscription.plan === 'studio';
    } else if (!requiredPlan) {
      // No specific plan required, check if subscription is active
      hasAccess = isActive;
    }

    return {
      hasAccess,
      isFreeTier: false,
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        isActive
      },
      error: hasAccess ? undefined : `${featureName || 'This feature'} requires ${requiredPlan || 'a paid'} subscription`
    };

  } catch (error) {
    console.error('[Subscription Check] Error:', error);
    return {
      hasAccess: false,
      error: 'Failed to verify subscription',
      isFreeTier: false
    };
  }
}

/**
 * Creates a Next.js API response with subscription check
 * Use this wrapper for API routes that require subscription
 */
export function withSubscription(
  handler: (req: Request, subscription: SubscriptionCheckResult) => Promise<Response>,
  requiredPlan?: 'free' | 'pro' | 'studio',
  featureName?: string
) {
  return async (req: Request) => {
    const subscriptionCheck = await requireSubscription(requiredPlan, featureName);
    
    if (!subscriptionCheck.hasAccess) {
      return NextResponse.json(
        { 
          error: subscriptionCheck.error || 'Access denied',
          requiresUpgrade: true,
          currentPlan: subscriptionCheck.subscription?.plan || 'free',
          requiredPlan: requiredPlan || 'pro'
        },
        { status: 403 }
      );
    }

    return handler(req, subscriptionCheck);
  };
}

/**
 * Check feature-specific access limits
 */
export async function checkFeatureLimit(
  userId: string,
  feature: 'templates' | 'platforms' | 'exports' | 'analytics' | 'ai',
  isFreeTier: boolean
): Promise<{ allowed: boolean; limit?: number; used?: number; error?: string }> {
  try {
    // Get current month's usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const usage = await db.usageTracking.findFirst({
      where: {
        userId,
        month: startOfMonth
      }
    });

    // Define limits for free tier
    const freeTierLimits = {
      templates: 5,
      platforms: 1,
      exports: 3,
      analytics: 0, // No access
      ai: 10 // AI messages per month
    };

    if (!isFreeTier) {
      // No limits for paid users
      return { allowed: true };
    }

    const limit = freeTierLimits[feature];
    const used = usage ? usage[`${feature}Used`] || 0 : 0;

    // Special case for analytics - completely blocked for free tier
    if (feature === 'analytics' && isFreeTier) {
      return {
        allowed: false,
        limit: 0,
        used: 0,
        error: 'Analytics dashboard is only available for Pro and Studio plans'
      };
    }

    const allowed = used < limit;

    return {
      allowed,
      limit,
      used,
      error: allowed ? undefined : `You've reached your monthly limit of ${limit} ${feature}`
    };

  } catch (error) {
    console.error('[Feature Limit Check] Error:', error);
    return {
      allowed: false,
      error: 'Failed to check feature limits'
    };
  }
}

/**
 * Increment feature usage counter
 */
export async function incrementFeatureUsage(
  userId: string,
  feature: 'templates' | 'platforms' | 'exports' | 'analytics' | 'ai'
): Promise<void> {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    await db.usageTracking.upsert({
      where: {
        userId_month: {
          userId,
          month: startOfMonth
        }
      },
      update: {
        [`${feature}Used`]: {
          increment: 1
        }
      },
      create: {
        userId,
        month: startOfMonth,
        [`${feature}Used`]: 1
      }
    });
  } catch (error) {
    console.error('[Increment Usage] Error:', error);
    // Don't throw - we don't want to block the feature if tracking fails
  }
}