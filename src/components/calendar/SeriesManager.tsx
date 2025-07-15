'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Switch } from '@/components/ui/switch';
import { 
  Repeat, 
  Calendar, 
  Clock, 
  Plus, 
  Edit2, 
  Trash2,
  Youtube,
  Music2,
  Twitch
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';

const seriesSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  platform: z.string().min(1, 'Platform is required'),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  defaultDay: z.coerce.number().min(0).max(6).optional(),
  defaultTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  isActive: z.boolean().optional()
});

type SeriesFormData = z.infer<typeof seriesSchema>;

interface ContentSeries {
  id: string;
  name: string;
  description?: string;
  platform: string;
  frequency: string;
  defaultDay?: number;
  defaultTime?: string;
  isActive: boolean;
  _count?: {
    events: number;
  };
}

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const dayOptions = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function SeriesManager() {
  const { data: session } = useSession();
  const { selectedPlatform, subscription } = useAppStore();
  const [series, setSeries] = useState<ContentSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<ContentSeries | null>(null);

  const form = useForm<SeriesFormData>({
    resolver: zodResolver(seriesSchema),
    defaultValues: {
      name: '',
      description: '',
      platform: selectedPlatform || 'youtube',
      frequency: 'weekly',
      defaultDay: 1,
      defaultTime: '09:00',
      isActive: true,
    },
  });

  // Fetch series
  useEffect(() => {
    if (!session?.user) return;
    
    const fetchSeries = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/calendar/series');
        
        if (!response.ok) {
          if (response.status === 403) {
            const data = await response.json();
            if (data.upgradeRequired) {
              toast.error('Content series is a premium feature');
              return;
            }
          }
          throw new Error('Failed to fetch series');
        }
        
        const data = await response.json();
        setSeries(data.series);
      } catch (error) {
        console.error('Error fetching series:', error);
        toast.error('Failed to load content series');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeries();
  }, [session]);

  const onSubmit = async (data: SeriesFormData) => {
    try {
      const url = editingSeries
        ? `/api/calendar/series/${editingSeries.id}`
        : '/api/calendar/series';
      
      const method = editingSeries ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.upgradeRequired) {
          toast.error('Content series is a premium feature. Please upgrade to use this feature.');
          return;
        }
        throw new Error(error.error || 'Failed to save series');
      }

      toast.success(editingSeries ? 'Series updated successfully' : 'Series created successfully');
      
      // Refresh series list
      const refreshResponse = await fetch('/api/calendar/series');
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setSeries(refreshData.series);
      }

      setIsDialogOpen(false);
      setEditingSeries(null);
      form.reset();
    } catch (error) {
      console.error('Error saving series:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save series');
    }
  };

  const handleEdit = (series: ContentSeries) => {
    setEditingSeries(series);
    form.reset({
      name: series.name,
      description: series.description || '',
      platform: series.platform,
      frequency: series.frequency as any,
      defaultDay: series.defaultDay,
      defaultTime: series.defaultTime,
      isActive: series.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (seriesId: string) => {
    if (!confirm('Are you sure you want to delete this series?')) return;

    try {
      const response = await fetch(`/api/calendar/series/${seriesId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete series');
      }

      toast.success('Series deleted successfully');
      setSeries(series.filter(s => s.id !== seriesId));
    } catch (error) {
      console.error('Error deleting series:', error);
      toast.error('Failed to delete series');
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      case 'tiktok':
        return <Music2 className="w-4 h-4" />;
      case 'twitch':
        return <Twitch className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const hasAccess = subscription !== 'free';

  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Repeat className="w-5 h-5" />
            Content Series
          </CardTitle>
          <CardDescription>
            Create recurring content schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              Content series is a premium feature
            </p>
            <Button onClick={() => window.location.href = '/pricing'}>
              Upgrade to Premium
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              Content Series
            </CardTitle>
            <CardDescription>
              Manage your recurring content schedules
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => {
                setEditingSeries(null);
                form.reset();
              }}>
                <Plus className="w-4 h-4 mr-2" />
                New Series
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingSeries ? 'Edit Series' : 'Create Content Series'}
                </DialogTitle>
                <DialogDescription>
                  Set up a recurring content schedule
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Series Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Weekly Gaming Stream" {...field} />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your series..."
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
                              <SelectItem value="youtube">YouTube</SelectItem>
                              <SelectItem value="tiktok">TikTok</SelectItem>
                              <SelectItem value="twitch">Twitch</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Frequency */}
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {frequencyOptions.map((option) => (
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

                  {form.watch('frequency') !== 'daily' && (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Default Day */}
                      <FormField
                        control={form.control}
                        name="defaultDay"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Day</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(parseInt(value))} 
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select day" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {dayOptions.map((option) => (
                                  <SelectItem key={option.value} value={option.value.toString()}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Default Time */}
                      <FormField
                        control={form.control}
                        name="defaultTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Active Status */}
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Enable automatic event creation for this series
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        setEditingSeries(null);
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingSeries ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground">
            Loading series...
          </div>
        ) : series.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No content series yet. Create your first series!
          </div>
        ) : (
          <div className="space-y-3">
            {series.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getPlatformIcon(s.platform)}
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Badge variant={s.isActive ? 'default' : 'secondary'}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span>{s.frequency}</span>
                      {s._count && (
                        <span>• {s._count.events} events</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(s)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(s.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}