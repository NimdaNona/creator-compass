'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Video, 
  Film, 
  Radio, 
  FileText,
  Clock,
  Edit,
  CheckCircle,
  Calendar,
  Circle
} from 'lucide-react';

interface ContentCardProps {
  event: {
    id: string;
    title: string;
    platform: string;
    contentType: string;
    status: 'idea' | 'draft' | 'ready' | 'scheduled' | 'published';
    scheduledDate: Date;
    color?: string;
    duration?: number;
  };
  view: 'month' | 'week' | 'list';
  onClick?: () => void;
}

export function ContentCard({ event, view, onClick }: ContentCardProps) {
  const getContentIcon = () => {
    switch (event.contentType) {
      case 'video': return Video;
      case 'short': return Film;
      case 'stream': return Radio;
      case 'post': return FileText;
      default: return FileText;
    }
  };

  const getStatusIcon = () => {
    switch (event.status) {
      case 'published': return CheckCircle;
      case 'scheduled': return Calendar;
      case 'ready': return Clock;
      case 'draft': return Edit;
      case 'idea': return Circle;
      default: return Circle;
    }
  };

  const getStatusColor = () => {
    switch (event.status) {
      case 'published': return 'text-green-500';
      case 'scheduled': return 'text-blue-500';
      case 'ready': return 'text-yellow-500';
      case 'draft': return 'text-gray-500';
      case 'idea': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const getPlatformStyles = () => {
    switch (event.platform) {
      case 'youtube':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-700 dark:text-red-300'
        };
      case 'tiktok':
        return {
          bg: 'bg-gray-50 dark:bg-gray-950/20',
          border: 'border-gray-200 dark:border-gray-800',
          text: 'text-gray-700 dark:text-gray-300'
        };
      case 'twitch':
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/20',
          border: 'border-purple-200 dark:border-purple-800',
          text: 'text-purple-700 dark:text-purple-300'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-950/20',
          border: 'border-gray-200 dark:border-gray-800',
          text: 'text-gray-700 dark:text-gray-300'
        };
    }
  };

  const ContentIcon = getContentIcon();
  const StatusIcon = getStatusIcon();
  const platformStyles = getPlatformStyles();

  if (view === 'week') {
    return (
      <div
        className={cn(
          "p-2 rounded-md border cursor-pointer",
          "hover:shadow-sm transition-all",
          platformStyles.bg,
          platformStyles.border
        )}
        onClick={onClick}
      >
        <div className="flex items-start gap-1">
          <ContentIcon className={cn("w-3 h-3 mt-0.5 flex-shrink-0", platformStyles.text)} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{event.title}</p>
            <div className="flex items-center gap-1 mt-1">
              <StatusIcon className={cn("w-3 h-3", getStatusColor())} />
              <span className="text-xs text-muted-foreground">
                {event.duration && `${event.duration}min`}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'list') {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border",
          "hover:shadow-sm transition-all cursor-pointer",
          platformStyles.bg,
          platformStyles.border
        )}
        onClick={onClick}
      >
        <ContentIcon className={cn("w-5 h-5 flex-shrink-0", platformStyles.text)} />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{event.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {event.platform}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {event.contentType}
            </span>
            {event.duration && (
              <span className="text-xs text-muted-foreground">
                • {event.duration}min
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("w-4 h-4", getStatusColor())} />
          <span className="text-sm text-muted-foreground capitalize">
            {event.status}
          </span>
        </div>
      </div>
    );
  }

  // Default compact view for month calendar
  return null;
}