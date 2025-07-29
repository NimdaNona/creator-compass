'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Users, 
  Trophy, 
  TrendingUp,
  ArrowRight,
  Heart,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';

export function CommunityHubPreview() {
  // Mock data for preview
  const stats = {
    posts: 142,
    replies: 89,
    likes: 324,
    connections: 12
  };

  const recentPosts = [
    {
      id: '1',
      title: 'How I grew from 0 to 10k subscribers in 90 days',
      author: 'Sarah Chen',
      replies: 23,
      likes: 45,
      isNew: true
    },
    {
      id: '2',
      title: 'Best thumbnail strategies for YouTube Shorts',
      author: 'Mike Johnson',
      replies: 18,
      likes: 32,
      isNew: false
    },
    {
      id: '3',
      title: 'Looking for collab partner - Gaming niche',
      author: 'Alex Rivera',
      replies: 7,
      likes: 12,
      isNew: false
    }
  ];

  const communityLevel = {
    current: 12,
    next: 15,
    progress: 65,
    title: 'Community Contributor'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Community Hub
          </CardTitle>
          <CardDescription>
            Connect and grow with fellow creators
          </CardDescription>
        </div>
        <Button size="sm" asChild>
          <Link href="/community">
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Community Stats */}
        <div className="grid grid-cols-4 gap-3">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="text-2xl font-bold">{stats.posts}</div>
            <div className="text-xs text-muted-foreground">Posts</div>
          </motion.div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="text-2xl font-bold">{stats.replies}</div>
            <div className="text-xs text-muted-foreground">Replies</div>
          </motion.div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="text-2xl font-bold">{stats.likes}</div>
            <div className="text-xs text-muted-foreground">Likes</div>
          </motion.div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <div className="text-2xl font-bold">{stats.connections}</div>
            <div className="text-xs text-muted-foreground">Connections</div>
          </motion.div>
        </div>

        {/* Community Level */}
        <div className="space-y-2 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">{communityLevel.title}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              Level {communityLevel.current}
            </span>
          </div>
          <Progress value={communityLevel.progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {100 - communityLevel.progress}% to Level {communityLevel.next}
          </p>
        </div>

        {/* Recent Posts */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Recent Discussions
          </h4>
          <div className="space-y-2">
            {recentPosts.map(post => (
              <motion.div
                key={post.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {post.isNew && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                      <h5 className="text-sm font-medium line-clamp-1">
                        {post.title}
                      </h5>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      by {post.author}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      <span className="text-xs">{post.replies}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      <span className="text-xs">{post.likes}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-center pt-2">
          <Button size="sm" variant="outline" className="w-full" asChild>
            <Link href="/community">
              <TrendingUp className="h-4 w-4 mr-2" />
              Join the Discussion
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}