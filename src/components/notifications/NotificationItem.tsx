'use client';

import { formatDistanceToNow } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/notifications';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDelete: () => void;
}

export function NotificationItem({ notification, onClick, onDelete }: NotificationItemProps) {
  const colorClasses = {
    green: 'text-green-600 bg-green-50',
    blue: 'text-blue-600 bg-blue-50',
    orange: 'text-orange-600 bg-orange-50',
    yellow: 'text-yellow-600 bg-yellow-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50',
    gray: 'text-gray-600 bg-gray-50',
    gold: 'text-yellow-600 bg-yellow-50'
  };

  const animationClasses = {
    bounce: 'animate-bounce-once',
    slide: 'animate-slide-in',
    pulse: 'animate-pulse-once',
    shake: 'animate-shake-once'
  };

  return (
    <div
      className={cn(
        'group relative p-4 hover:bg-muted/50 cursor-pointer transition-colors',
        !notification.isRead && 'bg-muted/20',
        animationClasses[notification.animation as keyof typeof animationClasses]
      )}
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div 
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl',
            colorClasses[notification.color as keyof typeof colorClasses]
          )}
        >
          {notification.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className={cn(
                'font-medium text-sm',
                !notification.isRead && 'font-semibold'
              )}>
                {notification.title}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>

            {/* Delete button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Unread indicator */}
        {!notification.isRead && (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
        )}
      </div>
    </div>
  );
}