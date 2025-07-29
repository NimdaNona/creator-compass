import { prisma } from '@/lib/db';
import { xpSystem } from './xp-system';
import { badgesAndAchievements } from './badges-achievements';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  level?: number;
  badges?: number;
  achievements?: number;
  change?: number; // Position change from last period
  metadata?: Record<string, any>;
}

export interface Leaderboard {
  id: string;
  name: string;
  description: string;
  type: 'xp' | 'badges' | 'achievements' | 'content' | 'engagement' | 'custom';
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time';
  entries: LeaderboardEntry[];
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

export class LeaderboardSystem {
  private readonly LEADERBOARD_CONFIGS = {
    xp: {
      daily: { name: 'Daily XP Leaders', description: 'Top creators by XP earned today' },
      weekly: { name: 'Weekly XP Champions', description: 'Top creators by XP this week' },
      monthly: { name: 'Monthly XP Masters', description: 'Top creators by XP this month' },
      'all-time': { name: 'All-Time XP Legends', description: 'Top creators by total XP' }
    },
    badges: {
      'all-time': { name: 'Badge Collectors', description: 'Top creators by badges earned' }
    },
    achievements: {
      'all-time': { name: 'Achievement Hunters', description: 'Top creators by achievement points' }
    },
    content: {
      weekly: { name: 'Content Creators of the Week', description: 'Top creators by content published' },
      monthly: { name: 'Content Kings & Queens', description: 'Top creators by content this month' }
    },
    engagement: {
      daily: { name: 'Engagement Stars', description: 'Most engaged creators today' },
      weekly: { name: 'Community Champions', description: 'Top community contributors this week' }
    }
  };

  async getLeaderboard(
    type: Leaderboard['type'],
    timeframe: Leaderboard['timeframe'],
    limit: number = 100,
    userId?: string
  ): Promise<Leaderboard> {
    const config = this.LEADERBOARD_CONFIGS[type]?.[timeframe];
    if (!config) {
      throw new Error(`Invalid leaderboard configuration: ${type}/${timeframe}`);
    }

    let entries: LeaderboardEntry[] = [];

    switch (type) {
      case 'xp':
        entries = await this.getXPLeaderboard(timeframe, limit);
        break;
      case 'badges':
        entries = await this.getBadgeLeaderboard(limit);
        break;
      case 'achievements':
        entries = await this.getAchievementLeaderboard(limit);
        break;
      case 'content':
        entries = await this.getContentLeaderboard(timeframe, limit);
        break;
      case 'engagement':
        entries = await this.getEngagementLeaderboard(timeframe, limit);
        break;
    }

    // Add change indicators
    entries = await this.addChangeIndicators(entries, type, timeframe);

    // If userId provided, ensure they're included
    if (userId) {
      const userEntry = entries.find(e => e.userId === userId);
      if (!userEntry) {
        const userRank = await this.getUserRank(userId, type, timeframe);
        if (userRank) {
          entries = [...entries.slice(0, limit - 1), userRank];
        }
      }
    }

    return {
      id: `${type}-${timeframe}`,
      name: config.name,
      description: config.description,
      type,
      timeframe,
      entries,
      lastUpdated: new Date()
    };
  }

