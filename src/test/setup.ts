import '@testing-library/jest-dom';
import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: any }) => {
    const React = require('react');
    return React.createElement('a', { href, ...props }, children);
  },
}));

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  getProviders: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Prisma
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userProfile: {
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    userProgress: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    userAchievement: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    userStats: {
      upsert: vi.fn(),
    },
    celebration: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
  dbUtils: {
    createUser: vi.fn(),
    getUserById: vi.fn(),
    getUserByEmail: vi.fn(),
    createUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
    addTaskProgress: vi.fn(),
    getUserProgress: vi.fn(),
    updateUserStats: vi.fn(),
    addUserAchievement: vi.fn(),
    getUserAchievements: vi.fn(),
    addCelebration: vi.fn(),
    getUserCelebrations: vi.fn(),
    markCelebrationsAsRead: vi.fn(),
  },
}));

// Mock stores
const mockUseAppStore = vi.fn(() => ({
  subscription: 'free',
  theme: 'light',
  setTheme: vi.fn(),
  selectedPlatform: null,
  selectedNiche: null,
  setSelectedPlatform: vi.fn(),
  setSelectedNiche: vi.fn(),
  setSubscription: vi.fn(),
  reset: vi.fn(),
}));

vi.mock('@/store/useAppStore', () => ({
  useAppStore: mockUseAppStore,
}));

vi.mock('@/store/useUserStore', () => ({
  useUserStore: vi.fn(() => ({
    profile: null,
    progress: [],
    achievements: [],
    stats: null,
    celebrations: [],
    activeCelebrations: [],
    selectedPlatform: null,
    selectedNiche: null,
    isLoading: false,
    error: null,
    fetchUserData: vi.fn(),
    updateProfile: vi.fn(),
    completeTask: vi.fn(),
    addAchievement: vi.fn(),
    addCelebration: vi.fn(),
    markCelebrationsAsRead: vi.fn(),
    setSelectedPlatform: vi.fn(),
    setSelectedNiche: vi.fn(),
    isTaskCompleted: vi.fn(),
    getCompletedTasksCount: vi.fn(),
    getTotalPoints: vi.fn(),
    getCurrentStreak: vi.fn(),
    reset: vi.fn(),
  })),
}));

// Mock providers
vi.mock('@/components/providers/ThemeProvider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock lib/utils
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, asChild, ...props }: any) => {
    const React = require('react');
    if (asChild) {
      // When asChild is true, return the child component directly
      return React.Children.only(children);
    }
    return React.createElement('button', props, children);
  },
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('div', props, children);
  },
  AvatarImage: ({ src, ...props }: any) => {
    const React = require('react');
    return React.createElement('img', { src, ...props });
  },
  AvatarFallback: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('span', props, children);
  },
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('span', props, children);
  },
}));

vi.mock('lucide-react', () => ({
  Menu: () => {
    const React = require('react');
    return React.createElement('span', null, 'Menu');
  },
  X: () => {
    const React = require('react');
    return React.createElement('span', null, 'X');
  },
  Compass: () => {
    const React = require('react');
    return React.createElement('span', null, 'Compass');
  },
  Crown: () => {
    const React = require('react');
    return React.createElement('span', null, 'Crown');
  },
  Settings: () => {
    const React = require('react');
    return React.createElement('span', null, 'Settings');
  },
  LogOut: () => {
    const React = require('react');
    return React.createElement('span', null, 'LogOut');
  },
  User: () => {
    const React = require('react');
    return React.createElement('span', null, 'User');
  },
  BarChart3: () => {
    const React = require('react');
    return React.createElement('span', null, 'BarChart3');
  },
}));

// Setup fake timers for tests that need them
beforeAll(() => {
  vi.useFakeTimers();
});