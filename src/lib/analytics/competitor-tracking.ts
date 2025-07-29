import { prisma } from '@/lib/db';
import { Competitor, BenchmarkComparison } from '@/types/analytics';

export class CompetitorTrackingService {
  // Add a competitor to track
  async addCompetitor(
    userId: string,
    competitorData: {
      name: string;
      platform: string;
      profileUrl: string;
      tags?: string[];
    }
  ) {
    return await prisma.competitor.create({
      data: {
        userId,
        ...competitorData,
        isActive: true
      }
    });
  }

  // Remove a competitor
  async removeCompetitor(userId: string, competitorId: string) {
    return await prisma.competitor.update({
      where: { id: competitorId, userId },
      data: { isActive: false }
    });
  }

  // Get all competitors for a user
  async getCompetitors(userId: string): Promise<Competitor[]> {
    const competitors = await prisma.competitor.findMany({
      where: { userId, isActive: true },
      include: {
        metrics: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    return competitors.map(comp => {
      const latestMetrics = comp.metrics[0];
      return {
        id: comp.id,
        name: comp.name,
        platform: comp.platform,
        followers: latestMetrics?.followers || 0,
        engagementRate: latestMetrics?.engagementRate || 0,
        contentFrequency: latestMetrics?.contentFrequency || 0,
        estimatedRevenue: latestMetrics?.estimatedRevenue,
        strengths: comp.strengths || [],
        weaknesses: comp.weaknesses || [],
        recentActivity: []
      };
    });
  }

  // Track competitor metrics
  async trackCompetitorMetrics(
    competitorId: string,
    metrics: {
      followers: number;
      following?: number;
      posts?: number;
      engagementRate?: number;
      averageViews?: number;
      averageLikes?: number;
      averageComments?: number;
      contentFrequency?: number;
      growthRate?: number;
      estimatedRevenue?: number;
    }
  ) {
    // Get previous metrics for comparison
    const previousMetrics = await prisma.competitorMetrics.findFirst({
      where: { competitorId },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate changes
    const followerChange = previousMetrics 
      ? metrics.followers - previousMetrics.followers 
      : 0;
    
    const engagementChange = previousMetrics && metrics.engagementRate
      ? metrics.engagementRate - previousMetrics.engagementRate
      : 0;

    // Create new metrics record
    const newMetrics = await prisma.competitorMetrics.create({
      data: {
        competitorId,
        ...metrics,
        followerChange,
        engagementChange,
        createdAt: new Date()
      }
    });

    // Update competitor analysis
    await this.updateCompetitorAnalysis(competitorId);

    return newMetrics;
  }

  // Update competitor analysis
  private async updateCompetitorAnalysis(competitorId: string) {
    const competitor = await prisma.competitor.findUnique({
      where: { id: competitorId },
      include: {
        metrics: {
          orderBy: { createdAt: 'desc' },
          take: 30 // Last 30 days
        }
      }
    });

    if (!competitor) return;

    // Analyze strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    const latestMetrics = competitor.metrics[0];
    if (latestMetrics) {
      // Engagement analysis
      if (latestMetrics.engagementRate && latestMetrics.engagementRate > 5) {
        strengths.push('High engagement rate');
      } else if (latestMetrics.engagementRate && latestMetrics.engagementRate < 2) {
        weaknesses.push('Low engagement rate');
      }

      // Growth analysis
      const growthRate = this.calculateGrowthRate(competitor.metrics);
      if (growthRate > 10) {
        strengths.push('Rapid growth');
      } else if (growthRate < 2) {
        weaknesses.push('Slow growth');
      }

      // Content frequency analysis
      if (latestMetrics.contentFrequency && latestMetrics.contentFrequency > 5) {
        strengths.push('Consistent content schedule');
      } else if (latestMetrics.contentFrequency && latestMetrics.contentFrequency < 2) {
        weaknesses.push('Irregular posting schedule');
      }
    }

    // Update competitor record
    await prisma.competitor.update({
      where: { id: competitorId },
      data: {
        strengths,
        weaknesses,
        lastAnalyzed: new Date()
      }
    });
  }

  // Calculate growth rate
  private calculateGrowthRate(metrics: any[]): number {
    if (metrics.length < 2) return 0;

    const oldestMetrics = metrics[metrics.length - 1];
    const latestMetrics = metrics[0];

    if (!oldestMetrics.followers || !latestMetrics.followers) return 0;

    const daysDiff = Math.max(
      1,
      (latestMetrics.createdAt.getTime() - oldestMetrics.createdAt.getTime()) / 
      (1000 * 60 * 60 * 24)
    );

    const followerDiff = latestMetrics.followers - oldestMetrics.followers;
    const monthlyGrowthRate = (followerDiff / oldestMetrics.followers) * (30 / daysDiff) * 100;

    return Math.round(monthlyGrowthRate * 10) / 10;
  }

  // Compare with competitors
  async compareWithCompetitors(
    userId: string,
    userMetrics: {
      followers: number;
      engagementRate: number;
      contentFrequency: number;
      contentQuality: number;
    }
  ): Promise<{
    benchmarks: Record<string, BenchmarkComparison>;
    ranking: number;
    percentile: number;
  }> {
    const competitors = await this.getCompetitors(userId);
    
    if (competitors.length === 0) {
      return {
        benchmarks: {},
        ranking: 1,
        percentile: 100
      };
    }

    // Calculate benchmarks
    const followerValues = competitors.map(c => c.followers);
    const engagementValues = competitors.map(c => c.engagementRate);
    const frequencyValues = competitors.map(c => c.contentFrequency);

    const benchmarks: Record<string, BenchmarkComparison> = {
      followers: {
        yourValue: userMetrics.followers,
        competitorAverage: this.average(followerValues),
        topPerformer: Math.max(...followerValues),
        percentile: this.calculatePercentile(userMetrics.followers, followerValues),
        trend: 'stable' // This would be calculated based on historical data
      },
      engagementRate: {
        yourValue: userMetrics.engagementRate,
        competitorAverage: this.average(engagementValues),
        topPerformer: Math.max(...engagementValues),
        percentile: this.calculatePercentile(userMetrics.engagementRate, engagementValues),
        trend: 'stable'
      },
      contentFrequency: {
        yourValue: userMetrics.contentFrequency,
        competitorAverage: this.average(frequencyValues),
        topPerformer: Math.max(...frequencyValues),
        percentile: this.calculatePercentile(userMetrics.contentFrequency, frequencyValues),
        trend: 'stable'
      }
    };

    // Calculate overall ranking
    const overallScores = competitors.map(c => 
      (c.followers * 0.4) + 
      (c.engagementRate * 10000 * 0.3) + 
      (c.contentFrequency * 1000 * 0.3)
    );
    
    const userScore = 
      (userMetrics.followers * 0.4) + 
      (userMetrics.engagementRate * 10000 * 0.3) + 
      (userMetrics.contentFrequency * 1000 * 0.3);

    const ranking = overallScores.filter(score => score > userScore).length + 1;
    const percentile = ((competitors.length - ranking + 1) / competitors.length) * 100;

    return {
      benchmarks,
      ranking,
      percentile: Math.round(percentile)
    };
  }

  // Utility functions
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculatePercentile(value: number, allValues: number[]): number {
    const sorted = [...allValues].sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    if (index === -1) return 100;
    return Math.round((index / sorted.length) * 100);
  }

  // Get competitor content
  async getCompetitorContent(competitorId: string, limit: number = 10) {
    return await prisma.competitorContent.findMany({
      where: { competitorId },
      orderBy: { publishedAt: 'desc' },
      take: limit
    });
  }

  // Track competitor content
  async trackCompetitorContent(
    competitorId: string,
    content: {
      contentId: string;
      title: string;
      type: string;
      publishedAt: Date;
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
      duration?: number;
      tags?: string[];
    }
  ) {
    return await prisma.competitorContent.create({
      data: {
        competitorId,
        ...content
      }
    });
  }

  // Find content gaps
  async findContentGaps(userId: string): Promise<{
    missingTopics: string[];
    underutilizedFormats: string[];
    timingGaps: string[];
  }> {
    const competitors = await this.getCompetitors(userId);
    const competitorContent = await Promise.all(
      competitors.map(c => this.getCompetitorContent(c.id, 50))
    );

    // Analyze competitor content for gaps
    const allTopics = new Set<string>();
    const allFormats = new Set<string>();
    const postingTimes = new Map<number, number>();

    competitorContent.flat().forEach(content => {
      content.tags?.forEach(tag => allTopics.add(tag));
      allFormats.add(content.type);
      
      const hour = new Date(content.publishedAt).getHours();
      postingTimes.set(hour, (postingTimes.get(hour) || 0) + 1);
    });

    // Get user's content for comparison
    // This would integrate with actual user content data
    const userTopics = new Set<string>(['gaming', 'tech', 'tutorials']);
    const userFormats = new Set<string>(['video', 'short']);
    const userPostingTimes = new Map<number, number>([[20, 10], [21, 8]]);

    // Find gaps
    const missingTopics = Array.from(allTopics).filter(topic => !userTopics.has(topic));
    const underutilizedFormats = Array.from(allFormats).filter(format => !userFormats.has(format));
    
    const timingGaps: string[] = [];
    postingTimes.forEach((count, hour) => {
      if (count > 5 && !userPostingTimes.has(hour)) {
        timingGaps.push(`${hour}:00 - Popular posting time among competitors`);
      }
    });

    return {
      missingTopics: missingTopics.slice(0, 10),
      underutilizedFormats,
      timingGaps
    };
  }
}

export const competitorTracking = new CompetitorTrackingService();