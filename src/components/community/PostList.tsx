'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  MoreHorizontal,
  Pin,
  Lock,
  Star,
  Clock,
  Eye
} from 'lucide-react';
import { CommunityPost, PostCategory } from '@/types/community';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PostListProps {
  posts: CommunityPost[];
  loading: boolean;
  onRefresh?: () => void;
}

export function PostList({ posts, loading, onRefresh }: PostListProps) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Set<string>>(new Set());

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST'
      });

      if (response.ok) {
        const { liked } = await response.json();
        if (liked) {
          setLikedPosts(prev => new Set(prev).add(postId));
        } else {
          setLikedPosts(prev => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
        }
        onRefresh?.();
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleBookmark = (postId: string) => {
    if (bookmarkedPosts.has(postId)) {
      setBookmarkedPosts(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    } else {
      setBookmarkedPosts(prev => new Set(prev).add(postId));
    }
  };

  const getCategoryColor = (category: PostCategory) => {
    const colors: Record<PostCategory, string> = {
      [PostCategory.GENERAL]: 'bg-blue-500/10 text-blue-500',
      [PostCategory.HELP]: 'bg-purple-500/10 text-purple-500',
      [PostCategory.SHOWCASE]: 'bg-yellow-500/10 text-yellow-500',
      [PostCategory.FEEDBACK]: 'bg-green-500/10 text-green-500',
      [PostCategory.COLLABORATION]: 'bg-pink-500/10 text-pink-500',
      [PostCategory.RESOURCES]: 'bg-indigo-500/10 text-indigo-500',
      [PostCategory.TUTORIALS]: 'bg-orange-500/10 text-orange-500',
      [PostCategory.ANNOUNCEMENTS]: 'bg-red-500/10 text-red-500'
    };
    return colors[category] || 'bg-gray-500/10 text-gray-500';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card className="p-12 text-center bg-gradient-to-br from-muted/50 to-muted/30 border-dashed animate-fadeIn">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center animate-pulse">
            <MessageCircle className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Be the first to start a discussion and connect with fellow creators!
            </p>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            Create First Post
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {posts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className={cn(
              "hover:shadow-lg transition-shadow",
              post.isPinned && "border-primary",
              post.isFeatured && "border-yellow-500"
            )}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={post.author.image} />
                      <AvatarFallback>
                        {post.author.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/profile/${post.author.id}`}
                          className="font-semibold hover:underline"
                        >
                          {post.author.name}
                        </Link>
                        <Badge variant="secondary" className="text-xs">
                          Level {post.author.level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        {post.views > 0 && (
                          <>
                            <span>•</span>
                            <Eye className="h-3 w-3" />
                            {post.views} views
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.isPinned && (
                      <Pin className="h-4 w-4 text-primary" />
                    )}
                    {post.isLocked && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    {post.isFeatured && (
                      <Star className="h-4 w-4 text-yellow-500" />
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <Link href={`/community/posts/${post.id}`}>
                  <h3 className="text-xl font-semibold mb-2 hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                </Link>
                <p className="text-muted-foreground line-clamp-3 mb-4">
                  {post.content}
                </p>
                
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getCategoryColor(post.category)}>
                    {post.category}
                  </Badge>
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="border-t pt-4">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "gap-2",
                        likedPosts.has(post.id) && "text-red-500"
                      )}
                      onClick={() => handleLike(post.id)}
                    >
                      <Heart className={cn(
                        "h-4 w-4",
                        likedPosts.has(post.id) && "fill-current"
                      )} />
                      {post.likes}
                    </Button>
                    <Link href={`/community/posts/${post.id}`}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <MessageCircle className="h-4 w-4" />
                        {post.replies}
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBookmark(post.id)}
                  >
                    <Bookmark className={cn(
                      "h-4 w-4",
                      bookmarkedPosts.has(post.id) && "fill-current"
                    )} />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Load More */}
      {posts.length >= 20 && (
        <div className="text-center">
          <Button variant="outline" onClick={onRefresh}>
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}