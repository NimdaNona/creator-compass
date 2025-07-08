import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserProgress, Platform, Niche } from '@/types';
import type { UserStats, Achievement, Celebration, Streak } from '@/types/achievements';
import { EngagementSystem } from '@/lib/engagementSystem';

interface AppStore {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Platform and niche selection
  selectedPlatform: Platform | null;
  selectedNiche: Niche | null;
  setSelectedPlatform: (platform: Platform | null) => void;
  setSelectedNiche: (niche: Niche | null) => void;
  
  // Progress tracking
  progress: UserProgress | null;
  setProgress: (progress: UserProgress | null) => void;
  updateProgress: (updates: Partial<UserProgress>) => void;
  
  // Task completion
  completeTask: (taskId: string) => void;
  uncompleteTask: (taskId: string) => void;
  isTaskCompleted: (taskId: string) => boolean;
  
  // Streak tracking
  updateStreak: () => void;
  resetStreak: () => void;
  
  // Onboarding
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;
  currentOnboardingStep: number;
  setCurrentOnboardingStep: (step: number) => void;
  
  // Theme
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Subscription
  subscription: 'free' | 'premium';
  setSubscription: (subscription: 'free' | 'premium') => void;
  
  // Engagement system
  userStats: UserStats | null;
  setUserStats: (stats: UserStats) => void;
  activeCelebrations: Celebration[];
  addCelebration: (celebration: Celebration) => void;
  removeCelebration: (celebrationId: string) => void;
  clearCelebrations: () => void;
  
  // App initialization
  initialize: () => void;
  reset: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      selectedPlatform: null,
      selectedNiche: null,
      progress: null,
      onboardingComplete: false,
      currentOnboardingStep: 0,
      theme: 'light',
      subscription: 'free',
      userStats: null,
      activeCelebrations: [],
      
      // User actions
      setUser: (user) => set({ user }),
      
      // Platform and niche actions
      setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),
      setSelectedNiche: (niche) => set({ selectedNiche: niche }),
      
      // Progress actions
      setProgress: (progress) => set({ progress }),
      updateProgress: (updates) => 
        set((state) => ({
          progress: state.progress ? { ...state.progress, ...updates } : null
        })),
      
      // Task completion actions
      completeTask: (taskId) =>
        set((state) => {
          if (!state.progress) return state;
          
          const completedTasks = [...state.progress.completedTasks];
          if (completedTasks.includes(taskId)) {
            return state; // Task already completed
          }
          
          completedTasks.push(taskId);
          
          // Update basic progress
          const updatedProgress = {
            ...state.progress,
            completedTasks,
            totalPoints: state.progress.totalPoints + 10,
            lastUpdated: new Date()
          };
          
          // Initialize user stats if not present
          let userStats = state.userStats;
          if (!userStats) {
            userStats = {
              totalTasksCompleted: 0,
              totalPoints: 0,
              currentLevel: 1,
              pointsToNextLevel: 100,
              totalTimeSpent: 0,
              streakData: {
                currentDays: 0,
                longestStreak: 0,
                lastActiveDate: new Date(),
                isActive: false,
                weeklyGoal: 7,
                monthlyGoal: 30
              },
              achievements: [],
              badges: [],
              titles: [],
              currentTitle: undefined
            };
          }
          
          // Process engagement system
          const engagementSystem = new EngagementSystem(userStats);
          const result = engagementSystem.processTaskCompletion(
            taskId, 
            state.selectedPlatform?.id
          );
          
          return {
            progress: updatedProgress,
            userStats: result.updatedStats,
            activeCelebrations: [...state.activeCelebrations, ...result.celebrations]
          };
        }),
      
      uncompleteTask: (taskId) =>
        set((state) => {
          if (!state.progress) return state;
          
          const completedTasks = state.progress.completedTasks.filter(
            (id) => id !== taskId
          );
          
          return {
            progress: {
              ...state.progress,
              completedTasks,
              totalPoints: Math.max(0, state.progress.totalPoints - 10),
              lastUpdated: new Date()
            }
          };
        }),
      
      isTaskCompleted: (taskId) => {
        const { progress } = get();
        return progress?.completedTasks.includes(taskId) || false;
      },
      
      // Streak actions
      updateStreak: () =>
        set((state) => {
          if (!state.progress) return state;
          
          const today = new Date().toDateString();
          const lastActive = new Date(state.progress.lastUpdated).toDateString();
          const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
          
          let streakDays = state.progress.streakDays;
          
          if (lastActive === today) {
            // Already updated today, no change
            return state;
          } else if (lastActive === yesterday) {
            // Continuing streak
            streakDays += 1;
          } else {
            // Streak broken, reset to 1
            streakDays = 1;
          }
          
          return {
            progress: {
              ...state.progress,
              streakDays,
              lastUpdated: new Date()
            }
          };
        }),
      
      resetStreak: () =>
        set((state) => ({
          progress: state.progress 
            ? { ...state.progress, streakDays: 0 }
            : null
        })),
      
      // Onboarding actions
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),
      setCurrentOnboardingStep: (step) => set({ currentOnboardingStep: step }),
      
      // Theme actions
      setTheme: (theme) => set({ theme }),
      
      // Subscription actions
      setSubscription: (subscription) => set({ subscription }),
      
      // Engagement system actions
      setUserStats: (stats) => set({ userStats: stats }),
      addCelebration: (celebration) =>
        set((state) => ({
          activeCelebrations: [...state.activeCelebrations, celebration]
        })),
      removeCelebration: (celebrationId) =>
        set((state) => ({
          activeCelebrations: state.activeCelebrations.filter(c => c.id !== celebrationId)
        })),
      clearCelebrations: () => set({ activeCelebrations: [] }),
      
      // App lifecycle actions
      initialize: () => {
        const { selectedPlatform, selectedNiche, progress } = get();
        
        // Create initial progress if platform and niche are selected but no progress exists
        if (selectedPlatform && selectedNiche && !progress) {
          const initialProgress: UserProgress = {
            userId: 'guest',
            selectedPlatform: selectedPlatform.id,
            selectedNiche: selectedNiche.id,
            currentPhase: 1,
            currentWeek: 1,
            startDate: new Date(),
            completedTasks: [],
            streakDays: 0,
            totalPoints: 0,
            achievements: [],
            lastUpdated: new Date()
          };
          
          set({ progress: initialProgress });
        }
      },
      
      reset: () =>
        set({
          user: null,
          selectedPlatform: null,
          selectedNiche: null,
          progress: null,
          onboardingComplete: false,
          currentOnboardingStep: 0,
          subscription: 'free'
        })
    }),
    {
      name: 'creator-compass-store',
      partialize: (state) => ({
        selectedPlatform: state.selectedPlatform,
        selectedNiche: state.selectedNiche,
        progress: state.progress,
        onboardingComplete: state.onboardingComplete,
        currentOnboardingStep: state.currentOnboardingStep,
        theme: state.theme,
        subscription: state.subscription,
        userStats: state.userStats
      })
    }
  )
);