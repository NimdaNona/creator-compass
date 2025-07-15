'use client';

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface RealtimeAnalyticsUpdate {
  type: 'metric' | 'content' | 'milestone';
  metric?: string;
  value?: number | string;
  change?: number | string;
  contentUpdate?: {
    published?: number;
    scheduled?: number;
    draft?: number;
    ideas?: number;
  };
  milestoneUpdate?: {
    completed: number;
    total: number;
  };
}

interface UseRealtimeAnalyticsOptions {
  onUpdate: (update: RealtimeAnalyticsUpdate) => void;
  enabled?: boolean;
}

export function useRealtimeAnalytics({ onUpdate, enabled = true }: UseRealtimeAnalyticsOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;

    try {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // Create new SSE connection
      const eventSource = new EventSource('/api/analytics/sse');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[Analytics SSE] Connected');
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle heartbeat
          if (data.type === 'heartbeat') {
            return;
          }

          // Handle analytics updates
          if (data.type === 'analytics-update') {
            onUpdate(data.update);
          }
        } catch (error) {
          console.error('[Analytics SSE] Failed to parse message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('[Analytics SSE] Connection error:', error);
        eventSource.close();
        
        // Implement exponential backoff for reconnection
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          console.log(`[Analytics SSE] Reconnecting in ${delay}ms...`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else {
          toast.error('Lost connection to analytics updates');
        }
      };
    } catch (error) {
      console.error('[Analytics SSE] Failed to establish connection:', error);
    }
  }, [enabled, onUpdate]);

  useEffect(() => {
    connect();

    return () => {
      // Clean up connections and timeouts
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connect]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  return { reconnect };
}