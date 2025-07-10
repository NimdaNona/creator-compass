// Re-export store hooks for convenience
export { useAppStore } from './useAppStore';
export { useUserStore } from './useUserStore';

// Combined store hook for components that need both
import { useAppStore } from './useAppStore';
import { useUserStore } from './useUserStore';

export function useStore() {
  const appStore = useAppStore();
  const userStore = useUserStore();
  
  return {
    // App store
    selectedPlatform: appStore.selectedPlatform,
    selectedNiche: appStore.selectedNiche,
    onboardingComplete: appStore.onboardingComplete,
    progress: appStore.progress,
    
    // User store
    user: userStore.user,
    isLoading: userStore.isLoading,
    
    // Combined getters
    isReady: appStore.onboardingComplete && !userStore.isLoading,
    hasProfile: !!appStore.selectedPlatform && !!appStore.selectedNiche
  };
}