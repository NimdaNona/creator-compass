'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NotificationToast } from './NotificationToast';
import type { Notification } from '@/types/notifications';

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id' | 'userId' | 'isRead' | 'createdAt'>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotificationToast() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationToast must be used within NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Array<Notification & { tempId: string }>>([]);

  const showNotification = useCallback((notification: Omit<Notification, 'id' | 'userId' | 'isRead' | 'createdAt'>) => {
    const tempId = `temp-${Date.now()}`;
    const newNotification = {
      ...notification,
      id: tempId,
      tempId,
      userId: '',
      isRead: false,
      createdAt: new Date()
    };

    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((tempId: string) => {
    setNotifications(prev => prev.filter(n => n.tempId !== tempId));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Render active toast notifications */}
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.tempId}
          notification={notification}
          onClose={() => removeNotification(notification.tempId)}
        />
      ))}
    </NotificationContext.Provider>
  );
}