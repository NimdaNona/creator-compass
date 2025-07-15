'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CalendarDays,
  Copy,
  Calendar,
  Clock,
  Hash,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';

const bulkScheduleSchema = z.object({
  mode: z.enum(['multiple', 'recurring']),
  // For multiple events
  events: z.array(z.object({
    title: z.string().min(1, 'Title is required'),
    platform: z.string(),
    contentType: z.string(),
    date: z.string(),
    time: z.string(),
  })).optional(),
  // For recurring events
  template: z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    platform: z.string(),
    contentType: z.string(),
    tags: z.string().optional(),
  }).optional(),
  schedule: z.object({
    startDate: z.string(),
    frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
    count: z.coerce.number().min(1).max(52),
    timeOfDay: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  }).optional(),
});

type BulkScheduleFormData = z.infer<typeof bulkScheduleSchema>;

interface BulkSchedulerProps {
  onSuccess?: () => void;
}

const platformOptions = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'twitch', label: 'Twitch' },
];

const contentTypeOptions = {
  youtube: [
    { value: 'video', label: 'Video' },
    { value: 'short', label: 'YouTube Short' },
    { value: 'live', label: 'Live Stream' },
  ],
  tiktok: [
    { value: 'short', label: 'TikTok Video' },
    { value: 'live', label: 'TikTok LIVE' },
  ],
  twitch: [
    { value: 'stream', label: 'Stream' },
    { value: 'clip', label: 'Clip' },
  ],
};

export function BulkScheduler({ onSuccess }: BulkSchedulerProps) {
  const { selectedPlatform, subscription } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'multiple' | 'recurring'>('multiple');
  const [multipleEvents, setMultipleEvents] = useState([
    {
      id: '1',
      title: '',
      platform: selectedPlatform || 'youtube',
      contentType: 'video',
      date: format(new Date(), 'yyyy-MM-dd'),
      time: '09:00',
    }
  ]);

  const form = useForm<BulkScheduleFormData>({
    resolver: zodResolver(bulkScheduleSchema),
    defaultValues: {
      mode: 'multiple',
      template: {
        title: '',
        description: '',
        platform: selectedPlatform || 'youtube',
        contentType: 'video',
        tags: '',
      },
      schedule: {
        startDate: format(new Date(), 'yyyy-MM-dd'),
        frequency: 'weekly',
        count: 4,
        timeOfDay: '09:00',
      },
    },
  });

  const hasAccess = subscription !== 'free';

  const addEvent = () => {
    const newEvent = {
      id: Date.now().toString(),
      title: '',
      platform: selectedPlatform || 'youtube',
      contentType: 'video',
      date: format(addDays(new Date(), multipleEvents.length), 'yyyy-MM-dd'),
      time: '09:00',
    };
    setMultipleEvents([...multipleEvents, newEvent]);
  };

  const removeEvent = (id: string) => {
    setMultipleEvents(multipleEvents.filter(e => e.id !== id));
  };

  const updateEvent = (id: string, field: string, value: string) => {
    setMultipleEvents(multipleEvents.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const onSubmit = async (data: BulkScheduleFormData) => {
    try {
      setIsLoading(true);

      let payload: any = {};

      if (mode === 'multiple') {
        // Validate and prepare multiple events
        const validEvents = multipleEvents.filter(e => e.title.trim());
        if (validEvents.length === 0) {
          toast.error('Please add at least one event with a title');
          return;
        }

        payload = {
          events: validEvents.map(e => ({
            title: e.title,
            platform: e.platform,
            contentType: e.contentType,
            status: 'idea',
            scheduledDate: new Date(`${e.date}T${e.time}`).toISOString(),
            tags: [],
          })),
        };
      } else {
        // Prepare recurring events
        if (!data.template?.title.trim()) {
          toast.error('Please enter a title for the recurring series');
          return;
        }

        const tags = data.template.tags
          ? data.template.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          : [];

        payload = {
          events: [{
            title: data.template.title,
            description: data.template.description,
            platform: data.template.platform,
            contentType: data.template.contentType,
            status: 'idea',
            scheduledDate: new Date(`${data.schedule!.startDate}T${data.schedule!.timeOfDay}`).toISOString(),
            tags,
          }],
          schedule: data.schedule,
        };
      }

      const response = await fetch('/api/calendar/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.upgradeRequired) {
          toast.error('Bulk scheduling is a premium feature. Please upgrade to use this feature.');
          return;
        }
        throw new Error(error.error || 'Failed to create events');
      }

      const result = await response.json();
      toast.success(`Successfully created ${result.count} events`);
      
      onSuccess?.();
      setIsOpen(false);
      
      // Reset form
      form.reset();
      setMultipleEvents([{
        id: '1',
        title: '',
        platform: selectedPlatform || 'youtube',
        contentType: 'video',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
      }]);
    } catch (error) {
      console.error('Error creating bulk events:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create events');
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasAccess) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Bulk Scheduling
          </CardTitle>
          <CardDescription>
            Create multiple events at once
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-3">
            <Sparkles className="w-8 h-8 mx-auto text-purple-500" />
            <p className="text-sm text-muted-foreground">
              Bulk scheduling is a premium feature
            </p>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/pricing'}
            >
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Bulk Scheduling
            </CardTitle>
            <CardDescription>
              Create multiple events at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Bulk Schedule
            </Button>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Schedule Content</DialogTitle>
          <DialogDescription>
            Create multiple events at once or set up a recurring schedule
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="multiple">Multiple Events</TabsTrigger>
            <TabsTrigger value="recurring">Recurring Series</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6">
              <TabsContent value="multiple" className="space-y-4">
                <div className="space-y-3">
                  {multipleEvents.map((event, index) => (
                    <Card key={event.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Event {index + 1}</Label>
                          {multipleEvents.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeEvent(event.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <Input
                          placeholder="Event title"
                          value={event.title}
                          onChange={(e) => updateEvent(event.id, 'title', e.target.value)}
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <Select
                            value={event.platform}
                            onValueChange={(value) => updateEvent(event.id, 'platform', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {platformOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select
                            value={event.contentType}
                            onValueChange={(value) => updateEvent(event.id, 'contentType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(contentTypeOptions[event.platform as keyof typeof contentTypeOptions] || []).map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="date"
                              className="pl-10"
                              value={event.date}
                              onChange={(e) => updateEvent(event.id, 'date', e.target.value)}
                            />
                          </div>

                          <div className="relative">
                            <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="time"
                              className="pl-10"
                              value={event.time}
                              onChange={(e) => updateEvent(event.id, 'time', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addEvent}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Event
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="recurring" className="space-y-4">
                {/* Template */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="template.title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Series Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Weekly Gaming Stream" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be used as a template. Numbers will be added (#1, #2, etc.)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="template.description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Series description..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="template.platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Platform</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {platformOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="template.contentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(contentTypeOptions[form.watch('template.platform') as keyof typeof contentTypeOptions] || []).map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="template.tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="gaming, tutorial, tips (comma-separated)"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Schedule */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Schedule Settings</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="schedule.startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="date"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schedule.timeOfDay"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="time"
                                className="pl-10"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="schedule.frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="schedule.count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Events</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="52"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Max 52 events (1 year)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              <div className="flex justify-end gap-2 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Events'}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}