  private async getXPLeaderboard(
    timeframe: Leaderboard['timeframe'],
    limit: number
  ): Promise<LeaderboardEntry[]> {
    const dateFilter = this.getDateFilter(timeframe);
    
    if (timeframe === 'all-time') {
      // Get from user stats
      const users = await prisma.user.findMany({
        where: { emailVerified: { not: null } },
        include: { 
          stats: true,
          profile: true
        },
        orderBy: { stats: { totalXP: 'desc' } },
        take: limit
      });

      return users.map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        username: user.name || 'Anonymous',
        avatar: user.image || undefined,
        score: user.stats?.totalXP || 0,
        level: user.stats?.currentLevel || 1
      }));
    } else {
      // Get from XP transactions
      const xpData = await prisma.xPTransaction.groupBy({
        by: ['userId'],
        where: { createdAt: dateFilter },
        _sum: { totalXP: true },
        orderBy: { _sum: { totalXP: 'desc' } },
        take: limit
      });

      // Get user details
      const userIds = xpData.map(entry => entry.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        include: { stats: true }
      });

      return xpData.map((entry, index) => {
        const user = users.find(u => u.id === entry.userId);
        return {
          rank: index + 1,
          userId: entry.userId,
          username: user?.name || 'Anonymous',
          avatar: user?.image || undefined,
          score: entry._sum.totalXP || 0,
          level: user?.stats?.currentLevel || 1
        };
      });
    }
  }

  private async getBadgeLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    const badgeData = await prisma.userBadge.groupBy({
      by: ['userId'],
      _count: { badgeId: true },
      orderBy: { _count: { badgeId: 'desc' } },
      take: limit
    });

    // Get user details
    const userIds = badgeData.map(entry => entry.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { stats: true }
    });

    return badgeData.map((entry, index) => {
      const user = users.find(u => u.id === entry.userId);
      return {
        rank: index + 1,
        userId: entry.userId,
        username: user?.name || 'Anonymous',
        avatar: user?.image || undefined,
        score: entry._count.badgeId,
        badges: entry._count.badgeId,
        level: user?.stats?.currentLevel || 1
      };
    });
  }

  private async getAchievementLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
    const achievementData = await prisma.userAchievement.groupBy({
      by: ['userId'],
      _sum: { points: true },
      _count: { achievementId: true },
      orderBy: { _sum: { points: 'desc' } },
      take: limit
    });

    // Get user details
    const userIds = achievementData.map(entry => entry.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { stats: true }
    });

    return achievementData.map((entry, index) => {
      const user = users.find(u => u.id === entry.userId);
      return {
        rank: index + 1,
        userId: entry.userId,
        username: user?.name || 'Anonymous',
        avatar: user?.image || undefined,
        score: entry._sum.points || 0,
        achievements: entry._count.achievementId,
        level: user?.stats?.currentLevel || 1
      };
    });
  }

  private async getContentLeaderboard(
    timeframe: 'weekly' | 'monthly',
    limit: number
  ): Promise<LeaderboardEntry[]> {
    const dateFilter = this.getDateFilter(timeframe);

    const contentData = await prisma.contentPost.groupBy({
      by: ['userId'],
      where: { 
        published: true,
        createdAt: dateFilter
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit
    });

    // Get user details
    const userIds = contentData.map(entry => entry.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { stats: true }
    });

    return contentData.map((entry, index) => {
      const user = users.find(u => u.id === entry.userId);
      return {
        rank: index + 1,
        userId: entry.userId,
        username: user?.name || 'Anonymous',
        avatar: user?.image || undefined,
        score: entry._count.id,
        level: user?.stats?.currentLevel || 1,
        metadata: { contentCount: entry._count.id }
      };
    });
  }

  private async getEngagementLeaderboard(
    timeframe: 'daily' | 'weekly',
    limit: number
  ): Promise<LeaderboardEntry[]> {
    const dateFilter = this.getDateFilter(timeframe);

    // Combine various engagement metrics
    const [aiInteractions, helps, shares] = await Promise.all([
      prisma.aiInteraction.groupBy({
        by: ['userId'],
        where: { createdAt: dateFilter },
        _count: { id: true }
      }),
      prisma.communityHelp.groupBy({
        by: ['helperId'],
        where: { createdAt: dateFilter },
        _count: { id: true }
      }),
      prisma.achievementShare.groupBy({
        by: ['userId'],
        where: { createdAt: dateFilter },
        _count: { id: true }
      })
    ]);

    // Combine scores
    const scoreMap = new Map<string, number>();
    
    aiInteractions.forEach(item => {
      scoreMap.set(item.userId, (scoreMap.get(item.userId) || 0) + item._count.id);
    });
    
    helps.forEach(item => {
      scoreMap.set(item.helperId, (scoreMap.get(item.helperId) || 0) + (item._count.id * 3)); // Helping is worth more
    });
    
    shares.forEach(item => {
      scoreMap.set(item.userId, (scoreMap.get(item.userId) || 0) + (item._count.id * 2));
    });

    // Sort by score
    const sortedEntries = Array.from(scoreMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    // Get user details
    const userIds = sortedEntries.map(([userId]) => userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { stats: true }
    });

    return sortedEntries.map(([userId, score], index) => {
      const user = users.find(u => u.id === userId);
      return {
        rank: index + 1,
        userId,
        username: user?.name || 'Anonymous',
        avatar: user?.image || undefined,
        score,
        level: user?.stats?.currentLevel || 1
      };
    });
  }

  private getDateFilter(timeframe: Leaderboard['timeframe']): any {
    const now = new Date();
    let gte: Date;

    switch (timeframe) {
      case 'daily':
        gte = new Date(now);
        gte.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        gte = new Date(now);
        gte.setDate(gte.getDate() - 7);
        break;
      case 'monthly':
        gte = new Date(now);
        gte.setMonth(gte.getMonth() - 1);
        break;
      default:
        return {};
    }

    return { gte };
  }

  private async addChangeIndicators(
    entries: LeaderboardEntry[],
    type: Leaderboard['type'],
    timeframe: Leaderboard['timeframe']
  ): Promise<LeaderboardEntry[]> {
    // Get previous period's rankings
    const previousRankings = await this.getPreviousRankings(type, timeframe);
    
    return entries.map(entry => {
      const previousRank = previousRankings.get(entry.userId);
      if (previousRank) {
        entry.change = previousRank - entry.rank;
      }
      return entry;
    });
  }

  private async getPreviousRankings(
    type: Leaderboard['type'],
    timeframe: Leaderboard['timeframe']
  ): Promise<Map<string, number>> {
    // This would retrieve previous period's rankings from a cache or snapshot
    // For now, return empty map
    return new Map();
  }

  private async getUserRank(
    userId: string,
    type: Leaderboard['type'],
    timeframe: Leaderboard['timeframe']
  ): Promise<LeaderboardEntry | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { stats: true }
    });

    if (!user) return null;

    let rank = 0;
    let score = 0;

    switch (type) {
      case 'xp':
        if (timeframe === 'all-time') {
          score = user.stats?.totalXP || 0;
          rank = await prisma.userStats.count({
            where: { totalXP: { gt: score } }
          }) + 1;
        }
        break;
      // Add other type calculations as needed
    }

    return {
      rank,
      userId,
      username: user.name || 'Anonymous',
      avatar: user.image || undefined,
      score,
      level: user.stats?.currentLevel || 1
    };
  }

  async getUserLeaderboardPositions(userId: string): Promise<{
    type: Leaderboard['type'];
    timeframe: Leaderboard['timeframe'];
    rank: number;
    percentile: number;
  }[]> {
    const positions = [];

    // Check XP leaderboards
    for (const timeframe of ['daily', 'weekly', 'monthly', 'all-time'] as const) {
      const rank = await this.getUserRankInLeaderboard(userId, 'xp', timeframe);
      if (rank) {
        positions.push(rank);
      }
    }

    // Check badge leaderboard
    const badgeRank = await this.getUserRankInLeaderboard(userId, 'badges', 'all-time');
    if (badgeRank) {
      positions.push(badgeRank);
    }

    return positions;
  }

  private async getUserRankInLeaderboard(
    userId: string,
    type: Leaderboard['type'],
    timeframe: Leaderboard['timeframe']
  ): Promise<{
    type: Leaderboard['type'];
    timeframe: Leaderboard['timeframe'];
    rank: number;
    percentile: number;
  } | null> {
    const leaderboard = await this.getLeaderboard(type, timeframe, 1000);
    const userEntry = leaderboard.entries.find(e => e.userId === userId);
    
    if (!userEntry) return null;

    const totalUsers = await prisma.user.count({ where: { emailVerified: { not: null } } });
    const percentile = Math.round(((totalUsers - userEntry.rank) / totalUsers) * 100);

    return {
      type,
      timeframe,
      rank: userEntry.rank,
      percentile
    };
  }

  async createCustomLeaderboard(
    name: string,
    description: string,
    scoreCalculation: (userId: string) => Promise<number>,
    metadata?: Record<string, any>
  ): Promise<Leaderboard> {
    // Get all active users
    const users = await prisma.user.findMany({
      where: { emailVerified: { not: null } },
      include: { stats: true }
    });

    // Calculate scores
    const entries = await Promise.all(
      users.map(async (user) => {
        const score = await scoreCalculation(user.id);
        return {
          userId: user.id,
          username: user.name || 'Anonymous',
          avatar: user.image || undefined,
          score,
          level: user.stats?.currentLevel || 1
        };
      })
    );

    // Sort by score and add ranks
    const sortedEntries = entries
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

    return {
      id: `custom-${Date.now()}`,
      name,
      description,
      type: 'custom',
      timeframe: 'all-time',
      entries: sortedEntries,
      lastUpdated: new Date(),
      metadata
    };
  }

  async getPersonalizedLeaderboards(userId: string): Promise<{
    featured: Leaderboard[];
    yourBest: Leaderboard[];
    trending: Leaderboard[];
  }> {
    // Get user's best performing leaderboards
    const positions = await this.getUserLeaderboardPositions(userId);
    const yourBest = await Promise.all(
      positions
        .filter(p => p.rank <= 10)
        .map(p => this.getLeaderboard(p.type, p.timeframe, 10, userId))
    );

    // Featured leaderboards
    const featured = await Promise.all([
      this.getLeaderboard('xp', 'weekly', 10),
      this.getLeaderboard('badges', 'all-time', 10)
    ]);

    // Trending leaderboards (with most movement)
    const trending = await Promise.all([
      this.getLeaderboard('content', 'weekly', 10),
      this.getLeaderboard('engagement', 'daily', 10)
    ]);

    return {
      featured,
      yourBest,
      trending
    };
  }

  async generateLeaderboardInsights(userId: string): Promise<{
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  }> {
    const positions = await this.getUserLeaderboardPositions(userId);
    const strengths: string[] = [];
    const improvements: string[] = [];
    const recommendations: string[] = [];

    // Analyze positions
    const topPositions = positions.filter(p => p.percentile >= 80);
    const lowPositions = positions.filter(p => p.percentile < 50);

    if (topPositions.length > 0) {
      topPositions.forEach(p => {
        strengths.push(`You're in the top ${100 - p.percentile}% for ${p.type} (${p.timeframe})`);
      });
    }

    if (lowPositions.length > 0) {
      lowPositions.forEach(p => {
        improvements.push(`Improve your ${p.type} to climb the ${p.timeframe} leaderboard`);
      });
    }

    // Generate recommendations
    if (!positions.find(p => p.type === 'engagement')) {
      recommendations.push('Increase community engagement to appear on engagement leaderboards');
    }

    if (!positions.find(p => p.type === 'content' && p.timeframe === 'weekly')) {
      recommendations.push('Publish more content this week to rank on the content leaderboard');
    }

    return {
      strengths,
      improvements,
      recommendations
    };
  }
}

export const leaderboards = new LeaderboardSystem();