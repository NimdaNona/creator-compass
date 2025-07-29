'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Clock,
  MoreVertical,
  Edit,
  Trash,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { ScheduledPost, PlatformConnection } from '@prisma/client';

interface ScheduledPostWithConnection extends ScheduledPost {
  platformConnection: Pick<PlatformConnection, 'id' | 'platform' | 'accountName' | 'accountImage'>;
}

interface ScheduledPostsListProps {
  posts: ScheduledPostWithConnection[];
}

const statusConfig = {
  scheduled: {
    label: 'Scheduled',
    icon: Clock,
    className: 'bg-blue-500/10 text-blue-500',
  },
  publishing: {
    label: 'Publishing',
    icon: RefreshCw,
    className: 'bg-yellow-500/10 text-yellow-500',
  },
  published: {
    label: 'Published',
    icon: CheckCircle,
    className: 'bg-green-500/10 text-green-500',
  },
  failed: {
    label: 'Failed',
    icon: AlertCircle,
    className: 'bg-red-500/10 text-red-500',
  },
  cancelled: {
    label: 'Cancelled',
    icon: X,
    className: 'bg-gray-500/10 text-gray-500',
  },
};

const platformColors = {
  youtube: 'bg-red-500',
  tiktok: 'bg-black',
  instagram: 'bg-gradient-to-br from-purple-500 to-pink-500',
  twitter: 'bg-blue-400',
};

export function ScheduledPostsList({ posts }: ScheduledPostsListProps) {
  const router = useRouter();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());

  const handleCancelPost = async (postId: string) => {
    setCancellingIds((prev) => new Set(prev).add(postId));
    try {
      const response = await fetch(`/api/scheduled-posts/${postId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel post');
      }

      toast({
        title: 'Post Cancelled',
        description: 'The scheduled post has been cancelled',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel the post',
        variant: 'destructive',
      });
    } finally {
      setCancellingIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled post?')) {
      return;
    }

    setDeletingIds((prev) => new Set(prev).add(postId));
    try {
      const response = await fetch(`/api/scheduled-posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      toast({
        title: 'Post Deleted',
        description: 'The scheduled post has been deleted',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete the post',
        variant: 'destructive',
      });
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Scheduled Posts</h3>
          <p className="text-muted-foreground mb-4">
            You haven't scheduled any content yet. Create your first scheduled post to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const status = statusConfig[post.status as keyof typeof statusConfig];
        const StatusIcon = status.icon;
        const isProcessing = deletingIds.has(post.id) || cancellingIds.has(post.id);

        return (
          <Card key={post.id} className={isProcessing ? 'opacity-50' : ''}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full ${
                      platformColors[post.platformConnection.platform as keyof typeof platformColors]
                    } flex items-center justify-center text-white text-xs font-semibold`}
                  >
                    {post.platformConnection.platform.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {post.title || `${post.contentType} on ${post.platformConnection.platform}`}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      @{post.platformConnection.accountName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={status.className} variant="secondary">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                  {post.status === 'scheduled' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isProcessing}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem disabled>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCancelPost(post.id)}
                          className="text-yellow-600"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-600"
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm line-clamp-3">{post.content}</p>
              
              {post.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {post.hashtags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(post.scheduledFor), 'PPP')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(post.scheduledFor), 'p')}
                </div>
              </div>

              {post.crossPost && post.crossPostPlatforms.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Cross-posting to:</span>
                  {post.crossPostPlatforms.map((platform) => (
                    <Badge key={platform} variant="outline" className="text-xs capitalize">
                      {platform}
                    </Badge>
                  ))}
                </div>
              )}

              {post.status === 'failed' && post.error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    {post.error}
                  </p>
                  {post.retryCount > 0 && (
                    <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                      Retry attempts: {post.retryCount}/{post.maxRetries}
                    </p>
                  )}
                </div>
              )}

              {post.status === 'published' && post.publishedAt && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4 inline mr-1" />
                  Published {format(new Date(post.publishedAt), 'PPP')} at{' '}
                  {format(new Date(post.publishedAt), 'p')}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}