import { prisma } from '@/lib/db';
import { aiPersonality } from '@/lib/ai/personality-service';

export interface XPAction {
  id: string;
  name: string;
  xpReward: number;
  category: 'content' | 'engagement' | 'learning' | 'consistency' | 'community' | 'achievement';
  dailyLimit?: number;
  cooldown?: number; // in minutes
}

export interface Level {
  level: number;
  title: string;
  requiredXP: number;
  perks: string[];
  badge: string;
}

export interface XPGain {
  actionId: string;
  xpAmount: number;
  bonusXP?: number;
  reason: string;
  timestamp: Date;
}

export class XPSystem {
  private readonly XP_ACTIONS: XPAction[] = [
    // Content Actions
    { id: 'complete-task', name: 'Complete Task', xpReward: 50, category: 'content' },
    { id: 'publish-content', name: 'Publish Content', xpReward: 100, category: 'content', dailyLimit: 3 },
    { id: 'schedule-content', name: 'Schedule Content', xpReward: 25, category: 'content' },
    { id: 'create-template', name: 'Create Template', xpReward: 75, category: 'content' },
    
    // Engagement Actions
    { id: 'daily-login', name: 'Daily Login', xpReward: 10, category: 'engagement', dailyLimit: 1 },
    { id: 'streak-bonus', name: 'Streak Bonus', xpReward: 20, category: 'consistency', dailyLimit: 1 },
    { id: 'weekly-review', name: 'Weekly Review', xpReward: 150, category: 'engagement', cooldown: 10080 },
    { id: 'ai-interaction', name: 'AI Interaction', xpReward: 5, category: 'engagement', dailyLimit: 20 },
    
    // Learning Actions
    { id: 'complete-tutorial', name: 'Complete Tutorial', xpReward: 100, category: 'learning' },
    { id: 'read-guide', name: 'Read Guide', xpReward: 25, category: 'learning', dailyLimit: 5 },
    { id: 'watch-webinar', name: 'Watch Webinar', xpReward: 200, category: 'learning' },
    { id: 'take-quiz', name: 'Take Quiz', xpReward: 50, category: 'learning' },
    
    // Community Actions
    { id: 'share-achievement', name: 'Share Achievement', xpReward: 30, category: 'community', dailyLimit: 3 },
    { id: 'help-creator', name: 'Help Another Creator', xpReward: 100, category: 'community' },
    { id: 'join-challenge', name: 'Join Challenge', xpReward: 50, category: 'community' },
    
    // Achievement Actions
    { id: 'unlock-badge', name: 'Unlock Badge', xpReward: 200, category: 'achievement' },
    { id: 'complete-milestone', name: 'Complete Milestone', xpReward: 500, category: 'achievement' },
    { id: 'perfect-week', name: 'Perfect Week', xpReward: 1000, category: 'achievement' }
  ];

  private readonly LEVELS: Level[] = [
    { level: 1, title: 'Aspiring Creator', requiredXP: 0, perks: ['Basic Templates', 'AI Assistant'], badge: '🌱' },
    { level: 2, title: 'Rising Star', requiredXP: 500, perks: ['Custom Templates', 'Advanced AI'], badge: '⭐' },
    { level: 3, title: 'Content Creator', requiredXP: 1500, perks: ['Analytics Access', 'Priority Support'], badge: '🎬' },
    { level: 4, title: 'Established Creator', requiredXP: 3000, perks: ['Collaboration Tools', 'Beta Features'], badge: '🏆' },
    { level: 5, title: 'Professional Creator', requiredXP: 5000, perks: ['Advanced Analytics', 'Custom Branding'], badge: '💎' },
    { level: 6, title: 'Influencer', requiredXP: 8000, perks: ['VIP Support', 'Exclusive Content'], badge: '🌟' },
    { level: 7, title: 'Content Expert', requiredXP: 12000, perks: ['Mentorship Program', 'Speaking Opportunities'], badge: '🎯' },
    { level: 8, title: 'Platform Leader', requiredXP: 17000, perks: ['Advisory Board', 'Revenue Share'], badge: '👑' },
    { level: 9, title: 'Industry Pioneer', requiredXP: 25000, perks: ['Custom Features', 'Partnership Opportunities'], badge: '🚀' },
    { level: 10, title: 'Creator Legend', requiredXP: 35000, perks: ['Lifetime Benefits', 'Legacy Badge'], badge: '🌈' }
  ];

