'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Video, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { format, addDays, startOfWeek } from 'date-fns';

interface ScheduledContent {
  id: string;
  title: string;
  type: 'video' | 'post' | 'stream';
  scheduledFor: Date;
  status: 'draft' | 'scheduled' | 'published';
}

export default function CalendarPreview() {
  const [upcomingContent, setUpcomingContent] = useState<ScheduledContent[]>([]);
  const { selectedPlatform } = useAppStore();

  useEffect(() => {
    fetchUpcomingContent();
  }, []);

  const fetchUpcomingContent = async () => {
    try {
      const response = await fetch('/api/content/calendar?limit=5');
      if (response.ok) {
        const data = await response.json();
        setUpcomingContent(data.content || []);
      }
    } catch (error) {
      console.error('Error fetching calendar:', error);
      // Use mock data for now
      const mockData = generateMockContent();
      setUpcomingContent(mockData);
    }
  };

  const generateMockContent = (): ScheduledContent[] => {
    const today = new Date();
    return [
      {
        id: '1',
        title: 'Weekly Update Video',
        type: 'video',
        scheduledFor: addDays(today, 1),
        status: 'scheduled'
      },
      {
        id: '2',
        title: 'Behind the Scenes Post',
        type: 'post',
        scheduledFor: addDays(today, 2),
        status: 'draft'
      },
      {
        id: '3',
        title: 'Live Q&A Stream',
        type: 'stream',
        scheduledFor: addDays(today, 3),
        status: 'scheduled'
      }
    ];
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'stream':
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Content Calendar
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <a href="/calendar">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {upcomingContent.length > 0 ? (
            upcomingContent.map((content) => (
              <div
                key={content.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="p-2 rounded bg-primary/10 text-primary">
                  {getContentIcon(content.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {content.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(content.scheduledFor, 'MMM d, h:mm a')}
                  </p>
                </div>
                
                <Badge className={cn("text-xs", getStatusColor(content.status))}>
                  {content.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                No content scheduled yet
              </p>
              <Button size="sm" asChild>
                <a href="/calendar">
                  Plan Your First Content
                </a>
              </Button>
            </div>
          )}
        </div>
        
        {upcomingContent.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {upcomingContent.filter(c => c.status === 'scheduled').length} scheduled
              </span>
              <Button variant="outline" size="sm" asChild>
                <a href="/templates">
                  <Video className="mr-2 h-3 w-3" />
                  Create Content
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}