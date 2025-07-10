'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Hash, Users, Play } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

interface TrendingItem {
  id: string;
  type: 'hashtag' | 'topic' | 'format' | 'challenge';
  title: string;
  description?: string;
  growth?: number;
  platform?: string;
}

export default function TrendingSection() {
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedPlatform, selectedNiche } = useStore();

  useEffect(() => {
    fetchTrending();
  }, [selectedPlatform, selectedNiche]);

  const fetchTrending = async () => {
    try {
      // For now, use static data based on platform
      // In a real app, this would fetch from an API
      const platformTrends = getTrendingByPlatform(selectedPlatform?.id, selectedNiche?.id);
      setTrending(platformTrends);
    } catch (error) {
      console.error('Error fetching trending:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendingByPlatform = (platform?: string, niche?: string): TrendingItem[] => {
    const baseTrends: Record<string, TrendingItem[]> = {
      youtube: [
        {
          id: 'yt1',
          type: 'format',
          title: 'YouTube Shorts',
          description: 'Short-form vertical videos',
          growth: 45,
          platform: 'youtube'
        },
        {
          id: 'yt2',
          type: 'topic',
          title: 'AI Tools Reviews',
          description: 'Reviews of latest AI tools',
          growth: 32,
          platform: 'youtube'
        },
        {
          id: 'yt3',
          type: 'hashtag',
          title: '#YouTubeShorts',
          growth: 28,
          platform: 'youtube'
        }
      ],
      tiktok: [
        {
          id: 'tt1',
          type: 'challenge',
          title: 'Transition Challenge',
          description: 'Creative transitions between scenes',
          growth: 67,
          platform: 'tiktok'
        },
        {
          id: 'tt2',
          type: 'hashtag',
          title: '#FYP',
          growth: 55,
          platform: 'tiktok'
        },
        {
          id: 'tt3',
          type: 'format',
          title: 'Storytime POVs',
          description: 'First-person story videos',
          growth: 41,
          platform: 'tiktok'
        }
      ],
      twitch: [
        {
          id: 'tw1',
          type: 'topic',
          title: 'Just Chatting',
          description: 'Interactive streams with audience',
          growth: 23,
          platform: 'twitch'
        },
        {
          id: 'tw2',
          type: 'format',
          title: 'Subathons',
          description: 'Marathon streams for subscribers',
          growth: 38,
          platform: 'twitch'
        },
        {
          id: 'tw3',
          type: 'challenge',
          title: 'Speed Runs',
          description: 'Competitive game completions',
          growth: 29,
          platform: 'twitch'
        }
      ]
    };

    return baseTrends[platform || 'youtube'] || baseTrends.youtube;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'hashtag':
        return <Hash className="h-3 w-3" />;
      case 'topic':
        return <TrendingUp className="h-3 w-3" />;
      case 'format':
        return <Play className="h-3 w-3" />;
      case 'challenge':
        return <Users className="h-3 w-3" />;
      default:
        return <TrendingUp className="h-3 w-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hashtag':
        return 'bg-blue-500/10 text-blue-600';
      case 'topic':
        return 'bg-green-500/10 text-green-600';
      case 'format':
        return 'bg-purple-500/10 text-purple-600';
      case 'challenge':
        return 'bg-orange-500/10 text-orange-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trending.map((item) => (
        <div
          key={item.id}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <div className={cn(
            "p-1.5 rounded shrink-0",
            getTypeColor(item.type)
          )}>
            {getIcon(item.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <h5 className="font-medium text-sm line-clamp-1">
              {item.title}
            </h5>
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {item.description}
              </p>
            )}
          </div>

          {item.growth && (
            <Badge variant="secondary" className="shrink-0">
              <TrendingUp className="h-3 w-3 mr-1" />
              {item.growth}%
            </Badge>
          )}
        </div>
      ))}

      <div className="pt-2 text-center">
        <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          View all trending →
        </button>
      </div>
    </div>
  );
}