import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { vi } from 'vitest';

// Mock session data
export const mockSession = {
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.jpg',
  },
  expires: '2024-12-31',
};

// Mock user profile data
export const mockUserProfile = {
  id: 'profile-1',
  userId: 'test-user-id',
  selectedPlatform: 'youtube',
  selectedNiche: 'gaming',
  startDate: new Date('2024-01-01'),
  currentPhase: 1,
  currentWeek: 1,
  goals: ['Reach 1000 subscribers', 'Create consistent content'],
  preferences: {},
  targetTimeframe: 90,
  motivation: 'I want to build a community around gaming content',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

// Mock user stats
export const mockUserStats = {
  id: 'stats-1',
  userId: 'test-user-id',
  totalPoints: 150,
  streakDays: 5,
  longestStreak: 12,
  lastActiveDate: new Date(),
  totalTasksCompleted: 15,
  badges: ['🎯', '🚀'],
  titles: ['Beginner', 'Consistent Creator'],
  currentTitle: 'Consistent Creator',
  weeklyGoal: 7,
  monthlyGoal: 30,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
};

// Mock progress data
export const mockProgress = [
  {
    id: 'progress-1',
    userId: 'test-user-id',
    taskId: 'task-1',
    completedAt: new Date(),
    phaseId: 'phase-1',
    weekId: 'week-1',
    points: 10,
  },
  {
    id: 'progress-2',
    userId: 'test-user-id',
    taskId: 'task-2',
    completedAt: new Date(),
    phaseId: 'phase-1',
    weekId: 'week-1',
    points: 10,
  },
];

// Mock achievements data
export const mockAchievements = [
  {
    id: 'achievement-1',
    userId: 'test-user-id',
    achievementId: 'first_task',
    unlockedAt: new Date(),
    type: 'progress',
  },
  {
    id: 'achievement-2',
    userId: 'test-user-id',
    achievementId: 'week_warrior',
    unlockedAt: new Date(),
    type: 'streak',
  },
];

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider session={mockSession}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Helper function to create mock API responses
export const createMockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
});

// Helper function to wait for async operations
export const waitFor = async (callback: () => void | Promise<void>, timeout = 1000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      await callback();
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  throw new Error(`Timeout after ${timeout}ms`);
};

// Helper to mock fetch responses
export const mockFetch = (response: any, status = 200) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
  });
};

// Helper to reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
};