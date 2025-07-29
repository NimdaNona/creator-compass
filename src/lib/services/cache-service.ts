import redis, { CACHE_TTL, CacheOptions, getCacheKey, parseTTL } from '@/lib/redis';
import { performance } from 'perf_hooks';

export class CacheService {
  private static instance: CacheService;
  private hitRate = { hits: 0, misses: 0 };

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const startTime = performance.now();
      const value = await redis.get(key);
      const duration = performance.now() - startTime;

      if (value !== null) {
        this.hitRate.hits++;
        console.log(`[Cache HIT] ${key} (${duration.toFixed(2)}ms)`);
        return value as T;
      }

      this.hitRate.misses++;
      console.log(`[Cache MISS] ${key}`);
      return null;
    } catch (error) {
      console.error('[Cache Error] Get failed:', error);
      return null;
    }
  }

  /**
   * Set a value in cache with optional TTL and tags
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const ttl = parseTTL(options?.ttl);
      const startTime = performance.now();

      if (ttl) {
        await redis.setex(key, ttl, JSON.stringify(value));
      } else {
        await redis.set(key, JSON.stringify(value));
      }

      // Store tags for invalidation
      if (options?.tags && options.tags.length > 0) {
        await this.addToTags(key, options.tags);
      }

      const duration = performance.now() - startTime;
      console.log(`[Cache SET] ${key} TTL:${ttl}s (${duration.toFixed(2)}ms)`);
    } catch (error) {
      console.error('[Cache Error] Set failed:', error);
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await redis.del(key);
      console.log(`[Cache DELETE] ${key}`);
    } catch (error) {
      console.error('[Cache Error] Delete failed:', error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      // Note: Upstash doesn't support SCAN, so we need to be careful with patterns
      // This is a simplified implementation
      const keys = await this.getKeysByPattern(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`[Cache DELETE] Pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      console.error('[Cache Error] Delete pattern failed:', error);
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      const keysToDelete = new Set<string>();

      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        const keys = await redis.smembers(tagKey);
        keys.forEach(key => keysToDelete.add(key as string));
        await redis.del(tagKey);
      }

      if (keysToDelete.size > 0) {
        await redis.del(...Array.from(keysToDelete));
        console.log(`[Cache INVALIDATE] Tags: ${tags.join(', ')} (${keysToDelete.size} keys)`);
      }
    } catch (error) {
      console.error('[Cache Error] Invalidate by tags failed:', error);
    }
  }

  /**
   * Cache wrapper function with automatic cache-aside pattern
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, options);
    return result;
  }

  /**
   * Batch get multiple keys
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const values = await redis.mget(...keys);
      return values.map(value => (value ? JSON.parse(value as string) : null));
    } catch (error) {
      console.error('[Cache Error] Batch get failed:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Batch set multiple key-value pairs
   */
  async mset<T>(items: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void> {
    try {
      // Group by TTL for efficient batch operations
      const byTTL = new Map<number | undefined, Array<{ key: string; value: T }>>();

      items.forEach(item => {
        const ttl = parseTTL(item.options?.ttl);
        if (!byTTL.has(ttl)) {
          byTTL.set(ttl, []);
        }
        byTTL.get(ttl)!.push({ key: item.key, value: item.value });
      });

      // Execute batch operations
      for (const [ttl, batch] of byTTL) {
        const pipeline = redis.pipeline();
        
        batch.forEach(({ key, value }) => {
          if (ttl) {
            pipeline.setex(key, ttl, JSON.stringify(value));
          } else {
            pipeline.set(key, JSON.stringify(value));
          }
        });

        await pipeline.exec();
      }

      console.log(`[Cache MSET] ${items.length} keys`);
    } catch (error) {
      console.error('[Cache Error] Batch set failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hitRate.hits + this.hitRate.misses;
    const hitRatio = total > 0 ? (this.hitRate.hits / total) * 100 : 0;

    return {
      hits: this.hitRate.hits,
      misses: this.hitRate.misses,
      total,
      hitRatio: hitRatio.toFixed(2) + '%',
    };
  }

  /**
   * Clear all cache (use with caution!)
   */
  async clearAll(): Promise<void> {
    try {
      await redis.flushdb();
      console.log('[Cache CLEAR] All cache cleared');
    } catch (error) {
      console.error('[Cache Error] Clear all failed:', error);
    }
  }

  // Private helper methods

  private async addToTags(key: string, tags: string[]): Promise<void> {
    const pipeline = redis.pipeline();
    tags.forEach(tag => {
      pipeline.sadd(`tag:${tag}`, key);
    });
    await pipeline.exec();
  }

  private async getKeysByPattern(pattern: string): Promise<string[]> {
    // Simplified pattern matching for Upstash
    // In production, you might want to maintain an index of keys
    const keys: string[] = [];
    
    // This is a placeholder - Upstash doesn't support SCAN
    // You would need to implement key tracking separately
    console.warn('[Cache] Pattern matching not fully supported with Upstash');
    
    return keys;
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Convenience cache decorators
export function Cacheable(options?: CacheOptions) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = getCacheKey(
        'method:',
        target.constructor.name,
        propertyName,
        JSON.stringify(args)
      );

      return cacheService.wrap(key, () => method.apply(this, args), options);
    };

    return descriptor;
  };
}

// Cache invalidation helpers
export const cacheInvalidation = {
  user: (userId: string) => cacheService.invalidateByTags([`user:${userId}`]),
  roadmap: (roadmapId: string) => cacheService.invalidateByTags([`roadmap:${roadmapId}`]),
  template: (templateId: string) => cacheService.invalidateByTags([`template:${templateId}`]),
  analytics: (userId: string) => cacheService.invalidateByTags([`analytics:${userId}`]),
  platform: (platform: string) => cacheService.invalidateByTags([`platform:${platform}`]),
};