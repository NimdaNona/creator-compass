import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();
export const prisma = db; // Alias for compatibility

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Database utility functions
export const dbUtils = {
  // User operations
  async createUser(data: {
    email: string;
    name?: string;
    image?: string;
  }) {
    return db.user.create({
      data,
      include: {
        profile: true,
        stats: true,
      },
    });
  },

  async getUserById(id: string) {
    return db.user.findUnique({
      where: { id },
      include: {
        profile: true,
        stats: true,
        progress: {
          orderBy: { completedAt: 'desc' },
          take: 50,
        },
        achievements: {
          orderBy: { unlockedAt: 'desc' },
        },
      },
    });
  },

  async getUserByEmail(email: string) {
    return db.user.findUnique({
      where: { email },
      include: {
        profile: true,
        stats: true,
      },
    });
  },

  // Profile operations
  async createUserProfile(userId: string, data: {
    selectedPlatform?: string;
    selectedNiche?: string;
    goals?: string[];
    targetTimeframe?: number;
    motivation?: string;
  }) {
    return db.userProfile.create({
      data: {
        userId,
        selectedPlatform: data.selectedPlatform,
        selectedNiche: data.selectedNiche,
        goals: data.goals ? JSON.stringify(data.goals) : null,
        targetTimeframe: data.targetTimeframe,
        motivation: data.motivation,
      },
    });
  },

  async updateUserProfile(userId: string, data: Partial<{
    selectedPlatform: string;
    selectedNiche: string;
    currentPhase: number;
    currentWeek: number;
    goals: string[];
    preferences: any;
    targetTimeframe: number;
    motivation: string;
  }>) {
    const updateData: any = { ...data };
    if (data.goals) {
      updateData.goals = JSON.stringify(data.goals);
    }
    if (data.preferences) {
      updateData.preferences = JSON.stringify(data.preferences);
    }

    return db.userProfile.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    });
  },

  // Progress operations
  async addTaskProgress(userId: string, taskId: string, data?: {
    phaseId?: string;
    weekId?: string;
    points?: number;
  }) {
    // Check if task already completed
    const existing = await db.userProgress.findUnique({
      where: {
        userId_taskId: {
          userId,
          taskId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Create new progress entry
    const progress = await db.userProgress.create({
      data: {
        userId,
        taskId,
        phaseId: data?.phaseId,
        weekId: data?.weekId,
        points: data?.points || 10,
      },
    });

    // Update user stats
    await this.updateUserStats(userId, {
      incrementPoints: data?.points || 10,
      incrementTasks: 1,
    });

    return progress;
  },

  async getUserProgress(userId: string) {
    return db.userProgress.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });
  },

  // Stats operations
  async updateUserStats(userId: string, updates: {
    incrementPoints?: number;
    incrementTasks?: number;
    streakDays?: number;
    longestStreak?: number;
    badges?: string[];
    titles?: string[];
    currentTitle?: string;
  }) {
    const updateData: any = {};

    if (updates.incrementPoints) {
      updateData.totalPoints = {
        increment: updates.incrementPoints,
      };
    }

    if (updates.incrementTasks) {
      updateData.totalTasksCompleted = {
        increment: updates.incrementTasks,
      };
      updateData.lastActiveDate = new Date();
    }

    if (updates.streakDays !== undefined) {
      updateData.streakDays = updates.streakDays;
    }

    if (updates.longestStreak !== undefined) {
      updateData.longestStreak = updates.longestStreak;
    }

    if (updates.badges) {
      updateData.badges = JSON.stringify(updates.badges);
    }

    if (updates.titles) {
      updateData.titles = JSON.stringify(updates.titles);
    }

    if (updates.currentTitle) {
      updateData.currentTitle = updates.currentTitle;
    }

    return db.userStats.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        totalPoints: updates.incrementPoints || 0,
        totalTasksCompleted: updates.incrementTasks || 0,
        streakDays: updates.streakDays || 0,
        longestStreak: updates.longestStreak || 0,
        badges: updates.badges ? JSON.stringify(updates.badges) : null,
        titles: updates.titles ? JSON.stringify(updates.titles) : null,
        currentTitle: updates.currentTitle,
      },
    });
  },

  // Achievement operations
  async addUserAchievement(userId: string, achievementId: string, type = 'general') {
    try {
      return await db.userAchievement.create({
        data: {
          userId,
          achievementId,
          type,
        },
      });
    } catch (error) {
      // Achievement already exists
      return null;
    }
  },

  async getUserAchievements(userId: string) {
    return db.userAchievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
    });
  },

  // Celebration operations
  async addCelebration(userId: string, data: {
    type: string;
    title: string;
    message: string;
    icon: string;
    color: string;
    animation: string;
    duration: number;
  }) {
    return db.celebration.create({
      data: {
        userId,
        ...data,
      },
    });
  },

  async getUserCelebrations(userId: string, unreadOnly = false) {
    return db.celebration.findMany({
      where: {
        userId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  },

  async markCelebrationsAsRead(userId: string, celebrationIds?: string[]) {
    return db.celebration.updateMany({
      where: {
        userId,
        ...(celebrationIds ? { id: { in: celebrationIds } } : {}),
      },
      data: {
        isRead: true,
      },
    });
  },
};