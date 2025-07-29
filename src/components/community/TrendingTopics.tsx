'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Hash, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface TrendingTopic {
  tag: string;
  count: number;
  growth: number;
  category: 'hot' | 'rising' | 'steady';
}

interface TrendingTopicsProps {
  platform?: string;
  niche?: string;
}

export function TrendingTopics({ platform, niche }: TrendingTopicsProps) {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrendingTopics();
  }, [platform, niche]);

  const loadTrendingTopics = async () => {
    try {
      setLoading(true);
      
      // Simulated trending topics - replace with actual API call
      const mockTopics: TrendingTopic[] = [
        { tag: 'content-strategy', count: 156, growth: 24, category: 'hot' },
        { tag: 'algorithm-tips', count: 98, growth: 15, category: 'rising' },
        { tag: 'monetization', count: 87, growth: 8, category: 'steady' },
        { tag: 'shorts-optimization', count: 76, growth: 32, category: 'hot' },
        { tag: 'community-building', count: 65, growth: 12, category: 'rising' },
        { tag: 'thumbnail-design', count: 54, growth: 5, category: 'steady' },
        { tag: 'analytics-guide', count: 43, growth: 18, category: 'rising' },
        { tag: 'collab-opportunities', count: 38, growth: 45, category: 'hot' },
      ];

      // Filter based on platform/niche if provided
      if (platform || niche) {
        // Add platform/niche specific topics
        if (platform === 'youtube') {
          mockTopics.unshift({ tag: 'youtube-shorts', count: 120, growth: 28, category: 'hot' });
        } else if (platform === 'tiktok') {
          mockTopics.unshift({ tag: 'tiktok-trends', count: 145, growth: 35, category: 'hot' });
        } else if (platform === 'twitch') {
          mockTopics.unshift({ tag: 'stream-setup', count: 89, growth: 20, category: 'rising' });
        }
      }

      setTopics(mockTopics.slice(0, 8));
    } catch (error) {
      console.error('Failed to load trending topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: TrendingTopic['category']) => {
    switch (category) {
      case 'hot':
        return <Sparkles className="h-3 w-3 text-red-500" />;
      case 'rising':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      default:
        return <Hash className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getCategoryColor = (category: TrendingTopic['category']) => {
    switch (category) {
      case 'hot':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'rising':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      default:
        return 'bg-muted hover:bg-muted/80';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Topics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-6 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center animate-fadeIn">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-sm font-medium mb-1">No trending topics yet</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Topics will appear here as the community grows and engages with content
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <Link
                key={topic.tag}
                href={`/community?tag=${encodeURIComponent(topic.tag)}`}
              >
                <Badge
                  variant="outline"
                  className={`cursor-pointer transition-colors ${getCategoryColor(topic.category)}`}
                >
                  <span className="flex items-center gap-1">
                    {getCategoryIcon(topic.category)}
                    #{topic.tag}
                    <span className="text-xs opacity-70">({topic.count})</span>
                  </span>
                </Badge>
              </Link>
            ))}
          </div>
        )}

        {!loading && topics.length > 0 && (
          <p className="text-xs text-muted-foreground mt-4">
            Updated every hour based on community activity
          </p>
        )}
      </CardContent>
    </Card>
  );
}