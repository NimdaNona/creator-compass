import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Redis client (only in production with proper configuration)
const redis = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

// Create rate limiters for different endpoints (only when Redis is available)
export const ratelimiters = redis
  ? {
      // General API rate limiter - 100 requests per minute
      api: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, '1 m'),
        analytics: true,
      }),

      // Authentication endpoints - 60 requests per minute
      auth: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, '1 m'),
        analytics: true,
      }),

      // Payment endpoints - 5 requests per minute
      payment: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '1 m'),
        analytics: true,
      }),

      // Stripe webhooks - 1000 requests per minute (high volume)
      webhook: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(1000, '1 m'),
        analytics: true,
      }),

      // Public endpoints - 200 requests per minute
      public: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(200, '1 m'),
        analytics: true,
      }),

      // User actions - 50 requests per minute
      user: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, '1 m'),
        analytics: true,
      }),
    }
  : null;

// Helper function to get client IP
export function getClientIP(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  if (xRealIp) {
    return xRealIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return request.ip || '127.0.0.1';
}

// Rate limit middleware
export async function rateLimit(
  request: NextRequest,
  limiter: Ratelimit | null,
  identifier?: string
): Promise<NextResponse | null> {
  // Skip rate limiting if no Redis connection or in development/test environment
  if (!limiter || process.env.NODE_ENV === 'test' || !redis) {
    return null;
  }

  const ip = getClientIP(request);
  const id = identifier || ip;

  try {
    const { success, limit, reset, remaining } = await limiter.limit(id);

    if (!success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.round((reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
            'Retry-After': Math.round((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open in case of rate limiting errors
    return null;
  }
}

// Higher-order function to wrap API routes with rate limiting
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiter: Ratelimit | null,
  getIdentifier?: (request: NextRequest) => string
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const identifier = getIdentifier ? getIdentifier(request) : undefined;
    const rateLimitResponse = await rateLimit(request, limiter, identifier);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(request);
  };
}

// Session-based rate limiting (for authenticated users)
export function withSessionRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limiter: Ratelimit | null
) {
  return withRateLimit(handler, limiter, (request: NextRequest) => {
    // Try to get user ID from session or auth header
    const authHeader = request.headers.get('authorization');
    const sessionCookie = request.cookies.get('next-auth.session-token');
    
    if (authHeader) {
      return `auth:${authHeader.substring(0, 20)}`;
    }
    
    if (sessionCookie) {
      return `session:${sessionCookie.value.substring(0, 20)}`;
    }
    
    return getClientIP(request);
  });
}

// Development mode fallback (when Redis is not available)
export function createMemoryRateLimit() {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return {
    check: (identifier: string, limit: number, windowMs: number) => {
      const now = Date.now();
      const key = identifier;
      const entry = requests.get(key);

      if (!entry || now > entry.resetTime) {
        requests.set(key, { count: 1, resetTime: now + windowMs });
        return { success: true, remaining: limit - 1 };
      }

      if (entry.count >= limit) {
        return { success: false, remaining: 0 };
      }

      entry.count++;
      return { success: true, remaining: limit - entry.count };
    },
  };
}

// Error handler for rate limit failures
export function handleRateLimitError(error: Error): NextResponse {
  console.error('Rate limit error:', error);
  
  // In production, fail open (allow the request) if rate limiting fails
  // In development, you might want to fail closed for testing
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Rate limiting service unavailable' },
      { status: 503 }
    );
  }

  // In development, continue without rate limiting
  return NextResponse.json(
    { error: 'Rate limiting disabled in development' },
    { status: 200 }
  );
}