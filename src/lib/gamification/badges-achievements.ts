import { prisma } from '@/lib/db';
import { xpSystem } from './xp-system';
import { createOpenAIClient } from '@/lib/ai/openai-client';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'skill' | 'community' | 'platform' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  requirement: BadgeRequirement;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  xpReward: number;
  metadata?: Record<string, any>;
}

export interface BadgeRequirement {
  type: 'count' | 'streak' | 'level' | 'achievement' | 'custom';
  metric: string;
  value: number;
  description: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'content' | 'growth' | 'engagement' | 'mastery' | 'special';
  points: number;
  requirement: AchievementRequirement;
  rewards: AchievementReward[];
  hidden: boolean;
  icon?: string;
}

export interface AchievementRequirement {
  type: 'milestone' | 'cumulative' | 'unique' | 'perfect' | 'special';
  conditions: AchievementCondition[];
}

export interface AchievementCondition {
  metric: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  value: number | number[];
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface AchievementReward {
  type: 'xp' | 'badge' | 'title' | 'feature' | 'cosmetic';
  value: string | number;
  description: string;
}

export class BadgesAndAchievementsSystem {
  private readonly BADGES: Badge[] = [
    // Milestone Badges
    {
      id: 'first-content',
      name: 'First Steps',
      description: 'Publish your first piece of content',
      icon: '🎯',
      category: 'milestone',
      tier: 'bronze',
      requirement: { type: 'count', metric: 'content_published', value: 1, description: 'Publish 1 content' },
      rarity: 'common',
      xpReward: 100
    },
    {
      id: 'content-10',
      name: 'Content Creator',
      description: 'Publish 10 pieces of content',
      icon: '📝',
      category: 'milestone',
      tier: 'silver',
      requirement: { type: 'count', metric: 'content_published', value: 10, description: 'Publish 10 contents' },
      rarity: 'uncommon',
      xpReward: 250
    },
    {
      id: 'content-100',
      name: 'Prolific Publisher',
      description: 'Publish 100 pieces of content',
      icon: '📚',
      category: 'milestone',
      tier: 'gold',
      requirement: { type: 'count', metric: 'content_published', value: 100, description: 'Publish 100 contents' },
      rarity: 'rare',
      xpReward: 1000
    },
    
    // Skill Badges
    {
      id: 'template-master',
      name: 'Template Master',
      description: 'Create 5 custom templates',
      icon: '🎨',
      category: 'skill',
      tier: 'silver',
      requirement: { type: 'count', metric: 'templates_created', value: 5, description: 'Create 5 templates' },
      rarity: 'uncommon',
      xpReward: 300
    },
    {
      id: 'ai-whisperer',
      name: 'AI Whisperer',
      description: 'Have 100 AI interactions',
      icon: '🤖',
      category: 'skill',
      tier: 'silver',
      requirement: { type: 'count', metric: 'ai_interactions', value: 100, description: '100 AI interactions' },
      rarity: 'uncommon',
      xpReward: 200
    },
    
    // Community Badges
    {
      id: 'helpful-creator',
      name: 'Helpful Creator',
      description: 'Help 10 other creators',
      icon: '🤝',
      category: 'community',
      tier: 'silver',
      requirement: { type: 'count', metric: 'creators_helped', value: 10, description: 'Help 10 creators' },
      rarity: 'uncommon',
      xpReward: 400
    },
    {
      id: 'community-champion',
      name: 'Community Champion',
      description: 'Receive 50 thanks from other creators',
      icon: '🏆',
      category: 'community',
      tier: 'gold',
      requirement: { type: 'count', metric: 'thanks_received', value: 50, description: 'Receive 50 thanks' },
      rarity: 'rare',
      xpReward: 750
    },
    
    // Platform Badges
    {
      id: 'youtube-starter',
      name: 'YouTube Starter',
      description: 'Complete YouTube platform setup',
      icon: '📺',
      category: 'platform',
      tier: 'bronze',
      requirement: { type: 'achievement', metric: 'youtube_setup', value: 1, description: 'Complete YouTube setup' },
      rarity: 'common',
      xpReward: 150,
      metadata: { platform: 'youtube' }
    },
    {
      id: 'tiktok-trendsetter',
      name: 'TikTok Trendsetter',
      description: 'Create 5 trending TikTok templates',
      icon: '🎵',
      category: 'platform',
      tier: 'silver',
      requirement: { type: 'count', metric: 'tiktok_trending_templates', value: 5, description: 'Create 5 trending templates' },
      rarity: 'uncommon',
      xpReward: 350,
      metadata: { platform: 'tiktok' }
    },
    
    // Special Badges
    {
      id: 'perfect-week',
      name: 'Perfect Week',
      description: '7-day streak with daily goals completed',
      icon: '🌟',
      category: 'special',
      tier: 'gold',
      requirement: { type: 'streak', metric: 'perfect_days', value: 7, description: '7-day perfect streak' },
      rarity: 'rare',
      xpReward: 1000
    },
    {
      id: 'early-adopter',
      name: 'Early Adopter',
      description: 'One of the first 1000 users',
      icon: '🚀',
      category: 'special',
      tier: 'platinum',
      requirement: { type: 'custom', metric: 'user_number', value: 1000, description: 'User #1000 or earlier' },
      rarity: 'epic',
      xpReward: 2000
    },
    {
      id: 'creator-legend',
      name: 'Creator Legend',
      description: 'Reach level 10',
      icon: '🌈',
      category: 'special',
      tier: 'diamond',
      requirement: { type: 'level', metric: 'user_level', value: 10, description: 'Reach level 10' },
      rarity: 'legendary',
      xpReward: 5000
    }
  ];

