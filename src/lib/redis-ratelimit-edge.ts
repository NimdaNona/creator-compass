import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

// Rate limit configurations per tier
const RATE_LIMITS = {
  free: {
    general: 300,    // 300 req/min (5 req/sec)
    ai: 30,          // 30 req/min
    template: 20,    // 20 req/min
    auth: 10,        // 10 req/min
    stripe: 10,      // 10 req/min
    export: 10,      // 10 req/min
  },
  pro: {
    general: 600,    // 600 req/min (10 req/sec)
    ai: 60,          // 60 req/min
    template: 40,    // 40 req/min
    auth: 20,        // 20 req/min
    stripe: 20,      // 20 req/min
    export: 30,      // 30 req/min
  },
  studio: {
    general: 1200,   // 1200 req/min (20 req/sec)
    ai: 120,         // 120 req/min
    template: 80,    // 80 req/min
    auth: 30,        // 30 req/min
    stripe: 30,      // 30 req/min
    export: 60,      // 60 req/min
  },
  public: {
    auth: 5,         // 5 req/min for public auth endpoints
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

// Simple in-memory rate limiter as fallback
class InMemoryRateLimiter {
  private storage = new Map<string, { count: number; resetAt: number }>();
  
  constructor(private tokens: number, private windowMs: number = 60000) {}
  
  async limit(identifier: string) {
    const now = Date.now();
    const entry = this.storage.get(identifier);
    
    if (!entry || now > entry.resetAt) {
      const resetAt = now + this.windowMs;
      this.storage.set(identifier, { count: 1, resetAt });
      return {
        success: true,
        limit: this.tokens,
        remaining: this.tokens - 1,
        reset: resetAt,
      };
    }
    
    if (entry.count >= this.tokens) {
      return {
        success: false,
        limit: this.tokens,
        remaining: 0,
        reset: entry.resetAt,
      };
    }
    
    entry.count++;
    return {
      success: true,
      limit: this.tokens,
      remaining: this.tokens - entry.count,
      reset: entry.resetAt,
    };
  }
}

// Rate limiter instances for public/unauthenticated access
const publicRateLimiters = {
  general: redis ? createRateLimiter(RATE_LIMITS.free.general) : new InMemoryRateLimiter(RATE_LIMITS.free.general),
  ai: redis ? createRateLimiter(RATE_LIMITS.free.ai) : new InMemoryRateLimiter(RATE_LIMITS.free.ai),
  template: redis ? createRateLimiter(RATE_LIMITS.free.template) : new InMemoryRateLimiter(RATE_LIMITS.free.template),
  auth: redis ? createRateLimiter(RATE_LIMITS.public.auth) : new InMemoryRateLimiter(RATE_LIMITS.public.auth),
  stripe: redis ? createRateLimiter(RATE_LIMITS.free.stripe) : new InMemoryRateLimiter(RATE_LIMITS.free.stripe),
  export: redis ? createRateLimiter(RATE_LIMITS.free.export) : new InMemoryRateLimiter(RATE_LIMITS.free.export),
  webhook: redis ? createRateLimiter(RATE_LIMITS.public.webhook) : new InMemoryRateLimiter(RATE_LIMITS.public.webhook),
};

export type RateLimitType = 'general' | 'ai' | 'template' | 'auth' | 'stripe' | 'export' | 'webhook';

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
 * Check rate limit for a request in Edge Runtime
 * This version doesn't use NextAuth and is compatible with Edge Runtime
 */
export async function checkRateLimitEdge(
  type: RateLimitType = 'general',
  identifier: string
): Promise<RateLimitResult> {
  try {
    // Get appropriate rate limiter
    const limiter = publicRateLimiters[type];

    if (!limiter) {
      // On error, allow the request but log it
      return {
        success: true,
        limit: 1000,
        remaining: 999,
        reset: new Date(Date.now() + 60000),
      };
    }

    // Check rate limit
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

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