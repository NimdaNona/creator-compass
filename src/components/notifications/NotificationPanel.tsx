'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Settings, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NotificationPanelProps {
  onClose: () => void;
  onNotificationRead?: () => void;
}

export function NotificationPanel({ onClose, onNotificationRead }: NotificationPanelProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const { 
    notifications, 
    loading, 
    hasMore, 
    fetchNotifications, 
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadMore 
  } = useNotifications();

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications(activeTab === 'unread');
  }, [fetchNotifications, activeTab]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    onNotificationRead?.();
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
      onNotificationRead?.();
    }
    // Handle navigation based on notification type
    // Add specific navigation logic here
  };

  const handleSettingsClick = () => {
    router.push('/settings/notifications');
    onClose();
  };

  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute right-0 top-12 w-96 bg-background border rounded-lg shadow-lg z-50",
        "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-lg">Notifications</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleMarkAllAsRead}
            title="Mark all as read"
          >
            <CheckCheck className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleSettingsClick}
            title="Notification settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}>
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="m-0">
          <ScrollArea className="h-[400px]">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {activeTab === 'unread' 
                  ? "You're all caught up! No unread notifications."
                  : "No notifications yet."}
              </div>
            ) : (
              <div className="divide-y">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onDelete={() => {
                      deleteNotification(notification.id);
                      if (!notification.isRead) {
                        onNotificationRead?.();
                      }
                    }}
                  />
                ))}
                
                {hasMore && (
                  <div className="p-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={loadMore}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load more'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}