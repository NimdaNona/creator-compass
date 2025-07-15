'use client';

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GripVertical, Youtube, Music2, Twitch, Edit2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarEvent {
  id: string;
  title: string;
  platform: string;
  contentType: string;
  status: 'idea' | 'draft' | 'ready' | 'scheduled' | 'published';
  scheduledDate: Date;
  color?: string;
  duration?: number;
  description?: string;
}

interface DraggableEventCardProps {
  event: CalendarEvent;
  view: 'month' | 'week';
  isDragging?: boolean;
  onClick?: () => void;
  onUpdate?: (updates: { title: string }) => void;
}

export function DraggableEventCard({
  event,
  view,
  isDragging = false,
  onClick,
  onUpdate
}: DraggableEventCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(event.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: event.id,
    disabled: isEditing,
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (editValue.trim() && editValue !== event.title) {
      try {
        const response = await fetch(`/api/calendar/events/${event.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editValue.trim() }),
        });

        if (!response.ok) {
          throw new Error('Failed to update event');
        }

        onUpdate?.({ title: editValue.trim() });
        toast.success('Event updated');
      } catch (error) {
        toast.error('Failed to update event');
        setEditValue(event.title);
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(event.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-3 h-3" />;
      case 'tiktok':
        return <Music2 className="w-3 h-3" />;
      case 'twitch':
        return <Twitch className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'bg-red-500';
      case 'tiktok': return 'bg-black';
      case 'twitch': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-50';
      case 'scheduled': return 'text-blue-600 bg-blue-50';
      case 'ready': return 'text-yellow-600 bg-yellow-50';
      case 'draft': return 'text-gray-600 bg-gray-50';
      case 'idea': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (view === 'week') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "bg-background border rounded-md p-2 cursor-pointer group",
          "hover:shadow-md transition-all duration-200",
          "flex items-start gap-2",
          (isSortableDragging || isDragging) && "opacity-50 shadow-lg z-50",
          event.color && `border-l-4`
        )}
        onClick={onClick}
        {...attributes}
      >
        <div
          {...listeners}
          className="mt-0.5 cursor-move text-muted-foreground hover:text-foreground"
        >
          <GripVertical className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("p-1 rounded", getPlatformColor(event.platform))}>
              {getPlatformIcon(event.platform)}
            </div>
            <Badge variant="secondary" className={cn("text-xs", getStatusColor(event.status))}>
              {event.status}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {isEditing ? (
              <>
                <Input
                  ref={inputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-6 text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancel();
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <>
                <h4 className="font-medium text-sm truncate flex-1">{event.title}</h4>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
          
          {event.duration && (
            <p className="text-xs text-muted-foreground mt-1">
              {event.duration} min
            </p>
          )}
        </div>
      </div>
    );
  }

  // Month view - more compact
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "text-xs p-1 rounded truncate cursor-pointer",
        "hover:opacity-80 transition-all duration-200",
        "flex items-center gap-1",
        getPlatformColor(event.platform),
        "text-white",
        (isSortableDragging || isDragging) && "opacity-50 shadow-lg z-50 ring-2 ring-primary"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      {...attributes}
      {...listeners}
    >
      {getPlatformIcon(event.platform)}
      <span className="truncate flex-1">{event.title}</span>
    </div>
  );
}