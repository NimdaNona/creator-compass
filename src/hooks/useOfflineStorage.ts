'use client';

import { useState, useEffect, useCallback } from 'react';

interface OfflineQueueItem {
  id: string;
  type: 'task-completion' | 'profile-update' | 'achievement-unlock';
  data: any;
  timestamp: number;
  retries: number;
}

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncQueue, setSyncQueue] = useState<OfflineQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Load queue from localStorage on mount
    loadSyncQueue();

    // Set up online/offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadSyncQueue = () => {
    try {
      const stored = localStorage.getItem('creator-compass-sync-queue');
      if (stored) {
        const queue = JSON.parse(stored);
        setSyncQueue(queue);
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  };

  const saveSyncQueue = (queue: OfflineQueueItem[]) => {
    try {
      localStorage.setItem('creator-compass-sync-queue', JSON.stringify(queue));
      setSyncQueue(queue);
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  };

  const addToQueue = useCallback((type: OfflineQueueItem['type'], data: any) => {
    const item: OfflineQueueItem = {
      id: crypto.randomUUID(),
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    const newQueue = [...syncQueue, item];
    saveSyncQueue(newQueue);

    // Try to sync immediately if online
    if (isOnline) {
      processQueue();
    }

    return item.id;
  }, [syncQueue, isOnline]);

  const removeFromQueue = useCallback((id: string) => {
    const newQueue = syncQueue.filter(item => item.id !== id);
    saveSyncQueue(newQueue);
  }, [syncQueue]);

  const processQueue = useCallback(async () => {
    if (isSyncing || !isOnline || syncQueue.length === 0) {
      return;
    }

    setIsSyncing(true);

    try {
      const processedItems: string[] = [];

      for (const item of syncQueue) {
        try {
          const success = await syncItem(item);
          if (success) {
            processedItems.push(item.id);
          } else {
            // Increment retry count
            item.retries += 1;
            
            // Remove items that have failed too many times
            if (item.retries >= 3) {
              processedItems.push(item.id);
              console.warn('Dropping sync item after 3 failures:', item);
            }
          }
        } catch (error) {
          console.error('Error syncing item:', item, error);
          item.retries += 1;
          
          if (item.retries >= 3) {
            processedItems.push(item.id);
          }
        }
      }

      // Remove successfully processed items
      if (processedItems.length > 0) {
        const newQueue = syncQueue.filter(item => !processedItems.includes(item.id));
        saveSyncQueue(newQueue);
      }

    } finally {
      setIsSyncing(false);
    }
  }, [syncQueue, isOnline, isSyncing]);

  const syncItem = async (item: OfflineQueueItem): Promise<boolean> => {
    try {
      let endpoint = '';
      let method = 'POST';
      
      switch (item.type) {
        case 'task-completion':
          endpoint = '/api/progress';
          break;
        case 'profile-update':
          endpoint = '/api/user/profile';
          method = 'PUT';
          break;
        case 'achievement-unlock':
          endpoint = '/api/achievements';
          break;
        default:
          console.warn('Unknown sync item type:', item.type);
          return false;
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item.data),
      });

      if (response.ok) {
        console.log('Successfully synced item:', item.type, item.id);
        return true;
      } else {
        console.error('Failed to sync item:', item.type, response.status);
        return false;
      }
    } catch (error) {
      console.error('Network error syncing item:', item, error);
      return false;
    }
  };

  // Offline-first data operations
  const saveOfflineData = useCallback((key: string, data: any) => {
    try {
      localStorage.setItem(`creator-compass-offline-${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }, []);

  const getOfflineData = useCallback((key: string) => {
    try {
      const stored = localStorage.getItem(`creator-compass-offline-${key}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to get offline data:', error);
    }
    return null;
  }, []);

  const completeTaskOffline = useCallback((taskId: string, data: any = {}) => {
    // Save locally
    const taskProgress = {
      taskId,
      completedAt: new Date().toISOString(),
      ...data,
    };
    
    saveOfflineData(`task-${taskId}`, taskProgress);
    
    // Add to sync queue
    addToQueue('task-completion', {
      taskId,
      ...data,
    });

    return taskProgress;
  }, [saveOfflineData, addToQueue]);

  const updateProfileOffline = useCallback((profileData: any) => {
    // Save locally
    saveOfflineData('profile', profileData);
    
    // Add to sync queue
    addToQueue('profile-update', profileData);

    return profileData;
  }, [saveOfflineData, addToQueue]);

  return {
    isOnline,
    syncQueue,
    isSyncing,
    queueLength: syncQueue.length,
    addToQueue,
    removeFromQueue,
    processQueue,
    saveOfflineData,
    getOfflineData,
    completeTaskOffline,
    updateProfileOffline,
  };
}