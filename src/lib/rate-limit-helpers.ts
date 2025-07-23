import { NextResponse } from 'next/server';
import { checkRateLimit, formatRateLimitHeaders, createRateLimitError, type RateLimitType } from './redis-ratelimit';

/**
 * Helper function to apply rate limiting to API routes
 * This is used within API routes where we have access to full Node.js runtime
 */
export async function withRateLimit<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse<R>>,
  type: RateLimitType = 'general'
): Promise<(...args: T) => Promise<NextResponse>> {
  return async (...args: T): Promise<NextResponse> => {
    // Check rate limit
    const rateLimitResult = await checkRateLimit(type);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitError(rateLimitResult),
        {
          status: 429,
          headers: formatRateLimitHeaders(rateLimitResult)
        }
      );
    }
    
    // Execute handler
    const response = await handler(...args);
    
    // Add rate limit headers to response
    const headers = formatRateLimitHeaders(rateLimitResult);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}