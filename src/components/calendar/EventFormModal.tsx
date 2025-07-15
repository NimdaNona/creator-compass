'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, Hash, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  platform: z.string().min(1, 'Platform is required'),
  contentType: z.string().min(1, 'Content type is required'),
  status: z.enum(['idea', 'draft', 'ready', 'scheduled', 'published']),
  scheduledDate: z.string().min(1, 'Date is required'),
  scheduledTime: z.string().min(1, 'Time is required'),
  duration: z.coerce.number().optional(),
  tags: z.string().optional(),
  color: z.string().optional(),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: any;
  defaultDate?: Date | null;
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
    { value: 'premiere', label: 'Premiere' },
  ],
  tiktok: [
    { value: 'short', label: 'TikTok Video' },
    { value: 'live', label: 'TikTok LIVE' },
    { value: 'series', label: 'Series Episode' },
  ],
  twitch: [
    { value: 'stream', label: 'Stream' },
    { value: 'clip', label: 'Clip' },
    { value: 'highlight', label: 'Highlight' },
  ],
};

const statusOptions = [
  { value: 'idea', label: 'Idea', color: 'bg-purple-100 text-purple-800' },
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  { value: 'ready', label: 'Ready', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
  { value: 'published', label: 'Published', color: 'bg-green-100 text-green-800' },
];

const colorOptions = [
  { value: '#FF0000', label: 'Red', class: 'bg-red-500' },
  { value: '#000000', label: 'Black', class: 'bg-black' },
  { value: '#9146FF', label: 'Purple', class: 'bg-purple-500' },
  { value: '#1DA1F2', label: 'Blue', class: 'bg-blue-500' },
  { value: '#00BF63', label: 'Green', class: 'bg-green-500' },
  { value: '#FF6B6B', label: 'Pink', class: 'bg-pink-500' },
  { value: '#F59E0B', label: 'Amber', class: 'bg-amber-500' },
];

export function EventFormModal({
  isOpen,
  onClose,
  event,
  defaultDate,
  onSuccess,
}: EventFormModalProps) {
  const { selectedPlatform } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      platform: selectedPlatform || 'youtube',
      contentType: 'video',
      status: 'idea',
      scheduledDate: format(new Date(), 'yyyy-MM-dd'),
      scheduledTime: '09:00',
      duration: 30,
      tags: '',
      color: '#FF0000',
    },
  });

  // Update form when event or defaultDate changes
  useEffect(() => {
    if (event) {
      const eventDate = new Date(event.scheduledDate);
      form.reset({
        title: event.title,
        description: event.description || '',
        platform: event.platform,
        contentType: event.contentType,
        status: event.status,
        scheduledDate: format(eventDate, 'yyyy-MM-dd'),
        scheduledTime: format(eventDate, 'HH:mm'),
        duration: event.duration || 30,
        tags: event.tags?.join(', ') || '',
        color: event.color || '#FF0000',
      });
    } else if (defaultDate) {
      form.setValue('scheduledDate', format(defaultDate, 'yyyy-MM-dd'));
    }
  }, [event, defaultDate, form]);

  const onSubmit = async (data: EventFormData) => {
    try {
      setIsLoading(true);

      // Combine date and time
      const scheduledDateTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
      
      // Prepare tags array
      const tags = data.tags
        ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : [];

      const payload = {
        title: data.title,
        description: data.description,
        platform: data.platform,
        contentType: data.contentType,
        status: data.status,
        scheduledDate: scheduledDateTime.toISOString(),
        duration: data.duration,
        tags,
        color: data.color,
      };

      const url = event
        ? `/api/calendar/events/${event.id}`
        : '/api/calendar/events';
      
      const method = event ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save event');
      }

      toast.success(event ? 'Event updated successfully' : 'Event created successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save event');
    } finally {
      setIsLoading(false);
    }
  };

  const watchPlatform = form.watch('platform');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {event ? 'Edit Content' : 'Schedule New Content'}
          </DialogTitle>
          <DialogDescription>
            Plan your content and keep your schedule organized.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter content title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add notes or description"
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
              {/* Platform */}
              <FormField
                control={form.control}
                name="platform"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {platformOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Content Type */}
              <FormField
                control={form.control}
                name="contentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(contentTypeOptions[watchPlatform as keyof typeof contentTypeOptions] || []).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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

              {/* Time */}
              <FormField
                control={form.control}
                name="scheduledTime"
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
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <Badge className={cn('text-xs', option.color)}>
                                {option.label}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags */}
            <FormField
              control={form.control}
              name="tags"
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
                  <FormDescription>
                    Add tags to organize your content
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => field.onChange(color.value)}
                          className={cn(
                            'w-8 h-8 rounded-md border-2',
                            color.class,
                            field.value === color.value
                              ? 'border-foreground'
                              : 'border-transparent'
                          )}
                          aria-label={color.label}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Choose a color for visual organization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : event ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}