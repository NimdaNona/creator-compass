'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { CalendarIcon, Clock, Hash, Image, Video, X } from 'lucide-react';
import { format } from 'date-fns';
import { PlatformConnection } from '@prisma/client';

interface SchedulePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connections: PlatformConnection[];
  defaultConnection?: PlatformConnection;
}

const contentTypes = {
  youtube: [
    { value: 'video', label: 'Video' },
    { value: 'short', label: 'Short' },
    { value: 'community', label: 'Community Post' },
  ],
  tiktok: [
    { value: 'video', label: 'Video' },
    { value: 'photo', label: 'Photo' },
  ],
  instagram: [
    { value: 'post', label: 'Post' },
    { value: 'reel', label: 'Reel' },
    { value: 'story', label: 'Story' },
  ],
  twitter: [
    { value: 'tweet', label: 'Tweet' },
    { value: 'thread', label: 'Thread' },
  ],
};

export function SchedulePostDialog({
  open,
  onOpenChange,
  connections,
  defaultConnection,
}: SchedulePostDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(defaultConnection?.id || '');
  const [contentType, setContentType] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [crossPost, setCrossPost] = useState(false);
  const [crossPostPlatforms, setCrossPostPlatforms] = useState<string[]>([]);

  // Get the selected connection
  const connection = connections.find((c) => c.id === selectedConnection);
  const platform = connection?.platform || '';

  // Update content type when platform changes
  useEffect(() => {
    if (platform && contentTypes[platform as keyof typeof contentTypes]) {
      setContentType(contentTypes[platform as keyof typeof contentTypes][0].value);
    }
  }, [platform]);

  const handleAddHashtag = () => {
    if (hashtagInput && !hashtags.includes(hashtagInput)) {
      setHashtags([...hashtags, hashtagInput.replace('#', '')]);
      setHashtagInput('');
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const handleSchedulePost = async () => {
    if (!selectedConnection || !content || !scheduledDate) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Combine date and time
      const [hours, minutes] = scheduledTime.split(':');
      const scheduledFor = new Date(scheduledDate);
      scheduledFor.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const response = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformConnectionId: selectedConnection,
          title: title || undefined,
          content,
          hashtags,
          scheduledFor: scheduledFor.toISOString(),
          contentType,
          crossPost,
          crossPostPlatforms: crossPost ? crossPostPlatforms : [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to schedule post');
      }

      toast({
        title: 'Post Scheduled',
        description: `Your ${contentType} will be published on ${format(scheduledFor, 'PPP')} at ${scheduledTime}`,
      });

      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to schedule post',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Content</DialogTitle>
          <DialogDescription>
            Schedule your content to be automatically published at the perfect time
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label>Platform</Label>
            <Select value={selectedConnection} onValueChange={setSelectedConnection}>
              <SelectTrigger>
                <SelectValue placeholder="Select a platform" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((conn) => (
                  <SelectItem key={conn.id} value={conn.id}>
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{conn.platform}</span>
                      <span className="text-muted-foreground">• {conn.accountName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Type */}
          {platform && (
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes[platform as keyof typeof contentTypes]?.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title (optional for some platforms) */}
          {['youtube', 'instagram'].includes(platform) && (
            <div className="space-y-2">
              <Label>Title (Optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your content"
              />
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your content here..."
              rows={6}
            />
            <p className="text-sm text-muted-foreground">
              {content.length} characters
            </p>
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label>Hashtags</Label>
            <div className="flex gap-2">
              <Input
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHashtag())}
                placeholder="Add hashtags"
              />
              <Button type="button" onClick={handleAddHashtag} size="sm">
                <Hash className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {hashtags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  #{tag}
                  <button
                    onClick={() => handleRemoveHashtag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Schedule Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Calendar
                mode="single"
                selected={scheduledDate}
                onSelect={setScheduledDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Cross-posting */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="cross-post">Cross-post to other platforms</Label>
              <Switch
                id="cross-post"
                checked={crossPost}
                onCheckedChange={setCrossPost}
              />
            </div>
            {crossPost && (
              <div className="space-y-2">
                <Label>Select platforms</Label>
                <div className="grid grid-cols-2 gap-2">
                  {connections
                    .filter((c) => c.id !== selectedConnection)
                    .map((conn) => (
                      <label
                        key={conn.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={crossPostPlatforms.includes(conn.platform)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCrossPostPlatforms([...crossPostPlatforms, conn.platform]);
                            } else {
                              setCrossPostPlatforms(
                                crossPostPlatforms.filter((p) => p !== conn.platform)
                              );
                            }
                          }}
                        />
                        <span className="capitalize">{conn.platform}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSchedulePost} disabled={loading}>
            {loading ? 'Scheduling...' : 'Schedule Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}