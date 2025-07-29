'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  ArrowRight,
  Clock,
  Users,
  Video,
  Mic,
  BookOpen,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export function CommunityEventsWidget() {
  // Mock data for preview
  const upcomingEvents = [
    {
      id: '1',
      title: 'YouTube Algorithm Masterclass',
      type: 'workshop',
      host: 'Sarah Chen',
      date: 'Tomorrow',
      time: '2:00 PM EST',
      attendees: 45,
      capacity: 100,
      isLive: false,
      isPremium: false
    },
    {
      id: '2',
      title: 'Creator Q&A: Breaking 100k Subs',
      type: 'ama',
      host: 'CreatorCompass Team',
      date: 'Thursday',
      time: '4:00 PM EST',
      attendees: 128,
      capacity: 200,
      isLive: false,
      isPremium: true
    },
    {
      id: '3',
      title: 'Networking Hour: Gaming Creators',
      type: 'networking',
      host: 'Community',
      date: 'Friday',
      time: '6:00 PM EST',
      attendees: 67,
      capacity: 150,
      isLive: false,
      isPremium: false
    }
  ];

  const eventIcons = {
    workshop: BookOpen,
    ama: Mic,
    networking: Users,
    webinar: Video
  };

  const eventColors = {
    workshop: 'blue',
    ama: 'purple',
    networking: 'green',
    webinar: 'orange'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Events
          </CardTitle>
          <CardDescription>
            Learn and connect
          </CardDescription>
        </div>
        <Button size="sm" asChild>
          <Link href="/community?tab=events">
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingEvents.map((event, index) => {
          const EventIcon = eventIcons[event.type];
          const isAlmostFull = event.attendees / event.capacity > 0.8;
          
          return (
            <motion.div
              key={event.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <div className={`p-2 rounded-lg bg-${eventColors[event.type]}-100 dark:bg-${eventColors[event.type]}-900/20`}>
                    <EventIcon className={`h-4 w-4 text-${eventColors[event.type]}-600 dark:text-${eventColors[event.type]}-400`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-sm">{event.title}</h5>
                      {event.isPremium && (
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Hosted by {event.host}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{event.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-xs ${isAlmostFull ? 'text-orange-600 font-medium' : 'text-muted-foreground'}`}>
                      {event.attendees}/{event.capacity}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs">
                    RSVP
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* CTA */}
        <div className="pt-2">
          <Button size="sm" variant="outline" className="w-full" asChild>
            <Link href="/community/events/create">
              <Calendar className="h-4 w-4 mr-2" />
              Host Your Own Event
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}