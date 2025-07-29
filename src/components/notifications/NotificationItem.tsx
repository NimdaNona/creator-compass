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
    green: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/30',
    blue: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30',
    orange: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/30',
    yellow: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/30',
    red: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/30',
    purple: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/30',
    gray: 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950/30',
    gold: 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950/30'
  };

  const animationClasses = {
    bounce: 'animate-bounce-once',
    slide: 'animate-slide-in',
    pulse: 'animate-pulse-once',
    shake: 'animate-shake-once'
  };

  return (
    <div
      role="article"
      aria-label={`${notification.isRead ? 'Read' : 'Unread'} notification: ${notification.title}`}
      className={cn(
        'group relative p-4 hover:bg-muted/50 cursor-pointer transition-all duration-200',
        'hover:shadow-sm hover:translate-x-1',
        !notification.isRead && 'bg-muted/20 border-l-2 border-primary',
        animationClasses[notification.animation as keyof typeof animationClasses]
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div 
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl',
            'transition-transform duration-200 group-hover:scale-110',
            colorClasses[notification.color as keyof typeof colorClasses]
          )}
          aria-hidden="true"
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
              className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="Delete notification"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Unread indicator */}
        {!notification.isRead && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}