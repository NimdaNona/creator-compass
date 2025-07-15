'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface SavedIdea {
  id: string;
  title: string;
  description: string;
  contentType: string;
  platform: string;
  keywords: string[];
}

interface BulkScheduleIdeasProps {
  isOpen: boolean;
  onClose: () => void;
  ideas: SavedIdea[];
  hasFullAccess: boolean;
}

export function BulkScheduleIdeas({
  isOpen,
  onClose,
  ideas,
  hasFullAccess
}: BulkScheduleIdeasProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [schedulingMode, setSchedulingMode] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleIdea = (ideaId: string) => {
    setSelectedIds(prev => 
      prev.includes(ideaId) 
        ? prev.filter(id => id !== ideaId)
        : [...prev, ideaId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === ideas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ideas.map(idea => idea.id));
    }
  };

  const handleSchedule = async () => {
    if (!hasFullAccess) {
      toast.error('Bulk scheduling is a premium feature');
      return;
    }

    if (selectedIds.length === 0 || !startDate) {
      toast.error('Please select ideas and a start date');
      return;
    }

    try {
      setIsLoading(true);

      // Prepare events based on scheduling mode
      const events = selectedIds.map((id, index) => {
        const idea = ideas.find(i => i.id === id)!;
        let scheduledDate = new Date(startDate);
        
        if (schedulingMode === 'daily') {
          scheduledDate = addDays(startDate, index);
        } else if (schedulingMode === 'weekly') {
          scheduledDate = addDays(startDate, index * 7);
        }

        const [hours, minutes] = timeOfDay.split(':').map(Number);
        scheduledDate.setHours(hours, minutes);

        return {
          title: idea.title,
          description: idea.description,
          platform: idea.platform,
          contentType: idea.contentType,
          status: 'idea',
          scheduledDate: scheduledDate.toISOString(),
          tags: idea.keywords,
        };
      });

      // Call bulk API
      const response = await fetch('/api/calendar/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.upgradeRequired) {
          toast.error('Bulk scheduling is a premium feature. Please upgrade to use this feature.');
          return;
        }
        throw new Error(error.error || 'Failed to schedule ideas');
      }

      const result = await response.json();
      toast.success(`Successfully scheduled ${result.count} ideas!`);
      
      // Mark ideas as scheduled (optional - could add a scheduledAt field)
      // TODO: Update ideas status in database
      
      onClose();
      router.push('/calendar');
    } catch (error) {
      console.error('Error scheduling ideas:', error);
      toast.error('Failed to schedule ideas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Schedule Ideas</DialogTitle>
          <DialogDescription>
            Schedule multiple ideas at once to your content calendar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Ideas Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Select Ideas to Schedule</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedIds.length === ideas.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
                  onClick={() => handleToggleIdea(idea.id)}
                >
                  <Checkbox
                    checked={selectedIds.includes(idea.id)}
                    onCheckedChange={() => handleToggleIdea(idea.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{idea.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {idea.platform}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {idea.contentType}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground mt-2">
              {selectedIds.length} of {ideas.length} ideas selected
            </p>
          </div>

          {/* Scheduling Options */}
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time */}
              <div className="space-y-2">
                <Label>Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Scheduling Mode */}
            <div className="space-y-2">
              <Label>Scheduling Pattern</Label>
              <Select value={schedulingMode} onValueChange={(v: any) => setSchedulingMode(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily (one per day)</SelectItem>
                  <SelectItem value="weekly">Weekly (one per week)</SelectItem>
                  <SelectItem value="custom">Custom (manual dates)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          {selectedIds.length > 0 && startDate && (
            <Card className="p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Schedule Preview
              </h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                {selectedIds.slice(0, 3).map((id, index) => {
                  const idea = ideas.find(i => i.id === id);
                  let date = new Date(startDate);
                  
                  if (schedulingMode === 'daily') {
                    date = addDays(startDate, index);
                  } else if (schedulingMode === 'weekly') {
                    date = addDays(startDate, index * 7);
                  }

                  return (
                    <p key={id}>
                      {format(date, 'MMM d')} - {idea?.title}
                    </p>
                  );
                })}
                {selectedIds.length > 3 && (
                  <p>...and {selectedIds.length - 3} more</p>
                )}
              </div>
            </Card>
          )}
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
          <Button
            onClick={handleSchedule}
            disabled={isLoading || selectedIds.length === 0 || !startDate}
          >
            {isLoading ? 'Scheduling...' : `Schedule ${selectedIds.length} Ideas`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}