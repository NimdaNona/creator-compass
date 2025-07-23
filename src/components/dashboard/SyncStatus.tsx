'use client';

import { useEffect, useState } from 'react';
import { useDataSync } from '@/hooks/useDataSync';
import { Badge } from '@/components/ui/badge';
import { 
  CloudOff, 
  Cloud, 
  RefreshCw, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function SyncStatus() {
  const { isOnline, isSyncing, pendingUpdates, getSyncStatus } = useDataSync();
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const status = getSyncStatus();
      if (status.lastSyncTime) {
        setLastSync(new Date(status.lastSyncTime));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getSyncStatus]);

  const getTimeSinceSync = () => {
    if (!lastSync) return 'Never';
    
    const seconds = Math.floor((Date.now() - lastSync.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!isOnline) {
    return (
      <Badge variant="outline" className="text-xs">
        <CloudOff className="w-3 h-3 mr-1" />
        Offline
        {pendingUpdates > 0 && (
          <span className="ml-1">({pendingUpdates} pending)</span>
        )}
      </Badge>
    );
  }

  if (isSyncing) {
    return (
      <Badge variant="outline" className="text-xs">
        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
        Syncing...
      </Badge>
    );
  }

  if (pendingUpdates > 0) {
    return (
      <Badge variant="outline" className="text-xs">
        <AlertCircle className="w-3 h-3 mr-1 text-yellow-500" />
        {pendingUpdates} pending
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-xs">
      <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
      Synced {getTimeSinceSync()}
    </Badge>
  );
}