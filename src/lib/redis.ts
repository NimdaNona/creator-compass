import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export default redis;

// Helper types for cache operations
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Tags for cache invalidation
}

// Default TTL values (in seconds)
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
} as const;

// Cache key prefixes
export const CACHE_PREFIX = {
  USER: 'user:',
  ROADMAP: 'roadmap:',
  TEMPLATE: 'template:',
  ANALYTICS: 'analytics:',
  RESOURCE: 'resource:',
  ACHIEVEMENT: 'achievement:',
  PLATFORM: 'platform:',
  SESSION: 'session:',
  API: 'api:',
} as const;

// Helper to generate consistent cache keys
export function getCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}${parts.join(':')}`;
}

// Helper to parse TTL options
export function parseTTL(ttl?: number | keyof typeof CACHE_TTL): number | undefined {
  if (!ttl) return undefined;
  if (typeof ttl === 'string') {
    return CACHE_TTL[ttl];
  }
  return ttl;
}