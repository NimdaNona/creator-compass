'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  MessageSquare, 
  Heart, 
  TrendingUp,
  Trophy,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { formatDistanceToNow } from 'date-fns';

interface CommunityPost {
  id: string;
  author: {
    name: string;
    avatar?: string;
    platform: string;
    followerCount: number;
  };
  content: string;
  type: 'achievement' | 'tip' | 'question' | 'milestone';
  likes: number;
  comments: number;
  timestamp: Date;
}

export default function CommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const { selectedPlatform, selectedNiche } = useAppStore();

  useEffect(() => {
    // Mock data - in production, this would come from a community API
    const mockPosts: CommunityPost[] = [
      {
        id: '1',
        author: {
          name: 'Sarah Chen',
          platform: 'youtube',
          followerCount: 5420
        },
        content: 'Just hit 5K subscribers! The journey guide really helped me stay consistent. 🎉',
        type: 'milestone',
        likes: 43,
        comments: 12,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: '2',
        author: {
          name: 'Mike Rodriguez',
          platform: 'tiktok',
          followerCount: 12300
        },
        content: 'Pro tip: Posting at 6PM local time increased my engagement by 40%!',
        type: 'tip',
        likes: 28,
        comments: 7,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
      },
      {
        id: '3',
        author: {
          name: 'Emma Johnson',
          platform: 'twitch',
          followerCount: 890
        },
        content: 'Anyone else struggling with stream consistency? How do you stay motivated?',
        type: 'question',
        likes: 15,
        comments: 23,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
      }
    ];

    setPosts(mockPosts);
  }, []);

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'achievement':
        return <Trophy className="h-4 w-4 text-yellow-600" />;
      case 'milestone':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'tip':
        return <Sparkles className="h-4 w-4 text-purple-600" />;
      default:
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
    }
  };

  const getPostBadgeColor = (type: string) => {
    switch (type) {
      case 'achievement':
      case 'milestone':
        return 'bg-green-100 text-green-800';
      case 'tip':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Community
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <a href="/community">
            Join Discussion
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post.id}
              className="p-4 rounded-lg border hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.author.avatar} />
                  <AvatarFallback>
                    {post.author.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm">{post.author.name}</p>
                    <Badge variant="secondary" className="text-xs">
                      {post.author.followerCount.toLocaleString()} followers
                    </Badge>
                    <Badge className={cn("text-xs", getPostBadgeColor(post.type))}>
                      {getPostIcon(post.type)}
                      <span className="ml-1 capitalize">{post.type}</span>
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {post.content}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Heart className="h-3 w-3" />
                      {post.likes}
                    </button>
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <MessageSquare className="h-3 w-3" />
                      {post.comments}
                    </button>
                    <span>
                      {formatDistanceToNow(post.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No community posts yet
            </p>
            <Button size="sm" asChild>
              <a href="/community">
                Be the First to Share
              </a>
            </Button>
          </div>
        )}
        
        <div className="pt-4 border-t">
          <Button variant="outline" className="w-full" asChild>
            <a href="/community">
              View All Community Posts
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}