  private readonly ACHIEVEMENTS: Achievement[] = [
    // Content Achievements
    {
      id: 'first-viral',
      name: 'Gone Viral',
      description: 'Create content that reaches 10,000+ views',
      category: 'content',
      points: 100,
      requirement: {
        type: 'milestone',
        conditions: [{ metric: 'content_views', operator: 'greater_than', value: 10000 }]
      },
      rewards: [
        { type: 'xp', value: 500, description: '500 XP' },
        { type: 'badge', value: 'viral-creator', description: 'Viral Creator badge' }
      ],
      hidden: false,
      icon: '🔥'
    },
    {
      id: 'consistency-king',
      name: 'Consistency King',
      description: 'Publish content every day for 30 days',
      category: 'content',
      points: 200,
      requirement: {
        type: 'cumulative',
        conditions: [{ metric: 'daily_content', operator: 'equals', value: 30, timeframe: 'monthly' }]
      },
      rewards: [
        { type: 'xp', value: 1500, description: '1500 XP' },
        { type: 'title', value: 'The Consistent', description: 'Special title' }
      ],
      hidden: false,
      icon: '👑'
    },
    
    // Growth Achievements
    {
      id: 'rapid-growth',
      name: 'Rapid Growth',
      description: 'Gain 1000 followers in a month',
      category: 'growth',
      points: 150,
      requirement: {
        type: 'milestone',
        conditions: [{ metric: 'follower_growth', operator: 'greater_than', value: 1000, timeframe: 'monthly' }]
      },
      rewards: [
        { type: 'xp', value: 750, description: '750 XP' },
        { type: 'feature', value: 'growth-analytics-pro', description: 'Unlock Pro Analytics' }
      ],
      hidden: false,
      icon: '📈'
    },
    
    // Engagement Achievements
    {
      id: 'engagement-master',
      name: 'Engagement Master',
      description: 'Achieve 10% average engagement rate',
      category: 'engagement',
      points: 180,
      requirement: {
        type: 'milestone',
        conditions: [{ metric: 'engagement_rate', operator: 'greater_than', value: 10 }]
      },
      rewards: [
        { type: 'xp', value: 900, description: '900 XP' },
        { type: 'cosmetic', value: 'golden-frame', description: 'Golden profile frame' }
      ],
      hidden: false,
      icon: '💫'
    },
    
    // Mastery Achievements
    {
      id: 'platform-master',
      name: 'Platform Master',
      description: 'Master all features of your chosen platform',
      category: 'mastery',
      points: 300,
      requirement: {
        type: 'perfect',
        conditions: [
          { metric: 'platform_features_used', operator: 'equals', value: 100 },
          { metric: 'platform_tutorials_completed', operator: 'equals', value: 100 }
        ]
      },
      rewards: [
        { type: 'xp', value: 2000, description: '2000 XP' },
        { type: 'badge', value: 'platform-expert', description: 'Platform Expert badge' },
        { type: 'feature', value: 'beta-access', description: 'Beta features access' }
      ],
      hidden: false,
      icon: '🎓'
    },
    
    // Hidden Achievements
    {
      id: 'night-owl',
      name: 'Night Owl',
      description: 'Complete 50 tasks between midnight and 5 AM',
      category: 'special',
      points: 50,
      requirement: {
        type: 'cumulative',
        conditions: [{ metric: 'night_tasks', operator: 'greater_than', value: 50 }]
      },
      rewards: [
        { type: 'xp', value: 250, description: '250 XP' },
        { type: 'cosmetic', value: 'night-theme', description: 'Exclusive night theme' }
      ],
      hidden: true,
      icon: '🦉'
    },
    {
      id: 'perfect-planning',
      name: 'Perfect Planning',
      description: 'Complete 100% of scheduled tasks for a month',
      category: 'special',
      points: 250,
      requirement: {
        type: 'perfect',
        conditions: [{ metric: 'task_completion_rate', operator: 'equals', value: 100, timeframe: 'monthly' }]
      },
      rewards: [
        { type: 'xp', value: 1000, description: '1000 XP' },
        { type: 'title', value: 'The Perfectionist', description: 'Rare title' }
      ],
      hidden: true,
      icon: '✨'
    }
  ];

