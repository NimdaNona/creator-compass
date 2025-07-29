import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from '@/lib/services/cache-service';
import { CACHE_PREFIX, CACHE_TTL, getCacheKey } from '@/lib/redis';
import crypto from 'crypto';

interface CacheMiddlewareOptions {
  ttl?: number | keyof typeof CACHE_TTL;
  tags?: string[];
  varyBy?: string[]; // Headers to vary cache by (e.g., ['authorization', 'accept'])
  excludeParams?: string[]; // Query params to exclude from cache key
  enabled?: boolean;
}

/**
 * Create a cache key from request
 */
function createCacheKey(req: NextRequest, options?: CacheMiddlewareOptions): string {
  const url = new URL(req.url);
  const method = req.method;
  const pathname = url.pathname;

  // Build query params excluding specified ones
  const params = new URLSearchParams(url.searchParams);
  options?.excludeParams?.forEach(param => params.delete(param));
  const queryString = params.toString();

  // Include vary headers in cache key
  const varyParts: string[] = [];
  if (options?.varyBy) {
    options.varyBy.forEach(header => {
      const value = req.headers.get(header);
      if (value) {
        varyParts.push(`${header}:${value}`);
      }
    });
  }

  // Create a hash of the cache key components
  const keyParts = [
    method,
    pathname,
    queryString,
    ...varyParts,
  ].filter(Boolean);

  const hash = crypto
    .createHash('md5')
    .update(keyParts.join('|'))
    .digest('hex');

  return getCacheKey(CACHE_PREFIX.API, pathname.replace(/\//g, ':'), hash);
}

/**
 * Cache middleware for API routes
 */
export function withCache(options: CacheMiddlewareOptions = {}) {
  return async function cacheMiddleware(
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Skip caching if disabled or not a GET request
    if (options.enabled === false || req.method !== 'GET') {
      return handler(req);
    }

    const cacheKey = createCacheKey(req, options);

    try {
      // Try to get from cache
      const cached = await cacheService.get<{
        body: any;
        headers: Record<string, string>;
        status: number;
      }>(cacheKey);

      if (cached) {
        // Return cached response
        const response = NextResponse.json(cached.body, {
          status: cached.status,
          headers: cached.headers,
        });

        // Add cache headers
        response.headers.set('X-Cache', 'HIT');
        response.headers.set('X-Cache-Key', cacheKey);
        
        return response;
      }
    } catch (error) {
      console.error('[Cache Middleware] Error reading cache:', error);
    }

    // Execute handler
    const response = await handler(req);

    // Only cache successful responses
    if (response.status >= 200 && response.status < 300) {
      try {
        // Clone response to read body
        const clonedResponse = response.clone();
        const body = await clonedResponse.json();

        // Extract headers we want to cache
        const headers: Record<string, string> = {};
        ['content-type', 'cache-control', 'etag'].forEach(header => {
          const value = response.headers.get(header);
          if (value) headers[header] = value;
        });

        // Cache the response
        await cacheService.set(
          cacheKey,
          {
            body,
            headers,
            status: response.status,
          },
          {
            ttl: options.ttl,
            tags: options.tags,
          }
        );

        // Add cache headers
        response.headers.set('X-Cache', 'MISS');
        response.headers.set('X-Cache-Key', cacheKey);
      } catch (error) {
        console.error('[Cache Middleware] Error caching response:', error);
      }
    }

    return response;
  };
}

/**
 * Stale-while-revalidate cache pattern
 */
export function withSWRCache(options: CacheMiddlewareOptions & { staleTime?: number } = {}) {
  return async function swrCacheMiddleware(
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    if (options.enabled === false || req.method !== 'GET') {
      return handler(req);
    }

    const cacheKey = createCacheKey(req, options);
    const staleKey = `${cacheKey}:stale`;

    try {
      // Try to get from cache
      const cached = await cacheService.get<{
        body: any;
        headers: Record<string, string>;
        status: number;
        timestamp: number;
      }>(cacheKey);

      if (cached) {
        const age = Date.now() - cached.timestamp;
        const staleTime = options.staleTime || 60000; // 1 minute default

        if (age < staleTime) {
          // Fresh cache, return immediately
          const response = NextResponse.json(cached.body, {
            status: cached.status,
            headers: cached.headers,
          });

          response.headers.set('X-Cache', 'HIT');
          response.headers.set('X-Cache-Age', String(Math.floor(age / 1000)));
          
          return response;
        } else {
          // Stale cache, return it but revalidate in background
          const response = NextResponse.json(cached.body, {
            status: cached.status,
            headers: cached.headers,
          });

          response.headers.set('X-Cache', 'STALE');
          response.headers.set('X-Cache-Age', String(Math.floor(age / 1000)));

          // Revalidate in background
          revalidateInBackground(req, handler, cacheKey, options);

          return response;
        }
      }
    } catch (error) {
      console.error('[SWR Cache] Error reading cache:', error);
    }

    // No cache, execute handler
    return executeAndCache(req, handler, cacheKey, options);
  };
}

/**
 * Helper to execute handler and cache result
 */
async function executeAndCache(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  cacheKey: string,
  options: CacheMiddlewareOptions
): Promise<NextResponse> {
  const response = await handler(req);

  if (response.status >= 200 && response.status < 300) {
    try {
      const clonedResponse = response.clone();
      const body = await clonedResponse.json();

      const headers: Record<string, string> = {};
      ['content-type', 'cache-control', 'etag'].forEach(header => {
        const value = response.headers.get(header);
        if (value) headers[header] = value;
      });

      await cacheService.set(
        cacheKey,
        {
          body,
          headers,
          status: response.status,
          timestamp: Date.now(),
        },
        {
          ttl: options.ttl,
          tags: options.tags,
        }
      );

      response.headers.set('X-Cache', 'MISS');
    } catch (error) {
      console.error('[Cache] Error caching response:', error);
    }
  }

  return response;
}

/**
 * Background revalidation for SWR
 */
function revalidateInBackground(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  cacheKey: string,
  options: CacheMiddlewareOptions
): void {
  // Clone request for background processing
  const clonedReq = req.clone();

  // Execute in background
  Promise.resolve().then(async () => {
    try {
      await executeAndCache(clonedReq, handler, cacheKey, options);
    } catch (error) {
      console.error('[SWR Cache] Background revalidation failed:', error);
    }
  });
}

/**
 * Create cache headers based on options
 */
export function createCacheHeaders(options: {
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  mustRevalidate?: boolean;
  private?: boolean;
}): Record<string, string> {
  const parts: string[] = [];

  if (options.private) {
    parts.push('private');
  } else {
    parts.push('public');
  }

  if (options.maxAge !== undefined) {
    parts.push(`max-age=${options.maxAge}`);
  }

  if (options.sMaxAge !== undefined) {
    parts.push(`s-maxage=${options.sMaxAge}`);
  }

  if (options.staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }

  if (options.mustRevalidate) {
    parts.push('must-revalidate');
  }

  return {
    'Cache-Control': parts.join(', '),
  };
}