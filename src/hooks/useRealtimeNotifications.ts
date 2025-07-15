'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useNotificationToast } from '@/components/notifications/NotificationProvider';
import { toast } from 'sonner';

interface NotificationEvent {
  type: 'connected' | 'heartbeat' | 'notification' | 'reconnect';
  notification?: any;
  timestamp?: string;
}

export function useRealtimeNotifications() {
  const { data: session } = useSession();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const { showNotification } = useNotificationToast();

  const connect = useCallback(() => {
    if (!session?.user || eventSourceRef.current?.readyState === EventSource.OPEN) {
      return;
    }

    try {
      console.log('Connecting to notification SSE...');
      const eventSource = new EventSource('/api/notifications/sse');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data: NotificationEvent = JSON.parse(event.data);
          
          switch (data.type) {
            case 'connected':
              console.log('Connected to notification service');
              break;
            
            case 'heartbeat':
              // Keep-alive message, no action needed
              break;
              
            case 'reconnect':
              // Server is asking us to reconnect before timeout
              console.log('Server requested reconnection');
              eventSource.close();
              eventSourceRef.current = null;
              setTimeout(() => connect(), 1000);
              break;
            
            case 'notification':
              if (data.notification) {
                // Show the notification using the toast system
                showNotification({
                  type: data.notification.type,
                  title: data.notification.title,
                  message: data.notification.message,
                  icon: data.notification.icon,
                  color: data.notification.color,
                  animation: data.notification.animation,
                  duration: data.notification.duration
                });

                // Also show a browser notification if permitted
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification(data.notification.title, {
                    body: data.notification.message,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: data.notification.id,
                  });
                }
              }
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        eventSource.close();
        eventSourceRef.current = null;

        // Implement exponential backoff for reconnection
        const attempts = reconnectAttemptsRef.current;
        if (attempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${attempts + 1})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, delay);
        } else {
          toast.error('Lost connection to notification service');
        }
      };
    } catch (error) {
      console.error('Error creating EventSource:', error);
    }
  }, [session, showNotification]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Connect when session is available
  useEffect(() => {
    if (session?.user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [session, connect, disconnect]);

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    reconnect: connect,
    disconnect
  };
}