import { prisma } from '@/lib/db';
import { ScheduledPost, PlatformConnection } from '@prisma/client';
import { YouTubeService } from '../platforms/youtube-service';
import { TikTokService } from '../platforms/tiktok-service';
import { InstagramService } from '../platforms/instagram-service';
import { TwitterService } from '../platforms/twitter-service';
import { PlatformService } from '../platforms/types';

export class ContentSchedulerService {
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
   * Create a scheduled post
   */
  async createScheduledPost({
    userId,
    platformConnectionId,
    title,
    content,
    media,
    hashtags,
    scheduledFor,
    timezone,
    contentType,
    crossPost,
    crossPostPlatforms,
    metadata,
  }: {
    userId: string;
    platformConnectionId: string;
    title?: string;
    content: string;
    media?: any;
    hashtags?: string[];
    scheduledFor: Date;
    timezone?: string;
    contentType: string;
    crossPost?: boolean;
    crossPostPlatforms?: string[];
    metadata?: any;
  }) {
    // Verify the connection belongs to the user
    const connection = await prisma.platformConnection.findFirst({
      where: {
        id: platformConnectionId,
        userId,
        isActive: true,
      },
    });

    if (!connection) {
      throw new Error('Platform connection not found or inactive');
    }

    // Validate content for the platform
    const service = this.platformServices[connection.platform];
    if (!service) {
      throw new Error(`Platform ${connection.platform} not supported`);
    }

    const validation = await service.validateContent({
      content,
      media,
      hashtags,
    });

    if (!validation.valid) {
      throw new Error(`Content validation failed: ${validation.errors?.join(', ')}`);
    }

    // Create the scheduled post
    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        userId,
        platformConnectionId,
        title,
        content,
        media,
        hashtags: hashtags || [],
        scheduledFor,
        timezone: timezone || 'UTC',
        contentType,
        crossPost: crossPost || false,
        crossPostPlatforms: crossPostPlatforms || [],
        metadata,
      },
    });

    return scheduledPost;
  }

  /**
   * Get scheduled posts for a user
   */
  async getScheduledPosts(userId: string, options?: {
    platform?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { userId };

    if (options?.platform) {
      where.platformConnection = { platform: options.platform };
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.startDate || options?.endDate) {
      where.scheduledFor = {};
      if (options.startDate) {
        where.scheduledFor.gte = options.startDate;
      }
      if (options.endDate) {
        where.scheduledFor.lte = options.endDate;
      }
    }

    const posts = await prisma.scheduledPost.findMany({
      where,
      include: {
        platformConnection: {
          select: {
            id: true,
            platform: true,
            accountName: true,
            accountImage: true,
          },
        },
      },
      orderBy: { scheduledFor: 'asc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return posts;
  }

  /**
   * Update a scheduled post
   */
  async updateScheduledPost(
    userId: string,
    postId: string,
    updates: Partial<{
      title: string;
      content: string;
      media: any;
      hashtags: string[];
      scheduledFor: Date;
      timezone: string;
      contentType: string;
      crossPost: boolean;
      crossPostPlatforms: string[];
      metadata: any;
    }>
  ) {
    // Verify ownership
    const post = await prisma.scheduledPost.findFirst({
      where: {
        id: postId,
        userId,
        status: 'scheduled', // Only allow updating scheduled posts
      },
      include: {
        platformConnection: true,
      },
    });

    if (!post) {
      throw new Error('Scheduled post not found or cannot be updated');
    }

    // If content is being updated, validate it
    if (updates.content || updates.media || updates.hashtags) {
      const service = this.platformServices[post.platformConnection.platform];
      const validation = await service.validateContent({
        content: updates.content || post.content,
        media: updates.media || post.media,
        hashtags: updates.hashtags || post.hashtags,
      });

      if (!validation.valid) {
        throw new Error(`Content validation failed: ${validation.errors?.join(', ')}`);
      }
    }

    return prisma.scheduledPost.update({
      where: { id: postId },
      data: updates,
    });
  }

  /**
   * Cancel a scheduled post
   */
  async cancelScheduledPost(userId: string, postId: string) {
    const post = await prisma.scheduledPost.findFirst({
      where: {
        id: postId,
        userId,
        status: 'scheduled',
      },
    });

    if (!post) {
      throw new Error('Scheduled post not found or already processed');
    }

    return prisma.scheduledPost.update({
      where: { id: postId },
      data: { status: 'cancelled' },
    });
  }

  /**
   * Process scheduled posts (called by cron job)
   */
  async processScheduledPosts() {
    const now = new Date();
    
    // Get posts that are due
    const duePosts = await prisma.scheduledPost.findMany({
      where: {
        status: 'scheduled',
        scheduledFor: {
          lte: now,
        },
      },
      include: {
        platformConnection: true,
      },
    });

    const results = [];

    for (const post of duePosts) {
      try {
        // Update status to publishing
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: { status: 'publishing' },
        });

        // Get the platform service
        const service = this.platformServices[post.platformConnection.platform];
        if (!service) {
          throw new Error(`Platform ${post.platformConnection.platform} not supported`);
        }

        // Publish the content
        const result = await service.publishContent(post.platformConnection as any, {
          content: post.content,
          media: post.media,
          hashtags: post.hashtags,
          metadata: post.metadata,
        });

        // Update post with success
        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status: 'published',
            publishedAt: new Date(),
            platformPostId: result.postId,
          },
        });

        results.push({ postId: post.id, success: true, platformPostId: result.postId });

        // Handle cross-posting if enabled
        if (post.crossPost && post.crossPostPlatforms.length > 0) {
          await this.handleCrossPosting(post);
        }
      } catch (error) {
        console.error(`Failed to publish post ${post.id}:`, error);

        // Update retry count
        const retryCount = post.retryCount + 1;
        const status = retryCount >= post.maxRetries ? 'failed' : 'scheduled';

        await prisma.scheduledPost.update({
          where: { id: post.id },
          data: {
            status,
            retryCount,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        results.push({ postId: post.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return results;
  }

  /**
   * Handle cross-posting to other platforms
   */
  private async handleCrossPosting(originalPost: ScheduledPost & { platformConnection: PlatformConnection }) {
    const crossPostConnections = await prisma.platformConnection.findMany({
      where: {
        userId: originalPost.userId,
        platform: { in: originalPost.crossPostPlatforms },
        isActive: true,
      },
    });

    for (const connection of crossPostConnections) {
      try {
        // Create a new scheduled post for cross-posting
        await this.createScheduledPost({
          userId: originalPost.userId,
          platformConnectionId: connection.id,
          title: originalPost.title,
          content: originalPost.content,
          media: originalPost.media,
          hashtags: originalPost.hashtags,
          scheduledFor: new Date(), // Post immediately
          timezone: originalPost.timezone,
          contentType: originalPost.contentType,
          crossPost: false, // Prevent infinite cross-posting
          metadata: {
            ...originalPost.metadata,
            crossPostedFrom: originalPost.platformConnection.platform,
            originalPostId: originalPost.id,
          },
        });
      } catch (error) {
        console.error(`Failed to create cross-post for platform ${connection.platform}:`, error);
      }
    }
  }

  /**
   * Get analytics for scheduled posts
   */
  async getSchedulingAnalytics(userId: string, dateRange?: { start: Date; end: Date }) {
    const where: any = { userId };

    if (dateRange) {
      where.scheduledFor = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    const [totalPosts, publishedPosts, failedPosts, platformBreakdown] = await Promise.all([
      prisma.scheduledPost.count({ where }),
      prisma.scheduledPost.count({ where: { ...where, status: 'published' } }),
      prisma.scheduledPost.count({ where: { ...where, status: 'failed' } }),
      prisma.scheduledPost.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
    ]);

    const successRate = totalPosts > 0 ? (publishedPosts / totalPosts) * 100 : 0;

    return {
      totalPosts,
      publishedPosts,
      failedPosts,
      successRate,
      platformBreakdown,
    };
  }
}