  async awardXP(
    userId: string, 
    actionId: string, 
    metadata?: Record<string, any>
  ): Promise<XPGain | null> {
    const action = this.XP_ACTIONS.find(a => a.id === actionId);
    if (!action) {
      console.error(`Unknown XP action: ${actionId}`);
      return null;
    }

    // Check daily limit
    if (action.dailyLimit) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayCount = await prisma.xPTransaction.count({
        where: {
          userId,
          actionId,
          createdAt: { gte: today }
        }
      });

      if (todayCount >= action.dailyLimit) {
        return null; // Daily limit reached
      }
    }

    // Check cooldown
    if (action.cooldown) {
      const cooldownTime = new Date(Date.now() - action.cooldown * 60 * 1000);
      
      const recentAction = await prisma.xPTransaction.findFirst({
        where: {
          userId,
          actionId,
          createdAt: { gte: cooldownTime }
        }
      });

      if (recentAction) {
        return null; // Still in cooldown
      }
    }

    // Calculate bonus XP
    let bonusXP = 0;
    const bonusMultiplier = await this.calculateBonusMultiplier(userId, action.category);
    if (bonusMultiplier > 1) {
      bonusXP = Math.floor(action.xpReward * (bonusMultiplier - 1));
    }

    const totalXP = action.xpReward + bonusXP;

    // Record XP transaction
    const transaction = await prisma.xPTransaction.create({
      data: {
        userId,
        actionId,
        actionName: action.name,
        xpAmount: action.xpReward,
        bonusXP,
        totalXP,
        category: action.category,
        metadata
      }
    });

    // Update user's total XP and check for level up
    const oldLevel = await this.getUserLevel(userId);
    
    await prisma.userStats.update({
      where: { userId },
      data: {
        totalXP: { increment: totalXP },
        xpThisMonth: { increment: totalXP }
      }
    });

    const newLevel = await this.getUserLevel(userId);
    
    // Check for level up
    if (newLevel.level > oldLevel.level) {
      await this.handleLevelUp(userId, oldLevel.level, newLevel.level);
    }

