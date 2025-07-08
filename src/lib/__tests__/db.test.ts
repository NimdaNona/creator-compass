import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Prisma client
const mockDb = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  userProfile: {
    create: vi.fn(),
    upsert: vi.fn(),
  },
  userProgress: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  userStats: {
    upsert: vi.fn(),
  },
  userAchievement: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  celebration: {
    create: vi.fn(),
    findMany: vi.fn(),
    updateMany: vi.fn(),
  },
};

vi.mock('@/lib/db', async () => {
  // Import the original module
  const originalModule = await vi.importActual('@/lib/db');
  
  return {
    ...originalModule,
    db: mockDb,
  };
});

const { dbUtils } = await import('@/lib/db');

describe('Database Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user with default relations', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      };

      const expectedUser = {
        id: 'user-1',
        ...userData,
        profile: null,
        stats: null,
      };

      mockDb.user.create.mockResolvedValue(expectedUser);

      const result = await dbUtils.createUser(userData);

      expect(mockDb.user.create).toHaveBeenCalledWith({
        data: userData,
        include: {
          profile: true,
          stats: true,
        },
      });
      expect(result).toEqual(expectedUser);
    });
  });

  describe('getUserById', () => {
    it('should fetch user with all related data', async () => {
      const userId = 'user-1';
      const expectedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        profile: { selectedPlatform: 'youtube' },
        stats: { totalPoints: 100 },
        progress: [{ taskId: 'task-1', points: 10 }],
        achievements: [{ achievementId: 'first_task' }],
      };

      mockDb.user.findUnique.mockResolvedValue(expectedUser);

      const result = await dbUtils.getUserById(userId);

      expect(mockDb.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
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
      expect(result).toEqual(expectedUser);
    });
  });

  describe('addTaskProgress', () => {
    it('should create new progress entry when task not completed', async () => {
      const userId = 'user-1';
      const taskId = 'task-1';
      const progressData = { phaseId: 'phase-1', points: 15 };

      mockDb.userProgress.findUnique.mockResolvedValue(null); // Task not completed
      mockDb.userProgress.create.mockResolvedValue({
        id: 'progress-1',
        userId,
        taskId,
        ...progressData,
      });

      const result = await dbUtils.addTaskProgress(userId, taskId, progressData);

      expect(mockDb.userProgress.findUnique).toHaveBeenCalledWith({
        where: {
          userId_taskId: { userId, taskId },
        },
      });
      expect(mockDb.userProgress.create).toHaveBeenCalledWith({
        data: {
          userId,
          taskId,
          phaseId: progressData.phaseId,
          weekId: undefined,
          points: progressData.points,
        },
      });
      expect(result).toEqual({
        id: 'progress-1',
        userId,
        taskId,
        ...progressData,
      });
    });

    it('should return existing progress when task already completed', async () => {
      const userId = 'user-1';
      const taskId = 'task-1';
      const existingProgress = {
        id: 'progress-1',
        userId,
        taskId,
        points: 10,
      };

      mockDb.userProgress.findUnique.mockResolvedValue(existingProgress);

      const result = await dbUtils.addTaskProgress(userId, taskId);

      expect(mockDb.userProgress.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingProgress);
    });
  });

  describe('updateUserStats', () => {
    it('should update existing stats with increments', async () => {
      const userId = 'user-1';
      const updates = {
        incrementPoints: 20,
        incrementTasks: 2,
        streakDays: 5,
      };

      const updatedStats = {
        id: 'stats-1',
        userId,
        totalPoints: 120,
        totalTasksCompleted: 12,
        streakDays: 5,
      };

      mockDb.userStats.upsert.mockResolvedValue(updatedStats);

      const result = await dbUtils.updateUserStats(userId, updates);

      expect(mockDb.userStats.upsert).toHaveBeenCalledWith({
        where: { userId },
        update: {
          totalPoints: { increment: 20 },
          totalTasksCompleted: { increment: 2 },
          lastActiveDate: expect.any(Date),
          streakDays: 5,
        },
        create: {
          userId,
          totalPoints: 20,
          totalTasksCompleted: 2,
          streakDays: 5,
          longestStreak: 0,
          badges: null,
          titles: null,
          currentTitle: undefined,
        },
      });
      expect(result).toEqual(updatedStats);
    });
  });

  describe('addUserAchievement', () => {
    it('should create new achievement when not exists', async () => {
      const userId = 'user-1';
      const achievementId = 'first_task';
      const type = 'progress';

      const newAchievement = {
        id: 'achievement-1',
        userId,
        achievementId,
        type,
      };

      mockDb.userAchievement.create.mockResolvedValue(newAchievement);

      const result = await dbUtils.addUserAchievement(userId, achievementId, type);

      expect(mockDb.userAchievement.create).toHaveBeenCalledWith({
        data: { userId, achievementId, type },
      });
      expect(result).toEqual(newAchievement);
    });

    it('should return null when achievement already exists', async () => {
      const userId = 'user-1';
      const achievementId = 'first_task';

      mockDb.userAchievement.create.mockRejectedValue(new Error('Unique constraint failed'));

      const result = await dbUtils.addUserAchievement(userId, achievementId);

      expect(result).toBeNull();
    });
  });
});