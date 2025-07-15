'use client';

import { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addDays,
  isAfter
} from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { DraggableEventCard } from './DraggableEventCard';
import { DroppableDay } from './DroppableDay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

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

interface ContentCalendarProps {
  view: 'month' | 'week';
  currentDate: Date;
  hasFullAccess: boolean;
  freeUserDaysLimit: number;
  onEventCreate?: (date: Date) => void;
  onEventEdit?: (event: CalendarEvent) => void;
}

export function DraggableContentCalendar({
  view,
  currentDate,
  hasFullAccess,
  freeUserDaysLimit,
  onEventCreate,
  onEventEdit
}: ContentCalendarProps) {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate the date range for the calendar
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  // Get all days to display
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Calculate the free user limit date
  const today = new Date();
  const freeUserLimitDate = addDays(today, freeUserDaysLimit);

  // Check if a date is accessible for free users
  const isDateAccessible = (date: Date) => {
    if (hasFullAccess) return true;
    return !isAfter(date, freeUserLimitDate);
  };

  // Fetch events from API
  useEffect(() => {
    if (!session?.user) return;
    
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          view,
          date: currentDate.toISOString(),
        });
        
        const response = await fetch(`/api/calendar/events?${params}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        const eventsWithDates = data.events.map((event: any) => ({
          ...event,
          scheduledDate: new Date(event.scheduledDate)
        }));
        
        setEvents(eventsWithDates);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load calendar events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [session, currentDate, view]);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.scheduledDate, date));
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'bg-red-500';
      case 'tiktok': return 'bg-black';
      case 'twitch': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const activeEvent = events.find(e => e.id === active.id);
    const overDate = new Date(over.id as string);

    if (!activeEvent || !isDateAccessible(overDate)) {
      toast.error('Cannot move event to this date');
      setActiveId(null);
      return;
    }

    // Optimistically update UI
    const updatedEvents = events.map(e => 
      e.id === activeEvent.id 
        ? { ...e, scheduledDate: overDate }
        : e
    );
    setEvents(updatedEvents);

    try {
      // Update event on server
      const response = await fetch(`/api/calendar/events/${activeEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduledDate: overDate.toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      toast.success('Event moved successfully');
    } catch (error) {
      // Revert on error
      setEvents(events);
      toast.error('Failed to move event');
      console.error('Error updating event:', error);
    }

    setActiveId(null);
  };

  const activeEvent = activeId ? events.find(e => e.id === activeId) : null;

  if (view === 'week') {
    // Week view implementation
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="p-4">
          <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
            {weekDays.map((day) => {
              const dayEvents = getEventsForDate(day);
              const isAccessible = isDateAccessible(day);
              const dayId = day.toISOString();

              return (
                <DroppableDay
                  key={dayId}
                  id={dayId}
                  date={day}
                  events={dayEvents}
                  isAccessible={isAccessible}
                  isToday={isToday(day)}
                  view="week"
                  onEventClick={onEventEdit}
                  onAddClick={() => onEventCreate?.(day)}
                  onEventUpdate={(eventId, updates) => {
                    setEvents(events.map(e => 
                      e.id === eventId ? { ...e, ...updates } : e
                    ));
                  }}
                />
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeEvent && (
            <DraggableEventCard
              event={activeEvent}
              view="week"
              isDragging
              onUpdate={() => {}}
            />
          )}
        </DragOverlay>
      </DndContext>
    );
  }

  // Month view
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-px mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
          {days.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isAccessible = isDateAccessible(day);
            const dayId = day.toISOString();

            return (
              <DroppableDay
                key={dayId}
                id={dayId}
                date={day}
                events={dayEvents}
                isAccessible={isAccessible}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday(day)}
                view="month"
                onEventClick={onEventEdit}
                onAddClick={() => onEventCreate?.(day)}
                onEventUpdate={(eventId, updates) => {
                  setEvents(events.map(e => 
                    e.id === eventId ? { ...e, ...updates } : e
                  ));
                }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mt-4">
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>YouTube</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 bg-black rounded" />
            <span>TikTok</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 bg-purple-500 rounded" />
            <span>Twitch</span>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeEvent && (
          <DraggableEventCard
            event={activeEvent}
            view="month"
            isDragging
            onUpdate={() => {}}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}