import { prisma } from '@/lib/db';
import { PlatformConnection } from '@prisma/client';
import { YouTubeService } from '../platforms/youtube-service';
import { TikTokService } from '../platforms/tiktok-service';
import { InstagramService } from '../platforms/instagram-service';
import { TwitterService } from '../platforms/twitter-service';
import { PlatformService, PlatformAnalytics } from '../platforms/types';

export interface CrossPlatformAnalytics {
  totalViews: number;
  totalFollowers: number;
  totalEngagement: number;
  totalPosts: number;
  platforms: {
    [platform: string]: PlatformAnalytics;
  };
  growthTrends: {
    followers: {
      daily: number;
      weekly: number;
      monthly: number;
    };
    views: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
  topContent: {
    platform: string;
    postId: string;
    title: string;
    views: number;
    engagement: number;
    publishedAt: Date;
  }[];
  lastSyncedAt: Date;
}

export class AnalyticsSyncService {
  private platformServices: Record<string, PlatformService>;

  constructor() {
    this.platformServices = {
      youtube: new YouTubeService(),
      tiktok: new TikTokService(),
      instagram: new InstagramService(),
      twitter: new TwitterService(),
    };
  }

  /**
   * Sync analytics for all connected platforms
   */
  async syncAllPlatforms(userId: string): Promise<CrossPlatformAnalytics> {
    // Get all active connections for the user
    const connections = await prisma.platformConnection.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    const platformAnalytics: { [platform: string]: PlatformAnalytics } = {};
    const errors: { platform: string; error: string }[] = [];

    // Fetch analytics for each platform in parallel
    const analyticsPromises = connections.map(async (connection) => {
      try {
        const service = this.platformServices[connection.platform];
        if (!service) {
          throw new Error(`Platform ${connection.platform} not supported`);
        }

        const analytics = await service.getAnalytics(connection as any);
        platformAnalytics[connection.platform] = analytics;

        // Update last synced timestamp
        await prisma.platformConnection.update({
          where: { id: connection.id },
          data: {
            lastSyncedAt: new Date(),
            metadata: {
              ...(connection.metadata as any || {}),
              analytics: {
                followers: analytics.followers,
                totalViews: analytics.totalViews,
                totalPosts: analytics.totalPosts,
                lastUpdated: new Date(),
              },
            },
          },
        });
      } catch (error) {
        console.error(`Failed to sync analytics for ${connection.platform}:`, error);
        errors.push({
          platform: connection.platform,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    await Promise.all(analyticsPromises);

    // Calculate cross-platform totals
    const totals = this.calculateTotals(platformAnalytics);

    // Calculate growth trends
    const growthTrends = await this.calculateGrowthTrends(userId, platformAnalytics);

    // Get top performing content across platforms
    const topContent = this.getTopContent(platformAnalytics);

    // Store analytics snapshot
    await this.storeAnalyticsSnapshot(userId, {
      ...totals,
      platforms: platformAnalytics,
      growthTrends,
      topContent,
      lastSyncedAt: new Date(),
    });

    return {
      ...totals,
      platforms: platformAnalytics,
      growthTrends,
      topContent,
      lastSyncedAt: new Date(),
    };
  }

  /**
   * Sync analytics for a specific platform
   */
  async syncPlatform(userId: string, platform: string): Promise<PlatformAnalytics> {
    const connection = await prisma.platformConnection.findFirst({
      where: {
        userId,
        platform,
        isActive: true,
      },
    });

    if (!connection) {
      throw new Error(`No active connection found for ${platform}`);
    }

    const service = this.platformServices[platform];
    if (!service) {
      throw new Error(`Platform ${platform} not supported`);
    }

    const analytics = await service.getAnalytics(connection as any);

    // Update connection with latest analytics
    await prisma.platformConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncedAt: new Date(),
        metadata: {
          ...(connection.metadata as any || {}),
          analytics: {
            followers: analytics.followers,
            totalViews: analytics.totalViews,
            totalPosts: analytics.totalPosts,
            lastUpdated: new Date(),
          },
        },
      },
    });

    return analytics;
  }

  /**
   * Get cached analytics without syncing
   */
  async getCachedAnalytics(userId: string): Promise<CrossPlatformAnalytics | null> {
    // Get the most recent analytics snapshot
    const snapshot = await prisma.contentEngagement.findFirst({
      where: {
        userId,
        contentType: 'analytics_snapshot',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!snapshot || !snapshot.duration) {
      return null;
    }

    return JSON.parse(snapshot.contentId);
  }

  /**
   * Calculate totals across all platforms
   */
  private calculateTotals(platformAnalytics: { [platform: string]: PlatformAnalytics }) {
    return Object.values(platformAnalytics).reduce(
      (totals, analytics) => ({
        totalViews: totals.totalViews + analytics.totalViews,
        totalFollowers: totals.totalFollowers + analytics.followers,
        totalEngagement: totals.totalEngagement + analytics.engagement,
        totalPosts: totals.totalPosts + analytics.totalPosts,
      }),
      { totalViews: 0, totalFollowers: 0, totalEngagement: 0, totalPosts: 0 }
    );
  }

  /**
   * Calculate growth trends
   */
  private async calculateGrowthTrends(
    userId: string,
    currentAnalytics: { [platform: string]: PlatformAnalytics }
  ) {
    // Get historical snapshots
    const historicalSnapshots = await prisma.contentEngagement.findMany({
      where: {
        userId,
        contentType: 'analytics_snapshot',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate trends based on historical data
    const dailySnapshot = historicalSnapshots.find(
      (s) => s.createdAt >= new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const weeklySnapshot = historicalSnapshots.find(
      (s) => s.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const monthlySnapshot = historicalSnapshots[historicalSnapshots.length - 1];

    const currentTotals = this.calculateTotals(currentAnalytics);

    const trends = {
      followers: {
        daily: 0,
        weekly: 0,
        monthly: 0,
      },
      views: {
        daily: 0,
        weekly: 0,
        monthly: 0,
      },
    };

    if (dailySnapshot && dailySnapshot.duration) {
      const daily = JSON.parse(dailySnapshot.contentId);
      trends.followers.daily = currentTotals.totalFollowers - daily.totalFollowers;
      trends.views.daily = currentTotals.totalViews - daily.totalViews;
    }

    if (weeklySnapshot && weeklySnapshot.duration) {
      const weekly = JSON.parse(weeklySnapshot.contentId);
      trends.followers.weekly = currentTotals.totalFollowers - weekly.totalFollowers;
      trends.views.weekly = currentTotals.totalViews - weekly.totalViews;
    }

    if (monthlySnapshot && monthlySnapshot.duration) {
      const monthly = JSON.parse(monthlySnapshot.contentId);
      trends.followers.monthly = currentTotals.totalFollowers - monthly.totalFollowers;
      trends.views.monthly = currentTotals.totalViews - monthly.totalViews;
    }

    return trends;
  }

  /**
   * Get top performing content across platforms
   */
  private getTopContent(platformAnalytics: { [platform: string]: PlatformAnalytics }) {
    const allContent: any[] = [];

    Object.entries(platformAnalytics).forEach(([platform, analytics]) => {
      if (analytics.topPosts) {
        analytics.topPosts.forEach((post) => {
          allContent.push({
            platform,
            postId: post.id,
            title: post.title,
            views: post.views,
            engagement: post.engagement,
            publishedAt: post.publishedAt,
          });
        });
      }
    });

    // Sort by engagement and return top 10
    return allContent
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10);
  }

  /**
   * Store analytics snapshot for historical tracking
   */
  private async storeAnalyticsSnapshot(userId: string, analytics: CrossPlatformAnalytics) {
    await prisma.contentEngagement.create({
      data: {
        userId,
        contentType: 'analytics_snapshot',
        contentId: JSON.stringify(analytics),
        action: 'snapshot',
        duration: Date.now(), // Use duration field to store timestamp as number
      },
    });
  }

  /**
   * Get analytics comparison between periods
   */
  async getAnalyticsComparison(
    userId: string,
    startDate: Date,
    endDate: Date,
    compareStartDate?: Date,
    compareEndDate?: Date
  ) {
    // Get snapshots for the main period
    const mainPeriodSnapshots = await prisma.contentEngagement.findMany({
      where: {
        userId,
        contentType: 'analytics_snapshot',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get snapshots for comparison period if provided
    let comparePeriodSnapshots: any[] = [];
    if (compareStartDate && compareEndDate) {
      comparePeriodSnapshots = await prisma.contentEngagement.findMany({
        where: {
          userId,
          contentType: 'analytics_snapshot',
          createdAt: {
            gte: compareStartDate,
            lte: compareEndDate,
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    // Calculate averages and trends
    const mainPeriodStats = this.calculatePeriodStats(mainPeriodSnapshots);
    const comparePeriodStats = comparePeriodSnapshots.length > 0
      ? this.calculatePeriodStats(comparePeriodSnapshots)
      : null;

    return {
      mainPeriod: mainPeriodStats,
      comparePeriod: comparePeriodStats,
      change: comparePeriodStats
        ? {
            followers: {
              absolute: mainPeriodStats.avgFollowers - comparePeriodStats.avgFollowers,
              percentage: ((mainPeriodStats.avgFollowers - comparePeriodStats.avgFollowers) / comparePeriodStats.avgFollowers) * 100,
            },
            views: {
              absolute: mainPeriodStats.avgViews - comparePeriodStats.avgViews,
              percentage: ((mainPeriodStats.avgViews - comparePeriodStats.avgViews) / comparePeriodStats.avgViews) * 100,
            },
            engagement: {
              absolute: mainPeriodStats.avgEngagement - comparePeriodStats.avgEngagement,
              percentage: ((mainPeriodStats.avgEngagement - comparePeriodStats.avgEngagement) / comparePeriodStats.avgEngagement) * 100,
            },
          }
        : null,
    };
  }

  /**
   * Calculate period statistics from snapshots
   */
  private calculatePeriodStats(snapshots: any[]) {
    if (snapshots.length === 0) {
      return {
        avgFollowers: 0,
        avgViews: 0,
        avgEngagement: 0,
        totalPosts: 0,
      };
    }

    const totals = snapshots.reduce(
      (acc, snapshot) => {
        const data = JSON.parse(snapshot.contentId);
        return {
          followers: acc.followers + data.totalFollowers,
          views: acc.views + data.totalViews,
          engagement: acc.engagement + data.totalEngagement,
          posts: acc.posts + data.totalPosts,
        };
      },
      { followers: 0, views: 0, engagement: 0, posts: 0 }
    );

    return {
      avgFollowers: Math.round(totals.followers / snapshots.length),
      avgViews: Math.round(totals.views / snapshots.length),
      avgEngagement: Math.round(totals.engagement / snapshots.length),
      totalPosts: totals.posts,
    };
  }
}