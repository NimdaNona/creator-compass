'use client';

import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useEffect } from 'react';

export function RealtimeNotificationProvider({ children }: { children: React.ReactNode }) {
  const { isConnected, reconnect } = useRealtimeNotifications();

  // Show connection status in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Realtime notifications connected:', isConnected);
    }
  }, [isConnected]);

  // Attempt to reconnect on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected) {
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, reconnect]);

  return <>{children}</>;
}