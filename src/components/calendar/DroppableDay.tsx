'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, Lock } from 'lucide-react';
import { DraggableEventCard } from './DraggableEventCard';

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

interface DroppableDayProps {
  id: string;
  date: Date;
  events: CalendarEvent[];
  isAccessible: boolean;
  isCurrentMonth?: boolean;
  isToday: boolean;
  view: 'month' | 'week';
  onEventClick?: (event: CalendarEvent) => void;
  onAddClick?: () => void;
  onEventUpdate?: (eventId: string, updates: { title: string }) => void;
}

export function DroppableDay({
  id,
  date,
  events,
  isAccessible,
  isCurrentMonth = true,
  isToday,
  view,
  onEventClick,
  onAddClick,
  onEventUpdate
}: DroppableDayProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled: !isAccessible,
  });

  const sortedEventIds = events.map(e => e.id);

  if (view === 'week') {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[400px] bg-background p-2 transition-colors relative",
          isOver && "bg-primary/5",
          !isAccessible && "opacity-50"
        )}
      >
        <div className="text-center mb-2">
          <div className="text-xs text-muted-foreground">
            {format(date, 'EEE')}
          </div>
          <div className={cn(
            "text-lg font-semibold",
            isToday && "text-primary"
          )}>
            {format(date, 'd')}
          </div>
        </div>

        {isAccessible ? (
          <>
            <SortableContext
              items={sortedEventIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {events.map((event) => (
                  <DraggableEventCard
                    key={event.id}
                    event={event}
                    view="week"
                    onClick={() => onEventClick?.(event)}
                    onUpdate={(updates) => onEventUpdate?.(event.id, updates)}
                  />
                ))}
              </div>
            </SortableContext>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-8 text-xs mt-2"
              onClick={onAddClick}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>
    );
  }

  // Month view
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] bg-background p-2 relative group transition-colors",
        "hover:bg-muted/50",
        isOver && "bg-primary/5",
        !isCurrentMonth && "bg-muted/30",
        !isAccessible && "cursor-not-allowed"
      )}
    >
      {/* Date number */}
      <div className={cn(
        "text-sm font-medium mb-1",
        isToday && "text-primary font-bold",
        !isCurrentMonth && "text-muted-foreground"
      )}>
        {format(date, 'd')}
      </div>

      {/* Events or Lock */}
      {isAccessible ? (
        <>
          <SortableContext
            items={sortedEventIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-1">
              {events.slice(0, 3).map((event) => (
                <DraggableEventCard
                  key={event.id}
                  event={event}
                  view="month"
                  onClick={() => onEventClick?.(event)}
                  onUpdate={(updates) => onEventUpdate?.(event.id, updates)}
                />
              ))}
              {events.length > 3 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{events.length - 3} more
                </div>
              )}
            </div>
          </SortableContext>

          {/* Add button (visible on hover) */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onAddClick?.();
            }}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </>
      ) : (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <Lock className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}