    return {
      actionId,
      xpAmount: action.xpReward,
      bonusXP: bonusXP > 0 ? bonusXP : undefined,
      reason: action.name,
      timestamp: transaction.createdAt
    };
  }

  private async calculateBonusMultiplier(userId: string, category: string): Promise<number> {
    let multiplier = 1;

    // Streak bonus
    const stats = await prisma.userStats.findUnique({
      where: { userId }
    });

    if (stats?.streakDays) {
      if (stats.streakDays >= 30) multiplier += 0.3;
      else if (stats.streakDays >= 14) multiplier += 0.2;
      else if (stats.streakDays >= 7) multiplier += 0.1;
      else if (stats.streakDays >= 3) multiplier += 0.05;
    }

    // Category focus bonus
    const recentActions = await prisma.xPTransaction.findMany({
      where: {
        userId,
        category,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    if (recentActions.length >= 5) {
      multiplier += 0.15; // Focus bonus for consistent category actions
    }

    // Time-based bonuses
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) {
      multiplier += 0.1; // Early bird bonus
    } else if (hour >= 21 && hour < 24) {
      multiplier += 0.1; // Night owl bonus
    }

    // Weekend warrior bonus
    const day = new Date().getDay();
    if (day === 0 || day === 6) {
      multiplier += 0.2; // Weekend bonus
    }

    return multiplier;
  }

  async getUserLevel(userId: string): Promise<Level & { currentXP: number; progress: number }> {
    const stats = await prisma.userStats.findUnique({
      where: { userId }
    });

    const totalXP = stats?.totalXP || 0;
    
    // Find current level
    let currentLevel = this.LEVELS[0];
    for (let i = this.LEVELS.length - 1; i >= 0; i--) {
      if (totalXP >= this.LEVELS[i].requiredXP) {
        currentLevel = this.LEVELS[i];
        break;
      }
    }

    // Calculate progress to next level
    const nextLevel = this.LEVELS.find(l => l.level === currentLevel.level + 1);
    const progress = nextLevel 
      ? ((totalXP - currentLevel.requiredXP) / (nextLevel.requiredXP - currentLevel.requiredXP)) * 100
      : 100;

    return {
      ...currentLevel,
      currentXP: totalXP,
      progress: Math.min(100, Math.max(0, progress))
    };
  }

  private async handleLevelUp(userId: string, oldLevel: number, newLevel: number) {
    // Record level up achievement
    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId: `level-${newLevel}`,
        achievementType: 'level_up',
        title: `Reached Level ${newLevel}`,
        description: `You are now a ${this.LEVELS[newLevel - 1].title}!`,
        metadata: {
          oldLevel,
          newLevel,
          timestamp: new Date()
        }
      }
    });

    // Award level up bonus XP
    await this.awardXP(userId, 'unlock-badge', {
      reason: `Level ${newLevel} achieved`
    });

    // Notify AI personality to congratulate
    await aiPersonality.adaptPersonality(userId, {
      userResponse: 'level_up',
      userSentiment: 'positive',
      interactionType: 'achievement',
      effectiveness: 1
    });

    // Unlock new features based on level
    await this.unlockLevelPerks(userId, newLevel);
  }

  private async unlockLevelPerks(userId: string, level: number) {
    const levelData = this.LEVELS[level - 1];
    
    // Record unlocked perks
    await prisma.unlockedFeature.createMany({
      data: levelData.perks.map(perk => ({
        userId,
        featureId: `level-${level}-${perk.toLowerCase().replace(/\s+/g, '-')}`,
        featureName: perk,
        unlockedAt: new Date(),
        unlockedBy: 'level_up'
      }))
    });
  }

  async getXPHistory(userId: string, days: number = 30): Promise<XPTransaction[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return await prisma.xPTransaction.findMany({
      where: {
        userId,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }

  async getXPLeaderboard(
    timeframe: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'monthly',
    limit: number = 10
  ): Promise<Array<{ userId: string; username: string; xp: number; level: number }>> {
    let dateFilter = {};
    const now = new Date();

    switch (timeframe) {
      case 'daily':
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        dateFilter = { createdAt: { gte: today } };
        break;
      case 'weekly':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { createdAt: { gte: weekAgo } };
        break;
      case 'monthly':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = { createdAt: { gte: monthAgo } };
        break;
    }

    const leaderboard = await prisma.xPTransaction.groupBy({
      by: ['userId'],
      where: dateFilter,
      _sum: { totalXP: true },
      orderBy: { _sum: { totalXP: 'desc' } },
      take: limit
    });

    // Get user details
    const userIds = leaderboard.map(entry => entry.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { stats: true }
    });

    return leaderboard.map(entry => {
      const user = users.find(u => u.id === entry.userId);
      const level = this.LEVELS.find(l => 
        (user?.stats?.totalXP || 0) >= l.requiredXP
      )?.level || 1;

      return {
        userId: entry.userId,
        username: user?.name || 'Anonymous',
        xp: entry._sum.totalXP || 0,
        level
      };
    });
  }

  async getDailyXPProgress(userId: string): Promise<{
    earnedToday: number;
    availableActions: Array<XPAction & { remaining?: number }>;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's XP
    const todayXP = await prisma.xPTransaction.aggregate({
      where: {
        userId,
        createdAt: { gte: today }
      },
      _sum: { totalXP: true }
    });

    // Get action counts for today
    const actionCounts = await prisma.xPTransaction.groupBy({
      by: ['actionId'],
      where: {
        userId,
        createdAt: { gte: today }
      },
      _count: true
    });

    // Calculate available actions
    const availableActions = this.XP_ACTIONS.map(action => {
      const count = actionCounts.find(c => c.actionId === action.id)?._count || 0;
      const remaining = action.dailyLimit ? Math.max(0, action.dailyLimit - count) : undefined;
      
      return {
        ...action,
        remaining
      };
    }).filter(action => !action.remaining || action.remaining > 0);

    return {
      earnedToday: todayXP._sum.totalXP || 0,
      availableActions
    };
  }
}

// XPTransaction type for TypeScript
interface XPTransaction {
  id: string;
  userId: string;
  actionId: string;
  actionName: string;
  xpAmount: number;
  bonusXP: number;
  totalXP: number;
  category: string;
  metadata: any;
  createdAt: Date;
}

export const xpSystem = new XPSystem();