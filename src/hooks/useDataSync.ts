import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { dataSync, SyncEventType } from '@/services/dataSync';
import { toast } from 'sonner';

interface UseSyncOptions {
  enableAutoSync?: boolean;
  syncOnMount?: boolean;
  syncOnFocus?: boolean;
}

export function useDataSync(options: UseSyncOptions = {}) {
  const {
    enableAutoSync = true,
    syncOnMount = true,
    syncOnFocus = true
  } = options;

  const store = useAppStore();
  const isMountedRef = useRef(false);
  const lastSyncRef = useRef<number>(0);

  // Initialize sync handlers
  useEffect(() => {
    if (!enableAutoSync) return;

    // Handle data reconciliation
    const handleReconcile = (serverData: any) => {
      // Update store with server data
      if (serverData.user) {
        // Update user profile
        if (serverData.user.profile) {
          const { selectedPlatform, selectedNiche } = serverData.user.profile;
          
          if (selectedPlatform) {
            store.setSelectedPlatform(selectedPlatform);
          }
          
          if (selectedNiche) {
            store.setSelectedNiche(selectedNiche);
          }
        }

        // Update subscription
        if (serverData.user.subscription) {
          store.updateSubscription(serverData.user.subscription);
        }

        // Update stats
        if (serverData.user.stats) {
          const { points, streak, tasksCompleted } = serverData.user.stats;
          
          if (points !== undefined) {
            store.addPoints(points - (store.points || 0));
          }
          
          if (streak !== undefined && streak !== store.streak) {
            store.setStreak(streak);
          }
        }
      }

      // Update progress
      if (serverData.progress) {
        const { completedTaskIds, roadmaps } = serverData.progress;
        
        if (completedTaskIds && Array.isArray(completedTaskIds)) {
          // Reconcile completed tasks
          const currentCompleted = new Set(store.progress?.completedTasks || []);
          const serverCompleted = new Set(completedTaskIds);
          
          // Add any missing completions
          completedTaskIds.forEach(taskId => {
            if (!currentCompleted.has(taskId)) {
              store.completeTask(taskId);
            }
          });
        }

        if (roadmaps && roadmaps.length > 0) {
          const roadmap = roadmaps[0]; // Primary roadmap
          store.updateProgress({
            currentPhase: roadmap.currentPhase,
            currentWeek: roadmap.currentWeek,
            percentage: roadmap.progressPercentage
          });
        }
      }

      // Update achievements
      if (serverData.achievements?.milestones) {
        const achievementIds = serverData.achievements.milestones.map((ma: any) => ma.milestoneId);
        const currentAchievements = new Set(store.achievements?.map(a => a.id) || []);
        
        // Add any missing achievements
        serverData.achievements.milestones.forEach((ma: any) => {
          if (!currentAchievements.has(ma.milestoneId)) {
            store.addAchievement({
              id: ma.milestoneId,
              ...ma.milestone,
              unlockedAt: ma.achievedAt
            });
          }
        });
      }

      // Update usage
      if (serverData.usage) {
        Object.entries(serverData.usage).forEach(([feature, data]: [string, any]) => {
          store.updateUsage(feature as any, data.count);
        });
      }

      lastSyncRef.current = Date.now();
    };

    // Handle sync events
    const handleSyncStarted = () => {
      console.log('Sync started');
    };

    const handleSyncCompleted = () => {
      console.log('Sync completed');
    };

    const handleSyncError = (error: any) => {
      console.error('Sync error:', error);
      toast.error('Failed to sync data');
    };

    const handleConnectionOnline = () => {
      console.log('Connection restored');
    };

    const handleConnectionOffline = () => {
      console.log('Connection lost');
    };

    // Subscribe to sync events
    dataSync.on('data:reconcile', handleReconcile);
    dataSync.on('sync:started', handleSyncStarted);
    dataSync.on('sync:completed', handleSyncCompleted);
    dataSync.on('sync:error', handleSyncError);
    dataSync.on('connection:online', handleConnectionOnline);
    dataSync.on('connection:offline', handleConnectionOffline);

    // Initial sync on mount
    if (syncOnMount && !isMountedRef.current) {
      isMountedRef.current = true;
      dataSync.sync();
    }

    // Sync on focus
    const handleFocus = () => {
      if (syncOnFocus && Date.now() - lastSyncRef.current > 30000) {
        dataSync.sync();
      }
    };

    if (syncOnFocus) {
      window.addEventListener('focus', handleFocus);
    }

    // Cleanup
    return () => {
      dataSync.off('data:reconcile', handleReconcile);
      dataSync.off('sync:started', handleSyncStarted);
      dataSync.off('sync:completed', handleSyncCompleted);
      dataSync.off('sync:error', handleSyncError);
      dataSync.off('connection:online', handleConnectionOnline);
      dataSync.off('connection:offline', handleConnectionOffline);
      
      if (syncOnFocus) {
        window.removeEventListener('focus', handleFocus);
      }
    };
  }, [enableAutoSync, syncOnMount, syncOnFocus, store]);

  // Queue update helper
  const queueUpdate = useCallback((type: SyncEventType, data: any) => {
    return dataSync.queueUpdate(type, data);
  }, []);

  // Optimistic update helper
  const optimisticUpdate = useCallback(async <T,>(
    action: () => Promise<T>,
    rollback: () => void,
    syncData: { type: SyncEventType; data: any }
  ): Promise<T> => {
    return dataSync.optimisticUpdate(action, rollback, syncData);
  }, []);

  // Force sync
  const forceSync = useCallback(() => {
    return dataSync.forceSync();
  }, []);

  // Get sync status
  const getSyncStatus = useCallback(() => {
    return dataSync.getSyncStatus();
  }, []);

  return {
    queueUpdate,
    optimisticUpdate,
    forceSync,
    getSyncStatus,
    isOnline: dataSync.getSyncStatus().isOnline,
    isSyncing: dataSync.getSyncStatus().isSyncing,
    pendingUpdates: dataSync.getSyncStatus().pendingUpdates
  };
}