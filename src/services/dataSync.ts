import { EventEmitter } from 'events';
import { toast } from 'sonner';

// Types for synchronization events
export type SyncEventType = 
  | 'task:completed'
  | 'task:uncompleted'
  | 'progress:updated'
  | 'achievement:unlocked'
  | 'stats:updated'
  | 'sync:started'
  | 'sync:completed'
  | 'sync:error';

interface SyncEvent {
  type: SyncEventType;
  data: any;
  timestamp: number;
}

interface PendingUpdate {
  id: string;
  type: SyncEventType;
  data: any;
  retries: number;
  timestamp: number;
}

// Singleton data synchronization service
class DataSyncService extends EventEmitter {
  private static instance: DataSyncService;
  private pendingUpdates: Map<string, PendingUpdate> = new Map();
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private retryQueue: Set<string> = new Set();
  private lastSyncTime: number = Date.now();
  private syncInterval: NodeJS.Timeout | null = null;

  // Configuration
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly DEBOUNCE_DELAY = 300; // 300ms

  private constructor() {
    super();
    this.initialize();
  }

  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  private initialize() {
    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      
      // Monitor visibility changes
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.sync();
        }
      });

      // Start periodic sync
      this.startPeriodicSync();
    }
  }

  private handleOnline() {
    this.isOnline = true;
    this.emit('connection:online');
    toast.success('Connection restored');
    this.processPendingUpdates();
  }

  private handleOffline() {
    this.isOnline = false;
    this.emit('connection:offline');
    toast.warning('Working offline - changes will sync when reconnected');
  }

  private startPeriodicSync() {
    this.syncInterval = setInterval(() => {
      this.sync();
    }, this.SYNC_INTERVAL);
  }

  // Main synchronization method
  async sync() {
    if (this.isSyncing || !this.isOnline) return;

    this.isSyncing = true;
    this.emit('sync:started');

    try {
      // Fetch latest data from server
      const response = await fetch('/api/sync/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }

      const serverData = await response.json();
      
      // Reconcile with local state
      this.reconcileData(serverData);
      
      // Process any pending updates
      await this.processPendingUpdates();
      
      this.lastSyncTime = Date.now();
      this.emit('sync:completed', { timestamp: this.lastSyncTime });
      
    } catch (error) {
      console.error('Sync error:', error);
      this.emit('sync:error', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Reconcile server data with local state
  private reconcileData(serverData: any) {
    // This would integrate with your Zustand store
    // For now, we'll emit events that the store can listen to
    this.emit('data:reconcile', serverData);
  }

  // Queue an update for synchronization
  queueUpdate(type: SyncEventType, data: any): string {
    const updateId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const update: PendingUpdate = {
      id: updateId,
      type,
      data,
      retries: 0,
      timestamp: Date.now()
    };

    this.pendingUpdates.set(updateId, update);
    
    // Debounce the sync
    this.debouncedSync();
    
    return updateId;
  }

  // Debounced sync to batch updates
  private syncTimer: NodeJS.Timeout | null = null;
  private debouncedSync() {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }
    
    this.syncTimer = setTimeout(() => {
      this.processPendingUpdates();
    }, this.DEBOUNCE_DELAY);
  }

  // Process all pending updates
  private async processPendingUpdates() {
    if (!this.isOnline || this.pendingUpdates.size === 0) return;

    const updates = Array.from(this.pendingUpdates.values());
    const batches = this.batchUpdates(updates);

    for (const batch of batches) {
      await this.processBatch(batch);
    }
  }

  // Batch updates by type for efficiency
  private batchUpdates(updates: PendingUpdate[]): PendingUpdate[][] {
    const batches: Map<SyncEventType, PendingUpdate[]> = new Map();
    
    updates.forEach(update => {
      const batch = batches.get(update.type) || [];
      batch.push(update);
      batches.set(update.type, batch);
    });

    return Array.from(batches.values());
  }

  // Process a batch of updates
  private async processBatch(batch: PendingUpdate[]) {
    if (batch.length === 0) return;

    const type = batch[0].type;
    const endpoint = this.getEndpointForType(type);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          updates: batch.map(u => ({
            id: u.id,
            data: u.data,
            timestamp: u.timestamp
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to sync ${type}`);
      }

      const result = await response.json();
      
      // Remove successful updates from pending
      batch.forEach(update => {
        if (result.processed?.includes(update.id)) {
          this.pendingUpdates.delete(update.id);
        }
      });

      // Handle partial failures
      if (result.failed?.length > 0) {
        this.handleFailedUpdates(result.failed);
      }

    } catch (error) {
      console.error(`Batch sync error for ${type}:`, error);
      this.handleBatchError(batch);
    }
  }

  // Get API endpoint for update type
  private getEndpointForType(type: SyncEventType): string {
    const endpoints: Record<SyncEventType, string> = {
      'task:completed': '/api/sync/tasks',
      'task:uncompleted': '/api/sync/tasks',
      'progress:updated': '/api/sync/progress',
      'achievement:unlocked': '/api/sync/achievements',
      'stats:updated': '/api/sync/stats',
      'sync:started': '',
      'sync:completed': '',
      'sync:error': ''
    };

    return endpoints[type] || '/api/sync/general';
  }

  // Handle failed updates
  private handleFailedUpdates(failedIds: string[]) {
    failedIds.forEach(id => {
      const update = this.pendingUpdates.get(id);
      if (update) {
        update.retries++;
        
        if (update.retries >= this.MAX_RETRIES) {
          this.pendingUpdates.delete(id);
          this.emit('update:failed', update);
          toast.error('Some changes could not be saved');
        } else {
          this.retryQueue.add(id);
          this.scheduleRetry();
        }
      }
    });
  }

  // Handle batch errors
  private handleBatchError(batch: PendingUpdate[]) {
    batch.forEach(update => {
      update.retries++;
      
      if (update.retries >= this.MAX_RETRIES) {
        this.pendingUpdates.delete(update.id);
        this.emit('update:failed', update);
      } else {
        this.retryQueue.add(update.id);
      }
    });
    
    this.scheduleRetry();
  }

  // Schedule retry for failed updates
  private retryTimer: NodeJS.Timeout | null = null;
  private scheduleRetry() {
    if (this.retryTimer) return;
    
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.processRetryQueue();
    }, this.RETRY_DELAY * Math.min(this.retryQueue.size, 3));
  }

  // Process retry queue
  private async processRetryQueue() {
    if (this.retryQueue.size === 0) return;
    
    const retryIds = Array.from(this.retryQueue);
    this.retryQueue.clear();
    
    const updates = retryIds
      .map(id => this.pendingUpdates.get(id))
      .filter(Boolean) as PendingUpdate[];
    
    const batches = this.batchUpdates(updates);
    
    for (const batch of batches) {
      await this.processBatch(batch);
    }
  }

  // Optimistic update with rollback support
  async optimisticUpdate<T>(
    action: () => Promise<T>,
    rollback: () => void,
    syncData: { type: SyncEventType; data: any }
  ): Promise<T> {
    try {
      // Perform the action
      const result = await action();
      
      // Queue sync
      this.queueUpdate(syncData.type, syncData.data);
      
      return result;
    } catch (error) {
      // Rollback on error
      rollback();
      throw error;
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingUpdates: this.pendingUpdates.size,
      lastSyncTime: this.lastSyncTime,
      retryQueue: this.retryQueue.size
    };
  }

  // Force sync
  forceSync() {
    return this.sync();
  }

  // Clear pending updates (use with caution)
  clearPendingUpdates() {
    this.pendingUpdates.clear();
    this.retryQueue.clear();
    toast.info('Pending updates cleared');
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    this.removeAllListeners();
  }
}

// Export singleton instance
export const dataSync = DataSyncService.getInstance();

// Export types
export type { SyncEvent, PendingUpdate };