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
  isBefore,
  isAfter
} from 'date-fns';
import { cn } from '@/lib/utils';
import { ContentCard } from './ContentCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Lock } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  platform: string;
  contentType: string;
  status: 'idea' | 'draft' | 'ready' | 'scheduled' | 'published';
  scheduledDate: Date;
  color?: string;
}

interface ContentCalendarProps {
  view: 'month' | 'week';
  currentDate: Date;
  hasFullAccess: boolean;
  freeUserDaysLimit: number;
}

export function ContentCalendar({
  view,
  currentDate,
  hasFullAccess,
  freeUserDaysLimit
}: ContentCalendarProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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

  // Mock data - replace with API call
  useEffect(() => {
    const mockEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'New Video: Getting Started Guide',
        platform: 'youtube',
        contentType: 'video',
        status: 'scheduled',
        scheduledDate: addDays(today, 2),
        color: '#FF0000'
      },
      {
        id: '2',
        title: 'Quick Tip: Lighting Setup',
        platform: 'tiktok',
        contentType: 'short',
        status: 'draft',
        scheduledDate: addDays(today, 5),
        color: '#000000'
      },
      {
        id: '3',
        title: 'Live Stream: Q&A Session',
        platform: 'twitch',
        contentType: 'stream',
        status: 'ready',
        scheduledDate: addDays(today, 7),
        color: '#9146FF'
      }
    ];
    setEvents(mockEvents);
  }, []);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'ready': return 'bg-yellow-500';
      case 'draft': return 'bg-gray-500';
      case 'idea': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (view === 'week') {
    // Week view implementation
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="p-4">
        <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
          {weekDays.map((day) => {
            const dayEvents = getEventsForDate(day);
            const isAccessible = isDateAccessible(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[400px] bg-background p-2",
                  !isAccessible && "opacity-50 relative"
                )}
              >
                <div className="text-center mb-2">
                  <div className="text-xs text-muted-foreground">
                    {format(day, 'EEE')}
                  </div>
                  <div className={cn(
                    "text-lg font-semibold",
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>

                {isAccessible ? (
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <ContentCard
                        key={event.id}
                        event={event}
                        view="week"
                      />
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => setSelectedDate(day)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Month view
  return (
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

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] bg-background p-2 relative group",
                "hover:bg-muted/50 transition-colors",
                !isCurrentMonth && "bg-muted/30",
                !isAccessible && "cursor-not-allowed"
              )}
              onClick={() => isAccessible && setSelectedDate(day)}
            >
              {/* Date number */}
              <div className={cn(
                "text-sm font-medium mb-1",
                isToday(day) && "text-primary font-bold",
                !isCurrentMonth && "text-muted-foreground"
              )}>
                {format(day, 'd')}
              </div>

              {/* Events or Lock */}
              {isAccessible ? (
                <>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs p-1 rounded truncate cursor-pointer",
                          "hover:opacity-80 transition-opacity",
                          getPlatformColor(event.platform),
                          "text-white"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle event click
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>

                  {/* Add button (visible on hover) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(day);
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
  );
}