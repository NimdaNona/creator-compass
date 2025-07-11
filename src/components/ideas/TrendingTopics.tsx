'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  Eye, 
  MessageSquare,
  Hash,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Clock,
  Flame,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  platform: string;
  trendScore: number;
  growth: number; // percentage
  viewsEstimate: string;
  competition: 'low' | 'medium' | 'high';
  hashtags: string[];
  description: string;
  timeToTrend: string;
  examples: {
    creator: string;
    views: string;
    engagement: string;
  }[];
}

interface TrendingTopicsProps {
  platform: any;
  niche: any;
}

export function TrendingTopics({ platform, niche }: TrendingTopicsProps) {
  const { toast } = useToast();
  const [trends, setTrends] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchTrends();
  }, [platform, niche]);

  const fetchTrends = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/ideas/trending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform?.id,
          niche: niche?.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setTrends(data.trends);
        setLastUpdated(new Date());
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch trending topics',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch trending topics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'format', label: 'Format Trends' },
    { id: 'educational', label: 'Educational' },
    { id: 'lifestyle', label: 'Lifestyle' },
    { id: 'personal', label: 'Personal' },
    { id: 'challenges', label: 'Challenges' }
  ];

  const filteredTrends = selectedCategory === 'all' 
    ? trends 
    : trends.filter(t => t.category.toLowerCase() === selectedCategory);

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default: return '';
    }
  };

  const getTrendIcon = (score: number) => {
    if (score >= 90) return Flame;
    if (score >= 80) return TrendingUp;
    return ArrowUp;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trending in {niche?.name || 'Your Niche'}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchTrends}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap"
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <div className="grid gap-4">
        {filteredTrends.map((trend) => {
          const TrendIcon = getTrendIcon(trend.trendScore);
          
          return (
            <Card key={trend.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn(
                      "p-2 rounded-lg",
                      trend.trendScore >= 90 ? "bg-orange-100 dark:bg-orange-900/20" : "bg-muted"
                    )}>
                      <TrendIcon className={cn(
                        "w-5 h-5",
                        trend.trendScore >= 90 ? "text-orange-600 dark:text-orange-400" : ""
                      )} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{trend.title}</h3>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-medium">{trend.trendScore}/100</span>
                        </div>
                        <div className={cn("flex items-center gap-1", trend.growth > 0 ? "text-green-600" : "text-red-600")}>
                          {trend.growth > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                          <span>{Math.abs(trend.growth)}%</span>
                        </div>
                        <Badge className={cn("text-xs", getCompetitionColor(trend.competition))}>
                          {trend.competition} competition
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground mb-4">{trend.description}</p>

                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span>Est. views: <strong>{trend.viewsEstimate}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>Time to trend: <strong>{trend.timeToTrend}</strong></span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Top Performers:</p>
                    {trend.examples.slice(0, 2).map((example, idx) => (
                      <div key={idx} className="text-sm text-muted-foreground">
                        {example.creator} • {example.views} views • {example.engagement} engagement
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {trend.hashtags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Hash className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t flex items-center justify-between">
                  <Button variant="outline" size="sm">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Ideas
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Examples
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}