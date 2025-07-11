'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Notification } from '@/types/notifications';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = useCallback(async (unreadOnlyParam = false) => {
    setLoading(true);
    setUnreadOnly(unreadOnlyParam);
    setPage(1);
    
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '20',
        ...(unreadOnlyParam && { unreadOnly: 'true' })
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');

      const data = await response.json();
      setNotifications(data.notifications);
      setHasMore(data.pagination.page < data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (!response.ok) throw new Error('Failed to fetch unread count');

      const data = await response.json();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true })
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH'
      });

      if (!response.ok) throw new Error('Failed to mark all as read');

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete notification');

      const notification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams({
        page: nextPage.toString(),
        limit: '20',
        ...(unreadOnly && { unreadOnly: 'true' })
      });

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to load more notifications');

      const data = await response.json();
      setNotifications(prev => [...prev, ...data.notifications]);
      setPage(nextPage);
      setHasMore(data.pagination.page < data.pagination.totalPages);
    } catch (error) {
      console.error('Error loading more notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, unreadOnly]);

  // Set up polling for real-time updates
  useEffect(() => {
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      // Only fetch if we're on the first page
      if (page === 1) {
        fetchNotifications(unreadOnly);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [page, unreadOnly, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore
  };
}