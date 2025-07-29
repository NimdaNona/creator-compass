import { prisma } from '@/lib/db';
import type { AnalyticsEvent } from '@/types/analytics';

export class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start flush interval
    this.startFlushInterval();
  }

  static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 30000); // Flush every 30 seconds
  }

  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>) {
    const fullEvent: AnalyticsEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.eventQueue.push(fullEvent);

    // Flush if queue is getting large
    if (this.eventQueue.length >= 100) {
      await this.flushEvents();
    }
  }

  private async flushEvents() {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Process events and update analytics data
      for (const event of eventsToFlush) {
        await this.processEvent(event);
      }
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  private async processEvent(event: AnalyticsEvent) {
    // Update real-time metrics based on event type
    switch (event.eventType) {
      case 'view':
        await this.updateViewMetrics(event);
        break;
      case 'engagement':
        await this.updateEngagementMetrics(event);
        break;
      case 'content_published':
        await this.updateContentMetrics(event);
        break;
      case 'follower_change':
        await this.updateFollowerMetrics(event);
        break;
      case 'revenue':
        await this.updateRevenueMetrics(event);
        break;
    }
  }

  private async updateViewMetrics(event: AnalyticsEvent) {
    if (!event.userId) return;

    // Update view counts in database
    // This would typically update a time-series table or aggregated metrics
    // For now, we'll update user stats
    await prisma.user.update({
      where: { id: event.userId },
      data: {
        updatedAt: new Date()
      }
    });
  }

  private async updateEngagementMetrics(event: AnalyticsEvent) {
    if (!event.userId) return;

    // Update engagement metrics
    await prisma.user.update({
      where: { id: event.userId },
      data: {
        updatedAt: new Date()
      }
    });
  }

  private async updateContentMetrics(event: AnalyticsEvent) {
    if (!event.userId) return;

    // Update content metrics
    await prisma.user.update({
      where: { id: event.userId },
      data: {
        updatedAt: new Date()
      }
    });
  }

  private async updateFollowerMetrics(event: AnalyticsEvent) {
    if (!event.userId) return;

    // Update follower metrics
    await prisma.user.update({
      where: { id: event.userId },
      data: {
        updatedAt: new Date()
      }
    });
  }

  private async updateRevenueMetrics(event: AnalyticsEvent) {
    if (!event.userId) return;

    // Update revenue metrics
    await prisma.user.update({
      where: { id: event.userId },
      data: {
        updatedAt: new Date()
      }
    });
  }

  // Track page views
  async trackPageView(userId: string, path: string, referrer?: string) {
    await this.trackEvent({
      eventType: 'view',
      userId,
      platform: 'web',
      metadata: {
        path,
        referrer,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
      }
    });
  }

  // Track engagement events
  async trackEngagement(
    userId: string,
    engagementType: 'like' | 'comment' | 'share' | 'follow',
    contentId: string,
    platform: string
  ) {
    await this.trackEvent({
      eventType: 'engagement',
      userId,
      platform,
      contentId,
      metadata: {
        engagementType
      }
    });
  }

  // Track content publishing
  async trackContentPublished(
    userId: string,
    contentType: string,
    platform: string,
    contentId: string
  ) {
    await this.trackEvent({
      eventType: 'content_published',
      userId,
      platform,
      contentId,
      contentType,
      metadata: {
        publishedAt: new Date().toISOString()
      }
    });
  }

  // Track follower changes
  async trackFollowerChange(
    userId: string,
    platform: string,
    change: number,
    currentTotal: number
  ) {
    await this.trackEvent({
      eventType: 'follower_change',
      userId,
      platform,
      value: change,
      metadata: {
        currentTotal,
        changeType: change > 0 ? 'gain' : 'loss'
      }
    });
  }

  // Track revenue events
  async trackRevenue(
    userId: string,
    platform: string,
    amount: number,
    source: string
  ) {
    await this.trackEvent({
      eventType: 'revenue',
      userId,
      platform,
      value: amount,
      metadata: {
        source,
        currency: 'USD'
      }
    });
  }

  // Cleanup method
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushEvents();
  }
}

// Export singleton instance
export const analyticsTracker = AnalyticsTracker.getInstance();