  async checkAndAwardBadges(userId: string, metric: string, value?: number): Promise<Badge[]> {
    const earnedBadges: Badge[] = [];
    const userBadges = await this.getUserBadges(userId);
    const userBadgeIds = userBadges.map(b => b.badgeId);

    for (const badge of this.BADGES) {
      // Skip if already earned
      if (userBadgeIds.includes(badge.id)) continue;

      // Check if badge requirement is met
      const isEarned = await this.checkBadgeRequirement(userId, badge, metric, value);
      
      if (isEarned) {
        await this.awardBadge(userId, badge);
        earnedBadges.push(badge);
      }
    }

    return earnedBadges;
  }

  private async checkBadgeRequirement(
    userId: string,
    badge: Badge,
    metric: string,
    value?: number
  ): Promise<boolean> {
    const req = badge.requirement;

    // Only check if this metric matches the badge requirement
    if (req.metric !== metric) return false;

    switch (req.type) {
      case 'count':
        const count = value || await this.getMetricCount(userId, req.metric);
        return count >= req.value;

      case 'streak':
        const streak = value || await this.getMetricStreak(userId, req.metric);
        return streak >= req.value;

      case 'level':
        const level = await xpSystem.getUserLevel(userId);
        return level.level >= req.value;

      case 'achievement':
        return value === 1; // Binary achievement check

      case 'custom':
        return await this.checkCustomRequirement(userId, badge);

      default:
        return false;
    }
  }

  private async getMetricCount(userId: string, metric: string): Promise<number> {
    switch (metric) {
      case 'content_published':
        return await prisma.contentPost.count({ where: { userId, published: true } });
      
      case 'templates_created':
        return await prisma.template.count({ where: { createdById: userId } });
      
      case 'ai_interactions':
        return await prisma.aiInteraction.count({ where: { userId } });
      
      case 'creators_helped':
        return await prisma.communityHelp.count({ where: { helperId: userId } });
      
      default:
        return 0;
    }
  }

  private async getMetricStreak(userId: string, metric: string): Promise<number> {
    const stats = await prisma.userStats.findUnique({ where: { userId } });
    
    switch (metric) {
      case 'perfect_days':
        // Check last 7 days of daily goals
        const lastWeek = await prisma.dailyGoalCompletion.findMany({
          where: {
            userId,
            date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          },
          orderBy: { date: 'desc' }
        });
        
        // Count consecutive perfect days
        let streak = 0;
        for (const day of lastWeek) {
          if (day.completionRate === 100) {
            streak++;
          } else {
            break;
          }
        }
        return streak;
      
      default:
        return stats?.streakDays || 0;
    }
  }

  private async checkCustomRequirement(userId: string, badge: Badge): Promise<boolean> {
    switch (badge.id) {
      case 'early-adopter':
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const userNumber = await prisma.user.count({
          where: { createdAt: { lte: user?.createdAt || new Date() } }
        });
        return userNumber <= 1000;
      
      default:
        return false;
    }
  }

