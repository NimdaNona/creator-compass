'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { GeneratedIdea } from './IdeaGenerator';

interface ScheduleIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  idea: GeneratedIdea | null;
  platform?: string;
}

export function ScheduleIdeaModal({
  isOpen,
  onClose,
  idea,
  platform
}: ScheduleIdeaModalProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState('09:00');
  const [isLoading, setIsLoading] = useState(false);

  const handleSchedule = async () => {
    if (!idea || !date) return;

    try {
      setIsLoading(true);

      // Create calendar event from the idea
      const scheduledDateTime = new Date(date);
      const [hours, minutes] = time.split(':').map(Number);
      scheduledDateTime.setHours(hours, minutes);

      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: idea.title,
          description: `${idea.description}\n\nHook: ${idea.hook}`,
          platform: platform || 'youtube',
          contentType: idea.contentType,
          status: 'idea',
          scheduledDate: scheduledDateTime.toISOString(),
          tags: idea.keywords,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule idea');
      }

      toast.success('Idea scheduled successfully!');
      onClose();
      
      // Redirect to calendar
      router.push('/calendar');
    } catch (error) {
      console.error('Error scheduling idea:', error);
      toast.error('Failed to schedule idea');
    } finally {
      setIsLoading(false);
    }
  };

  if (!idea) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Content Idea</DialogTitle>
          <DialogDescription>
            Choose when to work on this content idea
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Idea Preview */}
          <div className="p-3 rounded-lg bg-muted">
            <h4 className="font-medium mb-1">{idea.title}</h4>
            <p className="text-sm text-muted-foreground">{idea.description}</p>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Select a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-2">
            <Label>Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={isLoading || !date}>
            {isLoading ? 'Scheduling...' : 'Schedule Idea'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}