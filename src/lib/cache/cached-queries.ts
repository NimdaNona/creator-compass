import { cacheService } from '@/lib/services/cache-service';
import { CACHE_PREFIX, CACHE_TTL, getCacheKey } from '@/lib/redis';
import { prisma } from '@/lib/db';
import { Cacheable } from '@/lib/services/cache-service';

/**
 * Cached database query functions
 */

export class CachedQueries {
  /**
   * Get user profile with caching
   */
  static async getUserProfile(userId: string) {
    const cacheKey = getCacheKey(CACHE_PREFIX.USER, userId, 'profile');

    return cacheService.wrap(
      cacheKey,
      async () => {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            selectedPlatforms: true,
            experienceLevel: true,
            currentStreak: true,
            longestStreak: true,
            totalPoints: true,
            level: true,
            tier: true,
            createdAt: true,
          },
        });

        if (!user) throw new Error('User not found');
        return user;
      },
      { ttl: CACHE_TTL.MEDIUM, tags: [`user:${userId}`] }
    );
  }

  /**
   * Get user's roadmap progress with caching
   */
  static async getRoadmapProgress(userId: string, platform: string) {
    const cacheKey = getCacheKey(CACHE_PREFIX.ROADMAP, userId, platform, 'progress');

    return cacheService.wrap(
      cacheKey,
      async () => {
        const progress = await prisma.userProgress.findMany({
          where: {
            userId,
            roadmap: {
              platform,
            },
          },
          include: {
            roadmap: {
              select: {
                id: true,
                day: true,
                title: true,
                tasks: true,
              },
            },
          },
          orderBy: {
            roadmap: {
              day: 'asc',
            },
          },
        });

        // Calculate completion stats
        const totalDays = progress.length;
        const completedDays = progress.filter(p => p.completedAt).length;
        const currentDay = progress.find(p => !p.completedAt)?.roadmap.day || totalDays + 1;

        return {
          progress,
          stats: {
            totalDays,
            completedDays,
            currentDay,
            completionRate: totalDays > 0 ? (completedDays / totalDays) * 100 : 0,
          },
        };
      },
      { ttl: CACHE_TTL.SHORT, tags: [`roadmap:${userId}`, `platform:${platform}`] }
    );
  }

  /**
   * Get user achievements with caching
   */
  @Cacheable({ ttl: CACHE_TTL.MEDIUM })
  static async getUserAchievements(userId: string) {
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: {
        unlockedAt: 'desc',
      },
    });

    return achievements;
  }

  /**
   * Get platform analytics with caching
   */
  static async getPlatformAnalytics(userId: string, platform: string, timeRange: string) {
    const cacheKey = getCacheKey(CACHE_PREFIX.ANALYTICS, userId, platform, timeRange);

    return cacheService.wrap(
      cacheKey,
      async () => {
        // Calculate date range
        const now = new Date();
        const startDate = new Date();
        
        switch (timeRange) {
          case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(now.getDate() - 90);
            break;
          default:
            startDate.setFullYear(now.getFullYear() - 1);
        }

        // Fetch analytics data
        const [engagements, completions] = await Promise.all([
          prisma.contentEngagement.findMany({
            where: {
              userId,
              platform,
              createdAt: { gte: startDate },
            },
            orderBy: { createdAt: 'asc' },
          }),
          prisma.taskCompletion.findMany({
            where: {
              userId,
              task: {
                roadmap: {
                  platform,
                },
              },
              completedAt: { gte: startDate },
            },
            orderBy: { completedAt: 'asc' },
          }),
        ]);

        // Process data for analytics
        return {
          timeRange,
          startDate,
          endDate: now,
          engagements: engagements.length,
          completions: completions.length,
          data: {
            engagements,
            completions,
          },
        };
      },
      { 
        ttl: timeRange === '7d' ? CACHE_TTL.SHORT : CACHE_TTL.MEDIUM,
        tags: [`analytics:${userId}`, `platform:${platform}`],
      }
    );
  }

  /**
   * Get featured templates with caching
   */
  static async getFeaturedTemplates() {
    const cacheKey = getCacheKey(CACHE_PREFIX.TEMPLATE, 'featured');

    return cacheService.wrap(
      cacheKey,
      async () => {
        const templates = await prisma.template.findMany({
          where: {
            featured: true,
            active: true,
          },
          orderBy: {
            order: 'asc',
          },
          take: 6,
        });

        return templates;
      },
      { ttl: CACHE_TTL.LONG, tags: ['template:featured'] }
    );
  }

  /**
   * Get resources by category with caching
   */
  static async getResourcesByCategory(category: string, limit = 20) {
    const cacheKey = getCacheKey(CACHE_PREFIX.RESOURCE, category, limit);

    return cacheService.wrap(
      cacheKey,
      async () => {
        const resources = await prisma.resource.findMany({
          where: { category },
          orderBy: [
            { featured: 'desc' },
            { createdAt: 'desc' },
          ],
          take: limit,
        });

        return resources;
      },
      { ttl: CACHE_TTL.LONG, tags: [`resource:${category}`] }
    );
  }

  /**
   * Batch get multiple user profiles
   */
  static async getUserProfiles(userIds: string[]) {
    const cacheKeys = userIds.map(id => 
      getCacheKey(CACHE_PREFIX.USER, id, 'profile')
    );

    // Try to get from cache first
    const cachedResults = await cacheService.mget<any>(cacheKeys);
    
    // Find missing users
    const missingIndices: number[] = [];
    const missingIds: string[] = [];
    
    cachedResults.forEach((result, index) => {
      if (!result) {
        missingIndices.push(index);
        missingIds.push(userIds[index]);
      }
    });

    // Fetch missing users from database
    if (missingIds.length > 0) {
      const missingUsers = await prisma.user.findMany({
        where: {
          id: { in: missingIds },
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          selectedPlatforms: true,
          tier: true,
        },
      });

      // Cache the missing users
      const cacheItems = missingUsers.map(user => ({
        key: getCacheKey(CACHE_PREFIX.USER, user.id, 'profile'),
        value: user,
        options: { ttl: CACHE_TTL.MEDIUM, tags: [`user:${user.id}`] },
      }));

      await cacheService.mset(cacheItems);

      // Merge results
      missingUsers.forEach((user, i) => {
        const originalIndex = missingIndices[i];
        cachedResults[originalIndex] = user;
      });
    }

    return cachedResults.filter(Boolean);
  }

  /**
   * Clear user-specific caches
   */
  static async clearUserCaches(userId: string) {
    await Promise.all([
      cacheService.deletePattern(getCacheKey(CACHE_PREFIX.USER, userId, '*')),
      cacheService.deletePattern(getCacheKey(CACHE_PREFIX.ROADMAP, userId, '*')),
      cacheService.deletePattern(getCacheKey(CACHE_PREFIX.ACHIEVEMENT, userId, '*')),
      cacheService.deletePattern(getCacheKey(CACHE_PREFIX.ANALYTICS, userId, '*')),
      cacheService.invalidateByTags([`user:${userId}`]),
    ]);
  }
}