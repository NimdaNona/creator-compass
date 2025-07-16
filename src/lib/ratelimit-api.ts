import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple in-memory rate limiter for API routes
 * In production, you should use Upstash Redis or similar
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimiter {
  tokensPerInterval: number;
  interval: number; // in milliseconds
  store: RateLimitStore;
}

// Create rate limiters for different endpoints
const createRateLimiter = (tokensPerInterval: number, intervalMs: number): RateLimiter => ({
  tokensPerInterval,
  interval: intervalMs,
  store: {},
});

// Define rate limiters for different endpoint types
export const ratelimiters = {
  api: createRateLimiter(100, 60 * 1000), // 100 requests per minute
  payment: createRateLimiter(20, 60 * 1000), // 20 requests per minute
  ai: createRateLimiter(10, 60 * 1000), // 10 requests per minute
  webhook: createRateLimiter(1000, 60 * 1000), // 1000 requests per minute
};

/**
 * Rate limit middleware function
 */
export async function rateLimit(
  request: NextRequest,
  limiter: RateLimiter | null
): Promise<NextResponse | null> {
  // If no limiter provided, skip rate limiting
  if (!limiter) {
    return null;
  }

  // Get identifier (IP address or user ID)
  const identifier = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'anonymous';

  const now = Date.now();
  const record = limiter.store[identifier];

  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    cleanupStore(limiter.store, now);
  }

  // Check if we have a record and if it's still valid
  if (!record || now > record.resetTime) {
    // Create new record
    limiter.store[identifier] = {
      count: 1,
      resetTime: now + limiter.interval,
    };
    return null; // Allow request
  }

  // Check if limit exceeded
  if (record.count >= limiter.tokensPerInterval) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': limiter.tokensPerInterval.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
        },
      }
    );
  }

  // Increment counter
  record.count++;

  // Return null to allow request to proceed
  return null;
}

/**
 * Clean up expired entries from the store
 */
function cleanupStore(store: RateLimitStore, now: number) {
  for (const key in store) {
    if (now > store[key].resetTime + 60000) { // Clean up entries older than 1 minute past reset
      delete store[key];
    }
  }
}

/**
 * Get current usage for an identifier
 */
export function getRateLimitUsage(
  identifier: string,
  limiter: RateLimiter
): { used: number; total: number; resetIn: number } {
  const now = Date.now();
  const record = limiter.store[identifier];

  if (!record || now > record.resetTime) {
    return { used: 0, total: limiter.tokensPerInterval, resetIn: 0 };
  }

  return {
    used: record.count,
    total: limiter.tokensPerInterval,
    resetIn: Math.max(0, record.resetTime - now),
  };
}