  private async awardBadge(userId: string, badge: Badge): Promise<void> {
    // Record badge
    await prisma.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
        badgeName: badge.name,
        badgeDescription: badge.description,
        badgeIcon: badge.icon,
        category: badge.category,
        tier: badge.tier,
        rarity: badge.rarity,
        earnedAt: new Date(),
        metadata: badge.metadata
      }
    });

    // Award XP
    await xpSystem.awardXP(userId, 'unlock-badge', {
      badgeId: badge.id,
      badgeName: badge.name,
      xpOverride: badge.xpReward
    });

    // Create notification
    await this.createBadgeNotification(userId, badge);
  }

  async checkAndAwardAchievements(
    userId: string,
    metrics: Record<string, number>
  ): Promise<Achievement[]> {
    const earnedAchievements: Achievement[] = [];
    const userAchievements = await this.getUserAchievements(userId);
    const userAchievementIds = userAchievements.map(a => a.achievementId);

    for (const achievement of this.ACHIEVEMENTS) {
      // Skip if already earned
      if (userAchievementIds.includes(achievement.id)) continue;

      // Check if achievement requirement is met
      const isEarned = await this.checkAchievementRequirement(userId, achievement, metrics);
      
      if (isEarned) {
        await this.awardAchievement(userId, achievement);
        earnedAchievements.push(achievement);
      }
    }

    return earnedAchievements;
  }

  private async checkAchievementRequirement(
    userId: string,
    achievement: Achievement,
    metrics: Record<string, number>
  ): Promise<boolean> {
    const req = achievement.requirement;

    switch (req.type) {
      case 'milestone':
        return this.checkMilestoneConditions(req.conditions, metrics);
      
      case 'cumulative':
        return await this.checkCumulativeConditions(userId, req.conditions);
      
      case 'perfect':
        return this.checkPerfectConditions(req.conditions, metrics);
      
      case 'unique':
        return await this.checkUniqueConditions(userId, req.conditions);
      
      case 'special':
        return await this.checkSpecialConditions(userId, req.conditions, metrics);
      
      default:
        return false;
    }
  }

  private checkMilestoneConditions(
    conditions: AchievementCondition[],
    metrics: Record<string, number>
  ): boolean {
    return conditions.every(condition => {
      const value = metrics[condition.metric] || 0;
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'greater_than':
          return value > condition.value;
        case 'less_than':
          return value < condition.value;
        case 'between':
          const [min, max] = condition.value as number[];
          return value >= min && value <= max;
        default:
          return false;
      }
    });
  }

  private async checkCumulativeConditions(
    userId: string,
    conditions: AchievementCondition[]
  ): Promise<boolean> {
    for (const condition of conditions) {
      const value = await this.getCumulativeMetric(userId, condition.metric, condition.timeframe);
      
      switch (condition.operator) {
        case 'equals':
          if (value !== condition.value) return false;
          break;
        case 'greater_than':
          if (value <= condition.value) return false;
          break;
        default:
          return false;
      }
    }
    
    return true;
  }

  private checkPerfectConditions(
    conditions: AchievementCondition[],
    metrics: Record<string, number>
  ): boolean {
    return conditions.every(condition => {
      const value = metrics[condition.metric] || 0;
      return condition.operator === 'equals' && value === condition.value;
    });
  }

  private async checkUniqueConditions(
    userId: string,
    conditions: AchievementCondition[]
  ): Promise<boolean> {
    // Implementation for unique conditions (e.g., first to do something)
    return false;
  }

  private async checkSpecialConditions(
    userId: string,
    conditions: AchievementCondition[],
    metrics: Record<string, number>
  ): Promise<boolean> {
    // Implementation for special conditions
    for (const condition of conditions) {
      if (condition.metric === 'night_tasks') {
        const nightTasks = await prisma.taskProgress.count({
          where: {
            userId,
            completedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        });
        return nightTasks > (condition.value as number);
      }
    }
    return false;
  }

  private async getCumulativeMetric(
    userId: string,
    metric: string,
    timeframe?: string
  ): Promise<number> {
    const now = new Date();
    let dateFilter = {};

    switch (timeframe) {
      case 'daily':
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        dateFilter = { gte: today };
        break;
      case 'weekly':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { gte: weekAgo };
        break;
      case 'monthly':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = { gte: monthAgo };
        break;
    }

    switch (metric) {
      case 'daily_content':
        // Count days with content published
        const contentDays = await prisma.contentPost.groupBy({
          by: ['createdAt'],
          where: {
            userId,
            published: true,
            createdAt: dateFilter
          }
        });
        return contentDays.length;
      
      case 'task_completion_rate':
        const tasks = await prisma.taskProgress.findMany({
          where: { userId, createdAt: dateFilter }
        });
        const completed = tasks.filter(t => t.completed).length;
        return tasks.length > 0 ? (completed / tasks.length) * 100 : 0;
      
      default:
        return 0;
    }
  }

  private async awardAchievement(userId: string, achievement: Achievement): Promise<void> {
    // Record achievement
    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: achievement.id,
        achievementType: achievement.category,
        title: achievement.name,
        description: achievement.description,
        points: achievement.points,
        earnedAt: new Date(),
        metadata: {
          hidden: achievement.hidden,
          icon: achievement.icon,
          rewards: achievement.rewards
        }
      }
    });

    // Process rewards
    for (const reward of achievement.rewards) {
      await this.processAchievementReward(userId, reward, achievement.id);
    }

    // Create notification (only for non-hidden achievements)
    if (!achievement.hidden) {
      await this.createAchievementNotification(userId, achievement);
    }
  }

  private async processAchievementReward(
    userId: string,
    reward: AchievementReward,
    achievementId: string
  ): Promise<void> {
    switch (reward.type) {
      case 'xp':
        await xpSystem.awardXP(userId, 'complete-milestone', {
          achievementId,
          xpAmount: reward.value
        });
        break;
      
      case 'badge':
        const badge = this.BADGES.find(b => b.id === reward.value);
        if (badge) {
          await this.awardBadge(userId, badge);
        }
        break;
      
      case 'title':
        await prisma.userTitle.create({
          data: {
            userId,
            title: reward.value as string,
            description: reward.description,
            earnedFrom: achievementId,
            earnedAt: new Date()
          }
        });
        break;
      
      case 'feature':
        await prisma.unlockedFeature.create({
          data: {
            userId,
            featureId: reward.value as string,
            featureName: reward.description,
            unlockedAt: new Date(),
            unlockedBy: 'achievement'
          }
        });
        break;
      
      case 'cosmetic':
        await prisma.userCosmetic.create({
          data: {
            userId,
            cosmeticId: reward.value as string,
            cosmeticType: 'profile',
            name: reward.description,
            unlockedAt: new Date()
          }
        });
        break;
    }
  }

  async getUserBadges(userId: string): Promise<any[]> {
    return await prisma.userBadge.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' }
    });
  }

  async getUserAchievements(userId: string): Promise<any[]> {
    return await prisma.userAchievement.findMany({
      where: { userId, achievementType: { not: 'level_up' } },
      orderBy: { earnedAt: 'desc' }
    });
  }

  async getBadgeProgress(userId: string): Promise<Array<{
    badge: Badge;
    progress: number;
    isEarned: boolean;
  }>> {
    const userBadges = await this.getUserBadges(userId);
    const userBadgeIds = userBadges.map(b => b.badgeId);

    const progress = await Promise.all(
      this.BADGES.map(async (badge) => {
        const isEarned = userBadgeIds.includes(badge.id);
        let progressPercent = 0;

        if (!isEarned) {
          const currentValue = await this.getCurrentMetricValue(userId, badge.requirement);
          progressPercent = Math.min(100, (currentValue / badge.requirement.value) * 100);
        }

        return {
          badge,
          progress: isEarned ? 100 : progressPercent,
          isEarned
        };
      })
    );

    return progress.sort((a, b) => b.progress - a.progress);
  }

  private async getCurrentMetricValue(
    userId: string,
    requirement: BadgeRequirement
  ): Promise<number> {
    switch (requirement.type) {
      case 'count':
        return await this.getMetricCount(userId, requirement.metric);
      case 'streak':
        return await this.getMetricStreak(userId, requirement.metric);
      case 'level':
        const level = await xpSystem.getUserLevel(userId);
        return level.level;
      default:
        return 0;
    }
  }

  async getAchievementProgress(userId: string): Promise<Array<{
    achievement: Achievement;
    progress: number;
    isEarned: boolean;
  }>> {
    const userAchievements = await this.getUserAchievements(userId);
    const userAchievementIds = userAchievements.map(a => a.achievementId);

    const progress = await Promise.all(
      this.ACHIEVEMENTS
        .filter(a => !a.hidden) // Only show non-hidden achievements
        .map(async (achievement) => {
          const isEarned = userAchievementIds.includes(achievement.id);
          let progressPercent = 0;

          if (!isEarned) {
            // Calculate progress based on conditions
            progressPercent = await this.calculateAchievementProgress(userId, achievement);
          }

          return {
            achievement,
            progress: isEarned ? 100 : progressPercent,
            isEarned
          };
        })
    );

    return progress.sort((a, b) => b.progress - a.progress);
  }

  private async calculateAchievementProgress(
    userId: string,
    achievement: Achievement
  ): Promise<number> {
    // Simple progress calculation for demonstration
    // In reality, this would be more complex based on achievement type
    const conditions = achievement.requirement.conditions;
    let totalProgress = 0;

    for (const condition of conditions) {
      const currentValue = await this.getCurrentConditionValue(userId, condition);
      const targetValue = condition.value as number;
      const progress = Math.min(100, (currentValue / targetValue) * 100);
      totalProgress += progress;
    }

    return totalProgress / conditions.length;
  }

  private async getCurrentConditionValue(
    userId: string,
    condition: AchievementCondition
  ): Promise<number> {
    // Simplified implementation
    switch (condition.metric) {
      case 'content_views':
        const maxViews = await prisma.contentPost.aggregate({
          where: { userId },
          _max: { views: true }
        });
        return maxViews._max.views || 0;
      
      case 'follower_growth':
        // Would need to track follower history
        return 0;
      
      case 'engagement_rate':
        // Would calculate from recent posts
        return 0;
      
      default:
        return 0;
    }
  }

  private async createBadgeNotification(userId: string, badge: Badge): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: 'badge_earned',
        title: `New Badge Unlocked! ${badge.icon}`,
        message: `Congratulations! You've earned the "${badge.name}" badge. ${badge.description}`,
        data: {
          badgeId: badge.id,
          badgeName: badge.name,
          tier: badge.tier,
          xpReward: badge.xpReward
        }
      }
    });
  }

  private async createAchievementNotification(userId: string, achievement: Achievement): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: 'achievement_earned',
        title: `Achievement Unlocked! ${achievement.icon || '🏆'}`,
        message: `Amazing! You've completed "${achievement.name}". ${achievement.description}`,
        data: {
          achievementId: achievement.id,
          achievementName: achievement.name,
          points: achievement.points,
          rewards: achievement.rewards
        }
      }
    });
  }

  async generatePersonalizedBadge(
    userId: string,
    occasion: string,
    metadata: Record<string, any>
  ): Promise<Badge> {
    const openai = createOpenAIClient();
    const userProfile = await prisma.userProfile.findUnique({ where: { userId } });

    const prompt = `Create a unique badge for a ${userProfile?.selectedPlatform || 'content'} creator:
Occasion: ${occasion}
Context: ${JSON.stringify(metadata)}
Platform: ${userProfile?.selectedPlatform}
Niche: ${userProfile?.selectedNiche}

Generate a creative badge that:
1. Has a unique name and description
2. Fits the occasion and user's journey
3. Includes an appropriate emoji icon
4. Determines appropriate tier and rarity

Format as JSON: {
  "name": "",
  "description": "",
  "icon": "",
  "tier": "bronze|silver|gold|platinum|diamond",
  "rarity": "common|uncommon|rare|epic|legendary",
  "xpReward": number
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a creative badge designer for a content creator platform.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.9,
        response_format: { type: 'json_object' }
      });

      const generated = JSON.parse(response.choices[0].message.content || '{}');

      const badge: Badge = {
        id: `special-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: generated.name || `Special ${occasion} Badge`,
        description: generated.description || `Earned for ${occasion}`,
        icon: generated.icon || '⭐',
        category: 'special',
        tier: generated.tier || 'silver',
        requirement: {
          type: 'custom',
          metric: 'special_occasion',
          value: 1,
          description: `Awarded for ${occasion}`
        },
        rarity: generated.rarity || 'rare',
        xpReward: generated.xpReward || 500,
        metadata: {
          ...metadata,
          occasion,
          generated: true
        }
      };

      // Award immediately
      await this.awardBadge(userId, badge);

      return badge;
    } catch (error) {
      console.error('Failed to generate personalized badge:', error);
      // Return a default special badge
      return {
        id: `special-${Date.now()}`,
        name: `${occasion} Badge`,
        description: `Special badge for ${occasion}`,
        icon: '⭐',
        category: 'special',
        tier: 'silver',
        requirement: {
          type: 'custom',
          metric: 'special_occasion',
          value: 1,
          description: `Awarded for ${occasion}`
        },
        rarity: 'rare',
        xpReward: 300,
        metadata: { occasion }
      };
    }
  }
}

export const badgesAndAchievements = new BadgesAndAchievementsSystem();