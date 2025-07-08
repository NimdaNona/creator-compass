import { create } from 'zustand';
import { useSession } from 'next-auth/react';
import type { Platform, Niche } from '@/types';

interface UserProfile {
  id: string;
  userId: string;
  selectedPlatform: string | null;
  selectedNiche: string | null;
  startDate: Date;
  currentPhase: number;
  currentWeek: number;
  goals: string[] | null;
  preferences: any;
  targetTimeframe: number | null;
  motivation: string | null;
}

interface UserProgress {
  id: string;
  userId: string;
  taskId: string;
  completedAt: Date;
  phaseId: string | null;
  weekId: string | null;
  points: number;
}

interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: Date;
  type: string;
}

interface UserStats {
  id: string;
  userId: string;
  totalPoints: number;
  streakDays: number;
  longestStreak: number;
  lastActiveDate: Date;
  totalTasksCompleted: number;
  badges: string[] | null;
  titles: string[] | null;
  currentTitle: string | null;
  weeklyGoal: number;
  monthlyGoal: number;
}

interface Celebration {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  icon: string;
  color: string;
  animation: string;
  duration: number;
  isRead: boolean;
  createdAt: Date;
}

interface UserStore {
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // User data
  profile: UserProfile | null;
  progress: UserProgress[];
  achievements: UserAchievement[];
  stats: UserStats | null;
  celebrations: Celebration[];
  
  // UI state
  selectedPlatform: Platform | null;
  selectedNiche: Niche | null;
  activeCelebrations: Celebration[];
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Data fetching
  fetchUserData: () => Promise<void>;
  
  // Profile management
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  
  // Progress tracking
  completeTask: (taskId: string, phaseId?: string, weekId?: string, points?: number) => Promise<void>;
  
  // Achievement management
  addAchievement: (achievementId: string, type?: string) => Promise<void>;
  
  // Celebration management
  addCelebration: (celebration: Omit<Celebration, 'id' | 'userId' | 'createdAt' | 'isRead'>) => Promise<void>;
  markCelebrationsAsRead: (celebrationIds?: string[]) => Promise<void>;
  
  // UI helpers
  setSelectedPlatform: (platform: Platform | null) => void;
  setSelectedNiche: (niche: Niche | null) => void;
  isTaskCompleted: (taskId: string) => boolean;
  getCompletedTasksCount: () => number;
  getTotalPoints: () => number;
  getCurrentStreak: () => number;
  
  // Reset
  reset: () => void;
}

const API_BASE = '/api';

export const useUserStore = create<UserStore>()((set, get) => ({
  // Initial state
  isLoading: false,
  error: null,
  profile: null,
  progress: [],
  achievements: [],
  stats: null,
  celebrations: [],
  selectedPlatform: null,
  selectedNiche: null,
  activeCelebrations: [],
  
  // Loading and error management
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // Fetch user data
  fetchUserData: async () => {
    const { setLoading, setError } = get();
    setLoading(true);
    setError(null);
    
    try {
      // Fetch user profile, progress, achievements, and celebrations
      const [profileRes, progressRes, achievementsRes, celebrationsRes] = await Promise.all([
        fetch(`${API_BASE}/user/profile`),
        fetch(`${API_BASE}/progress`),
        fetch(`${API_BASE}/achievements`),
        fetch(`${API_BASE}/celebrations`),
      ]);
      
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      if (!progressRes.ok) throw new Error('Failed to fetch progress');
      if (!achievementsRes.ok) throw new Error('Failed to fetch achievements');
      if (!celebrationsRes.ok) throw new Error('Failed to fetch celebrations');
      
      const profileData = await profileRes.json();
      const progressData = await progressRes.json();
      const achievementsData = await achievementsRes.json();
      const celebrationsData = await celebrationsRes.json();
      
      set({
        profile: profileData.profile,
        stats: profileData.stats,
        progress: progressData.progress || [],
        achievements: achievementsData.achievements || [],
        celebrations: celebrationsData.celebrations || [],
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  },
  
  // Update user profile
  updateProfile: async (updates) => {
    const { setLoading, setError } = get();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update profile');
      
      const data = await response.json();
      set({ profile: data.profile });
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  },
  
  // Complete a task
  completeTask: async (taskId, phaseId, weekId, points = 10) => {
    const { setLoading, setError, progress } = get();
    
    // Check if task is already completed
    if (progress.some(p => p.taskId === taskId)) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskId, phaseId, weekId, points }),
      });
      
      if (!response.ok) throw new Error('Failed to complete task');
      
      const data = await response.json();
      
      // Add the new progress entry
      set((state) => ({
        progress: [...state.progress, data.progress],
      }));
      
      // Refresh user data to get updated stats
      get().fetchUserData();
    } catch (error) {
      console.error('Error completing task:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  },
  
  // Add achievement
  addAchievement: async (achievementId, type = 'general') => {
    const { setLoading, setError } = get();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/achievements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ achievementId, type }),
      });
      
      if (!response.ok) {
        if (response.status === 409) {
          // Achievement already exists, not an error
          return;
        }
        throw new Error('Failed to add achievement');
      }
      
      const data = await response.json();
      
      set((state) => ({
        achievements: [...state.achievements, data.achievement],
      }));
    } catch (error) {
      console.error('Error adding achievement:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  },
  
  // Add celebration
  addCelebration: async (celebration) => {
    const { setLoading, setError } = get();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/celebrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(celebration),
      });
      
      if (!response.ok) throw new Error('Failed to add celebration');
      
      const data = await response.json();
      
      set((state) => ({
        celebrations: [data.celebration, ...state.celebrations],
        activeCelebrations: [...state.activeCelebrations, data.celebration],
      }));
    } catch (error) {
      console.error('Error adding celebration:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  },
  
  // Mark celebrations as read
  markCelebrationsAsRead: async (celebrationIds) => {
    try {
      const response = await fetch(`${API_BASE}/celebrations`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ celebrationIds }),
      });
      
      if (!response.ok) throw new Error('Failed to mark celebrations as read');
      
      // Update local state
      set((state) => ({
        celebrations: state.celebrations.map(c => 
          celebrationIds ? (celebrationIds.includes(c.id) ? { ...c, isRead: true } : c) : { ...c, isRead: true }
        ),
        activeCelebrations: celebrationIds 
          ? state.activeCelebrations.filter(c => !celebrationIds.includes(c.id))
          : [],
      }));
    } catch (error) {
      console.error('Error marking celebrations as read:', error);
    }
  },
  
  // UI helpers
  setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
  setSelectedNiche: (niche) => set({ selectedNiche: niche }),
  
  isTaskCompleted: (taskId) => {
    const { progress } = get();
    return progress.some(p => p.taskId === taskId);
  },
  
  getCompletedTasksCount: () => {
    const { progress } = get();
    return progress.length;
  },
  
  getTotalPoints: () => {
    const { stats } = get();
    return stats?.totalPoints || 0;
  },
  
  getCurrentStreak: () => {
    const { stats } = get();
    return stats?.streakDays || 0;
  },
  
  // Reset all data
  reset: () =>
    set({
      profile: null,
      progress: [],
      achievements: [],
      stats: null,
      celebrations: [],
      selectedPlatform: null,
      selectedNiche: null,
      activeCelebrations: [],
      error: null,
    }),
}));