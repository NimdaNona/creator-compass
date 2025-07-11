'use client';

import { useState, useEffect } from 'react';
import { format, addDays, isAfter } from 'date-fns';
import { ContentCard } from './ContentCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Calendar, Plus, Lock } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  platform: string;
  contentType: string;
  status: 'idea' | 'draft' | 'ready' | 'scheduled' | 'published';
  scheduledDate: Date;
  color?: string;
  duration?: number;
}

interface ContentListProps {
  currentDate: Date;
  hasFullAccess: boolean;
  freeUserDaysLimit: number;
}

export function ContentList({
  currentDate,
  hasFullAccess,
  freeUserDaysLimit
}: ContentListProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'draft'>('all');

  // Calculate the free user limit date
  const today = new Date();
  const freeUserLimitDate = addDays(today, freeUserDaysLimit);

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
        duration: 15,
        color: '#FF0000'
      },
      {
        id: '2',
        title: 'Quick Tip: Lighting Setup',
        platform: 'tiktok',
        contentType: 'short',
        status: 'draft',
        scheduledDate: addDays(today, 5),
        duration: 1,
        color: '#000000'
      },
      {
        id: '3',
        title: 'Live Stream: Q&A Session',
        platform: 'twitch',
        contentType: 'stream',
        status: 'ready',
        scheduledDate: addDays(today, 7),
        duration: 120,
        color: '#9146FF'
      },
      {
        id: '4',
        title: 'Tutorial: Advanced Editing',
        platform: 'youtube',
        contentType: 'video',
        status: 'idea',
        scheduledDate: addDays(today, 10),
        duration: 20,
        color: '#FF0000'
      }
    ];
    setEvents(mockEvents);
  }, []);

  // Filter and sort events
  const filteredEvents = events
    .filter(event => {
      if (!hasFullAccess && isAfter(event.scheduledDate, freeUserLimitDate)) {
        return false;
      }
      if (filter === 'all') return true;
      return event.status === filter;
    })
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  // Group events by date
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = format(event.scheduledDate, 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, CalendarEvent[]>);

  const handleEventClick = (event: CalendarEvent) => {
    // Handle event click - open edit modal or navigate to detail
    console.log('Event clicked:', event);
  };

  return (
    <div className="p-4">
      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'scheduled' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('scheduled')}
        >
          Scheduled
        </Button>
        <Button
          variant={filter === 'draft' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('draft')}
        >
          Drafts
        </Button>
      </div>

      {/* Content list */}
      {Object.keys(groupedEvents).length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No content scheduled"
          description="Start planning your content by clicking the Add Content button"
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([date, dateEvents]) => {
            const dateObj = new Date(date);
            const isAccessible = hasFullAccess || !isAfter(dateObj, freeUserLimitDate);
            
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">
                    {format(dateObj, 'EEEE, MMMM d')}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {dateEvents.length} items
                  </Badge>
                </div>
                
                {isAccessible ? (
                  <div className="space-y-2">
                    {dateEvents.map((event) => (
                      <ContentCard
                        key={event.id}
                        event={event}
                        view="list"
                        onClick={() => handleEventClick(event)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/30">
                    <div className="text-center">
                      <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Upgrade to plan further ahead
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Show upgrade prompt for free users */}
          {!hasFullAccess && events.some(e => isAfter(e.scheduledDate, freeUserLimitDate)) && (
            <div className="mt-6 p-4 border rounded-lg bg-muted/30">
              <p className="text-sm text-center text-muted-foreground">
                Some content is beyond your {freeUserDaysLimit}-day planning limit.
                <Button variant="link" className="px-1">
                  Upgrade to Premium
                </Button>
                to unlock unlimited planning.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Floating action button for mobile */}
      <div className="fixed bottom-24 right-4 md:hidden">
        <Button
          size="icon"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => {
            // Handle add content
          }}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}