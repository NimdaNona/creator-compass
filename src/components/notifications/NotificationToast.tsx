'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types/notifications';

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onClick?: () => void;
}

export function NotificationToast({ notification, onClose, onClick }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const colorClasses = {
    green: 'border-green-500 bg-green-50',
    blue: 'border-blue-500 bg-blue-50',
    orange: 'border-orange-500 bg-orange-50',
    yellow: 'border-yellow-500 bg-yellow-50',
    red: 'border-red-500 bg-red-50',
    purple: 'border-purple-500 bg-purple-50',
    gray: 'border-gray-500 bg-gray-50',
    gold: 'border-yellow-500 bg-yellow-50'
  };

  const animationClasses = {
    bounce: 'animate-bounce-in',
    slide: 'animate-slide-in-right',
    pulse: 'animate-pulse-in',
    shake: 'animate-shake-in'
  };

  useEffect(() => {
    // Show notification
    setTimeout(() => setIsVisible(true), 100);

    // Auto-hide after duration
    const hideTimer = setTimeout(() => {
      handleClose();
    }, notification.duration);

    return () => clearTimeout(hideTimer);
  }, [notification.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 min-w-[300px] max-w-md',
        'transform transition-all duration-300 ease-out',
        isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        animationClasses[notification.animation as keyof typeof animationClasses]
      )}
    >
      <div
        className={cn(
          'relative border-l-4 rounded-lg shadow-lg p-4 cursor-pointer',
          colorClasses[notification.color as keyof typeof colorClasses]
        )}
        onClick={() => {
          onClick?.();
          handleClose();
        }}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 text-2xl">
            {notification.icon}
          </div>

          {/* Content */}
          <div className="flex-1">
            <p className="font-semibold text-sm">{notification.title}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {notification.message}
            </p>
          </div>

          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 -mr-2 -mt-2"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}