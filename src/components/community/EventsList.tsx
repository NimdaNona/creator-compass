'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  Globe,
  Building,
  Zap,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  MessageSquare,
  Share2,
  Bell
} from 'lucide-react';
import { CommunityEvent, EventType, EventStatus } from '@/types/community';
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface EventsListProps {
  events: CommunityEvent[];
  loading: boolean;
  onRefresh?: () => void;
}

export function EventsList({ events, loading, onRefresh }: EventsListProps) {
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());
  const [remindersSet, setRemindersSet] = useState<Set<string>>(new Set());

  const handleRegister = async (eventId: string) => {
    try {
      const response = await fetch(`/api/community/events/${eventId}/register`, {
        method: 'POST'
      });

      if (response.ok) {
        setRegisteredEvents(prev => new Set(prev).add(eventId));
        onRefresh?.();
      }
    } catch (error) {
      console.error('Failed to register for event:', error);
    }
  };

  const handleSetReminder = async (eventId: string) => {
    try {
      const response = await fetch(`/api/community/events/${eventId}/reminder`, {
        method: 'POST'
      });

      if (response.ok) {
        setRemindersSet(prev => new Set(prev).add(eventId));
      }
    } catch (error) {
      console.error('Failed to set reminder:', error);
    }
  };

  const getEventTypeIcon = (type: EventType) => {
    switch (type) {
      case EventType.WORKSHOP:
        return <Zap className="h-4 w-4" />;
      case EventType.WEBINAR:
        return <Video className="h-4 w-4" />;
      case EventType.MEETUP:
        return <Users className="h-4 w-4" />;
      case EventType.STREAM:
        return <PlayCircle className="h-4 w-4" />;
      case EventType.QA:
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventTypeColor = (type: EventType) => {
    const colors: Record<EventType, string> = {
      [EventType.WORKSHOP]: 'bg-purple-500/10 text-purple-500',
      [EventType.WEBINAR]: 'bg-blue-500/10 text-blue-500',
      [EventType.MEETUP]: 'bg-green-500/10 text-green-500',
      [EventType.STREAM]: 'bg-red-500/10 text-red-500',
      [EventType.QA]: 'bg-yellow-500/10 text-yellow-500',
      [EventType.CONFERENCE]: 'bg-indigo-500/10 text-indigo-500',
      [EventType.CHALLENGE]: 'bg-pink-500/10 text-pink-500',
      [EventType.OTHER]: 'bg-gray-500/10 text-gray-500'
    };
    return colors[type] || 'bg-gray-500/10 text-gray-500';
  };

  const getLocationIcon = (locationType: CommunityEvent['location']['type']) => {
    switch (locationType) {
      case 'online':
        return <Globe className="h-4 w-4" />;
      case 'in_person':
        return <MapPin className="h-4 w-4" />;
      case 'hybrid':
        return <Building className="h-4 w-4" />;
    }
  };

  const getEventDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getEventStatus = (event: CommunityEvent) => {
    const now = new Date();
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    if (now >= start && now <= end) {
      return { label: 'Live Now', color: 'text-red-500', icon: <Zap className="h-3 w-3" /> };
    }
    if (isPast(end)) {
      return { label: 'Ended', color: 'text-muted-foreground', icon: null };
    }
    if (event.attendees.length >= (event.capacity || Infinity)) {
      return { label: 'Full', color: 'text-orange-500', icon: null };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-muted animate-pulse mb-2" />
                  <div className="h-3 w-32 bg-muted animate-pulse" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-6 w-3/4 bg-muted animate-pulse mb-2" />
              <div className="h-16 w-full bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No upcoming events</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to host an event for the community!
          </p>
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Group events by date
  const groupedEvents = events.reduce((groups, event) => {
    const date = format(new Date(event.startTime), 'yyyy-MM-dd');
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
    return groups;
  }, {} as Record<string, CommunityEvent[]>);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="popLayout">
        {Object.entries(groupedEvents).map(([date, dateEvents]) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{getEventDateLabel(new Date(date))}</span>
              <span className="text-xs">({format(new Date(date), 'EEEE')})</span>
            </div>

            {dateEvents.map((event) => {
              const status = getEventStatus(event);
              const isRegistered = registeredEvents.has(event.id);
              const hasReminder = remindersSet.has(event.id);

              return (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={event.host.image} />
                          <AvatarFallback>
                            {event.host.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link 
                              href={`/profile/${event.host.id}`}
                              className="font-medium hover:underline"
                            >
                              {event.host.name}
                            </Link>
                            {event.coHosts && event.coHosts.length > 0 && (
                              <span className="text-sm text-muted-foreground">
                                +{event.coHosts.length} co-host{event.coHosts.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.startTime), 'h:mm a')} - 
                            {format(new Date(event.endTime), 'h:mm a')} 
                            <span className="text-xs">({event.timezone})</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getEventTypeColor(event.type)}>
                          {getEventTypeIcon(event.type)}
                          <span className="ml-1">{event.type}</span>
                        </Badge>
                        {status && (
                          <div className={cn("flex items-center gap-1 text-sm font-medium", status.color)}>
                            {status.icon}
                            <span>{status.label}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {event.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        {getLocationIcon(event.location.type)}
                        <span>
                          {event.location.type === 'online' 
                            ? event.location.platform 
                            : event.location.address}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>
                          {event.attendees.length}
                          {event.capacity && ` / ${event.capacity}`} attending
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    {event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {event.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Agenda Preview */}
                    {event.agenda && event.agenda.length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <p className="text-sm font-medium">Agenda:</p>
                        {event.agenda.slice(0, 2).map((item, index) => (
                          <div key={index} className="flex gap-3 text-sm">
                            <span className="text-muted-foreground">{item.time}</span>
                            <span>{item.title}</span>
                          </div>
                        ))}
                        {event.agenda.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{event.agenda.length - 2} more items
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="border-t pt-4">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex gap-2">
                        <Link href={`/community/events/${event.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetReminder(event.id)}
                          disabled={hasReminder || isPast(new Date(event.startTime))}
                        >
                          <Bell className={cn(
                            "h-4 w-4",
                            hasReminder && "fill-current"
                          )} />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {!isPast(new Date(event.endTime)) && (
                        <Button
                          size="sm"
                          onClick={() => handleRegister(event.id)}
                          disabled={
                            isRegistered || 
                            event.attendees.length >= (event.capacity || Infinity)
                          }
                        >
                          {isRegistered ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Registered
                            </>
                          ) : event.attendees.length >= (event.capacity || Infinity) ? (
                            'Full'
                          ) : (
                            'Register'
                          )}
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Load More */}
      {events.length >= 20 && (
        <div className="text-center">
          <Button variant="outline" onClick={onRefresh}>
            Load More Events
          </Button>
        </div>
      )}
    </div>
  );
}