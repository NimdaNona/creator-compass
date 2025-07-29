import { cacheService } from '@/lib/services/cache-service';
import { CACHE_PREFIX, getCacheKey } from '@/lib/redis';

/**
 * Cache invalidation strategies for different entities
 */

export class CacheInvalidator {
  /**
   * Invalidate all user-related caches
   */
  static async invalidateUser(userId: string): Promise<void> {
    const patterns = [
      getCacheKey(CACHE_PREFIX.USER, userId, '*'),
      getCacheKey(CACHE_PREFIX.SESSION, userId, '*'),
      getCacheKey(CACHE_PREFIX.ACHIEVEMENT, userId, '*'),
    ];

    await Promise.all([
      ...patterns.map(pattern => cacheService.deletePattern(pattern)),
      cacheService.invalidateByTags([`user:${userId}`]),
    ]);
  }

  /**
   * Invalidate roadmap and related progress caches
   */
  static async invalidateRoadmap(userId: string, platform?: string): Promise<void> {
    const tags = [`roadmap:${userId}`];
    
    if (platform) {
      tags.push(`platform:${platform}`);
      await cacheService.delete(getCacheKey(CACHE_PREFIX.ROADMAP, userId, platform));
    } else {
      // Invalidate all platform roadmaps for the user
      const platforms = ['youtube', 'tiktok', 'twitch'];
      await Promise.all(
        platforms.map(p => 
          cacheService.delete(getCacheKey(CACHE_PREFIX.ROADMAP, userId, p))
        )
      );
    }

    await cacheService.invalidateByTags(tags);
  }

  /**
   * Invalidate template caches
   */
  static async invalidateTemplate(templateId: string): Promise<void> {
    await Promise.all([
      cacheService.delete(getCacheKey(CACHE_PREFIX.TEMPLATE, templateId)),
      cacheService.invalidateByTags([`template:${templateId}`]),
    ]);
  }

  /**
   * Invalidate analytics caches for a user
   */
  static async invalidateAnalytics(userId: string, timeRange?: string): Promise<void> {
    if (timeRange) {
      await cacheService.delete(
        getCacheKey(CACHE_PREFIX.ANALYTICS, userId, timeRange)
      );
    } else {
      // Invalidate all time ranges
      const timeRanges = ['7d', '30d', '90d', 'all'];
      await Promise.all(
        timeRanges.map(range =>
          cacheService.delete(getCacheKey(CACHE_PREFIX.ANALYTICS, userId, range))
        )
      );
    }

    await cacheService.invalidateByTags([`analytics:${userId}`]);
  }

  /**
   * Invalidate resource caches
   */
  static async invalidateResources(category?: string): Promise<void> {
    if (category) {
      await cacheService.delete(getCacheKey(CACHE_PREFIX.RESOURCE, category));
      await cacheService.invalidateByTags([`resource:${category}`]);
    } else {
      await cacheService.deletePattern(getCacheKey(CACHE_PREFIX.RESOURCE, '*'));
      await cacheService.invalidateByTags(['resource:all']);
    }
  }

  /**
   * Invalidate achievement caches
   */
  static async invalidateAchievements(userId: string): Promise<void> {
    await Promise.all([
      cacheService.delete(getCacheKey(CACHE_PREFIX.ACHIEVEMENT, userId)),
      cacheService.delete(getCacheKey(CACHE_PREFIX.ACHIEVEMENT, userId, 'recent')),
      cacheService.delete(getCacheKey(CACHE_PREFIX.ACHIEVEMENT, userId, 'progress')),
      cacheService.invalidateByTags([`achievement:${userId}`]),
    ]);
  }

  /**
   * Invalidate platform-specific caches
   */
  static async invalidatePlatform(platform: string, userId?: string): Promise<void> {
    const tags = [`platform:${platform}`];
    
    if (userId) {
      tags.push(`platform:${platform}:${userId}`);
      await cacheService.delete(
        getCacheKey(CACHE_PREFIX.PLATFORM, platform, userId)
      );
    } else {
      await cacheService.deletePattern(
        getCacheKey(CACHE_PREFIX.PLATFORM, platform, '*')
      );
    }

    await cacheService.invalidateByTags(tags);
  }

  /**
   * Invalidate API response caches
   */
  static async invalidateAPI(endpoint: string, params?: Record<string, any>): Promise<void> {
    const cacheKey = params
      ? getCacheKey(CACHE_PREFIX.API, endpoint, JSON.stringify(params))
      : getCacheKey(CACHE_PREFIX.API, endpoint);

    await cacheService.delete(cacheKey);
  }

  /**
   * Smart invalidation based on entity changes
   */
  static async invalidateOnUpdate(
    entityType: 'user' | 'roadmap' | 'template' | 'achievement' | 'resource',
    entityId: string,
    userId?: string
  ): Promise<void> {
    switch (entityType) {
      case 'user':
        await this.invalidateUser(entityId);
        break;
      
      case 'roadmap':
        if (userId) {
          await this.invalidateRoadmap(userId);
          await this.invalidateAnalytics(userId);
        }
        break;
      
      case 'template':
        await this.invalidateTemplate(entityId);
        break;
      
      case 'achievement':
        if (userId) {
          await this.invalidateAchievements(userId);
        }
        break;
      
      case 'resource':
        await this.invalidateResources();
        break;
    }
  }

  /**
   * Batch invalidation for multiple entities
   */
  static async invalidateBatch(
    invalidations: Array<{
      type: 'user' | 'roadmap' | 'template' | 'analytics' | 'achievement';
      id: string;
      userId?: string;
    }>
  ): Promise<void> {
    await Promise.all(
      invalidations.map(({ type, id, userId }) =>
        this.invalidateOnUpdate(type as any, id, userId)
      )
    );
  }

  /**
   * Time-based invalidation for stale data
   */
  static async invalidateStaleData(): Promise<void> {
    // This would typically be run as a cron job
    const stalePatterns = [
      getCacheKey(CACHE_PREFIX.ANALYTICS, '*', '7d'),
      getCacheKey(CACHE_PREFIX.PLATFORM, '*', 'trending'),
      getCacheKey(CACHE_PREFIX.RESOURCE, 'featured'),
    ];

    await Promise.all(
      stalePatterns.map(pattern => cacheService.deletePattern(pattern))
    );
  }
}

// Export convenient invalidation functions
export const invalidateUserCache = CacheInvalidator.invalidateUser;
export const invalidateRoadmapCache = CacheInvalidator.invalidateRoadmap;
export const invalidateTemplateCache = CacheInvalidator.invalidateTemplate;
export const invalidateAnalyticsCache = CacheInvalidator.invalidateAnalytics;
export const invalidateResourceCache = CacheInvalidator.invalidateResources;
export const invalidateAchievementCache = CacheInvalidator.invalidateAchievements;
export const invalidatePlatformCache = CacheInvalidator.invalidatePlatform;
export const invalidateAPICache = CacheInvalidator.invalidateAPI;