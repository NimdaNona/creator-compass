import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Initialize Redis client
const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

// Fallback to in-memory rate limiting if Redis is not available
import { ratelimiters as inMemoryLimiters } from './ratelimit-api';

// Rate limit configurations per tier
const RATE_LIMITS = {
  free: {
    general: 600,    // 600 req/min (10 req/sec) - Increased for better UX
    ai: 60,          // 60 req/min - Increased for better chat experience
    template: 30,    // 30 req/min
    auth: 20,        // 20 req/min
    stripe: 20,      // 20 req/min
    export: 15,      // 15 req/min
  },
  pro: {
    general: 1200,   // 1200 req/min (20 req/sec)
    ai: 120,         // 120 req/min
    template: 60,    // 60 req/min
    auth: 40,        // 40 req/min
    stripe: 40,      // 40 req/min
    export: 60,      // 60 req/min
  },
  studio: {
    general: 2400,   // 2400 req/min (40 req/sec)
    ai: 240,         // 240 req/min
    template: 120,   // 120 req/min
    auth: 60,        // 60 req/min
    stripe: 60,      // 60 req/min
    export: 120,     // 120 req/min
  },
  public: {
    auth: 20,        // 20 req/min for public auth endpoints - Increased from 5
    webhook: 1000,   // 1000 req/min for webhooks
  }
};

// Create rate limiters for different endpoint types
const createRateLimiter = (tokens: number) => {
  if (!redis) return null;
  
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, '1 m'),
    analytics: true,
    prefix: 'ratelimit',
  });
};

// Rate limiter instances per tier and type
const rateLimiters = {
  free: {
    general: redis ? createRateLimiter(RATE_LIMITS.free.general) : null,
    ai: redis ? createRateLimiter(RATE_LIMITS.free.ai) : null,
    template: redis ? createRateLimiter(RATE_LIMITS.free.template) : null,
    auth: redis ? createRateLimiter(RATE_LIMITS.free.auth) : null,
    stripe: redis ? createRateLimiter(RATE_LIMITS.free.stripe) : null,
    export: redis ? createRateLimiter(RATE_LIMITS.free.export) : null,
  },
  pro: {
    general: redis ? createRateLimiter(RATE_LIMITS.pro.general) : null,
    ai: redis ? createRateLimiter(RATE_LIMITS.pro.ai) : null,
    template: redis ? createRateLimiter(RATE_LIMITS.pro.template) : null,
    auth: redis ? createRateLimiter(RATE_LIMITS.pro.auth) : null,
    stripe: redis ? createRateLimiter(RATE_LIMITS.pro.stripe) : null,
    export: redis ? createRateLimiter(RATE_LIMITS.pro.export) : null,
  },
  studio: {
    general: redis ? createRateLimiter(RATE_LIMITS.studio.general) : null,
    ai: redis ? createRateLimiter(RATE_LIMITS.studio.ai) : null,
    template: redis ? createRateLimiter(RATE_LIMITS.studio.template) : null,
    auth: redis ? createRateLimiter(RATE_LIMITS.studio.auth) : null,
    stripe: redis ? createRateLimiter(RATE_LIMITS.studio.stripe) : null,
    export: redis ? createRateLimiter(RATE_LIMITS.studio.export) : null,
  },
  public: {
    auth: redis ? createRateLimiter(RATE_LIMITS.public.auth) : null,
    webhook: redis ? createRateLimiter(RATE_LIMITS.public.webhook) : null,
  }
};

export type RateLimitType = 'general' | 'ai' | 'template' | 'auth' | 'stripe' | 'export' | 'webhook';

/**
 * Get user's subscription tier
 */
async function getUserTier(userId: string): Promise<'free' | 'pro' | 'studio'> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscription: {
          select: {
            plan: true,
            status: true,
          }
        }
      }
    });

    if (!user?.subscription || user.subscription.status !== 'active') {
      return 'free';
    }

    return user.subscription.plan as 'free' | 'pro' | 'studio';
  } catch (error) {
    console.error('Error getting user tier:', error);
    return 'free';
  }
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  type: RateLimitType = 'general',
  identifier?: string
): Promise<RateLimitResult> {
  try {
    // Get session and identifier
    const session = await getServerSession(authOptions);
    let rateLimitId = identifier;
    let tier: 'free' | 'pro' | 'studio' | 'public' = 'public';

    if (session?.user?.email) {
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });

      if (user) {
        rateLimitId = user.id;
        tier = await getUserTier(user.id);
      }
    } else if (!rateLimitId) {
      // Use IP for unauthenticated requests
      const headersList = await headers();
      rateLimitId = headersList.get('x-forwarded-for') || 
                   headersList.get('x-real-ip') || 
                   'anonymous';
    }

    // Special handling for webhooks
    if (type === 'webhook') {
      tier = 'public';
    }

    // Get appropriate rate limiter
    const limiterSet = rateLimiters[tier];
    const limiter = limiterSet?.[type as keyof typeof limiterSet];

    if (!limiter || !redis) {
      // Fallback to in-memory rate limiting
      console.warn('Redis not available, using in-memory rate limiting');
      
      // Use appropriate in-memory limiter based on type
      const inMemoryLimiter = type === 'ai' ? inMemoryLimiters.ai : 
                             type === 'stripe' ? inMemoryLimiters.payment :
                             type === 'webhook' ? inMemoryLimiters.webhook :
                             inMemoryLimiters.api;
      
      // Update tokens based on tier
      if (tier !== 'public') {
        inMemoryLimiter.tokensPerInterval = RATE_LIMITS[tier][type as keyof typeof RATE_LIMITS.free] || RATE_LIMITS[tier].general;
      }
      
      const result = await (await import('./ratelimit-api')).getRateLimitUsage(rateLimitId || 'anonymous', inMemoryLimiter);
      
      return {
        success: result.used < result.total,
        limit: result.total,
        remaining: Math.max(0, result.total - result.used),
        reset: new Date(Date.now() + result.resetIn),
        retryAfter: result.used >= result.total ? Math.ceil(result.resetIn / 1000) : undefined,
      };
    }

    // Check rate limit with Upstash
    const { success, limit, remaining, reset } = await limiter.limit(rateLimitId || 'anonymous');

    return {
      success,
      limit,
      remaining,
      reset: new Date(reset),
      retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1000),
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request but log it
    return {
      success: true,
      limit: 1000,
      remaining: 999,
      reset: new Date(Date.now() + 60000),
    };
  }
}

/**
 * Format rate limit headers
 */
export function formatRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toISOString(),
  };

  if (result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Create rate limit error response
 */
export function createRateLimitError(result: RateLimitResult) {
  return {
    error: 'Rate limit exceeded',
    message: 'You\'ve made too many requests. Please slow down.',
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset.toISOString(),
    retryAfter: result.retryAfter,
  };
}