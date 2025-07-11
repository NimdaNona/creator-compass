'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TimeSlot {
  time: string;
  engagement: 'high' | 'medium' | 'low';
  reason: string;
}

interface ScheduleOptimizerProps {
  platform: any;
  onTimeSelect: (time: string) => void;
}

export function ScheduleOptimizer({ platform, onTimeSelect }: ScheduleOptimizerProps) {
  // Platform-specific optimal times
  const getOptimalTimes = (): TimeSlot[] => {
    switch (platform?.id) {
      case 'youtube':
        return [
          { time: '2:00 PM', engagement: 'high', reason: 'Peak afternoon viewership' },
          { time: '5:00 PM', engagement: 'high', reason: 'After work/school hours' },
          { time: '8:00 PM', engagement: 'medium', reason: 'Evening entertainment time' },
          { time: '10:00 AM', engagement: 'medium', reason: 'Weekend morning viewers' }
        ];
      case 'tiktok':
        return [
          { time: '6:00 AM', engagement: 'high', reason: 'Morning scroll time' },
          { time: '10:00 AM', engagement: 'medium', reason: 'Mid-morning break' },
          { time: '7:00 PM', engagement: 'high', reason: 'Peak evening usage' },
          { time: '10:00 PM', engagement: 'high', reason: 'Before bed scrolling' }
        ];
      case 'twitch':
        return [
          { time: '7:00 PM', engagement: 'high', reason: 'Prime time viewing' },
          { time: '9:00 PM', engagement: 'high', reason: 'Peak concurrent viewers' },
          { time: '2:00 PM', engagement: 'medium', reason: 'Weekend afternoon' },
          { time: '11:00 PM', engagement: 'medium', reason: 'Late night audience' }
        ];
      default:
        return [
          { time: '9:00 AM', engagement: 'medium', reason: 'Morning activity' },
          { time: '12:00 PM', engagement: 'medium', reason: 'Lunch break' },
          { time: '5:00 PM', engagement: 'high', reason: 'After work' },
          { time: '8:00 PM', engagement: 'high', reason: 'Evening leisure' }
        ];
    }
  };

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEngagementBadge = (engagement: string) => {
    switch (engagement) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const optimalTimes = getOptimalTimes();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Optimal Times
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Based on platform analytics and audience behavior</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {optimalTimes.map((slot, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-between h-auto py-2"
            onClick={() => onTimeSelect(slot.time)}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getEngagementColor(slot.engagement)}`} />
              <span className="font-medium">{slot.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{slot.reason}</span>
              <Badge variant={getEngagementBadge(slot.engagement)} className="text-xs">
                {slot.engagement}
              </Badge>
            </div>
          </Button>
        ))}
        
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>Times shown in your local timezone</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}