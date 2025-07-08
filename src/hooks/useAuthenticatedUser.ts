import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/useUserStore';
import { useAppStore } from '@/store/useAppStore';

/**
 * Hook that provides authenticated user data and functions
 * Combines NextAuth session with user store for data management
 */
export function useAuthenticatedUser() {
  const { data: session, status } = useSession();
  const userStore = useUserStore();
  const appStore = useAppStore();
  
  // Fetch user data when session is available
  useEffect(() => {
    if (session?.user?.id && !userStore.profile && !userStore.isLoading) {
      userStore.fetchUserData();
    }
  }, [session?.user?.id, userStore.profile, userStore.isLoading]);
  
  // Sync selected platform/niche with app store for backward compatibility
  useEffect(() => {
    if (userStore.profile) {
      if (userStore.profile.selectedPlatform && !userStore.selectedPlatform) {
        // You would need to convert the platform ID to Platform object here
        // This requires the platform data to be available
      }
      
      if (userStore.profile.selectedNiche && !userStore.selectedNiche) {
        // Similar conversion for niche
      }
    }
  }, [userStore.profile]);
  
  const isAuthenticated = status === 'authenticated' && !!session?.user;
  const isLoading = status === 'loading' || userStore.isLoading;
  
  return {
    // Authentication state
    session,
    user: session?.user,
    isAuthenticated,
    isLoading,
    error: userStore.error,
    
    // User data
    profile: userStore.profile,
    progress: userStore.progress,
    achievements: userStore.achievements,
    stats: userStore.stats,
    celebrations: userStore.celebrations,
    activeCelebrations: userStore.activeCelebrations,
    
    // UI state
    selectedPlatform: userStore.selectedPlatform || appStore.selectedPlatform,
    selectedNiche: userStore.selectedNiche || appStore.selectedNiche,
    
    // Actions
    updateProfile: userStore.updateProfile,
    completeTask: userStore.completeTask,
    addAchievement: userStore.addAchievement,
    addCelebration: userStore.addCelebration,
    markCelebrationsAsRead: userStore.markCelebrationsAsRead,
    
    // UI actions
    setSelectedPlatform: (platform: any) => {
      userStore.setSelectedPlatform(platform);
      appStore.setSelectedPlatform(platform);
    },
    setSelectedNiche: (niche: any) => {
      userStore.setSelectedNiche(niche);
      appStore.setSelectedNiche(niche);
    },
    
    // Helper functions
    isTaskCompleted: userStore.isTaskCompleted,
    getCompletedTasksCount: userStore.getCompletedTasksCount,
    getTotalPoints: userStore.getTotalPoints,
    getCurrentStreak: userStore.getCurrentStreak,
    
    // Backward compatibility with existing components
    theme: appStore.theme,
    setTheme: appStore.setTheme,
    subscription: appStore.subscription,
    setSubscription: appStore.setSubscription,
    
    // Reset
    reset: () => {
      userStore.reset();
      appStore.reset();
    },
  };
}