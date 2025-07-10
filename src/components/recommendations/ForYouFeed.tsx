'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import ContentCard from './ContentCard';
import TrendingSection from './TrendingSection';
import QuickTipsCarousel from './QuickTipsCarousel';
import { RefreshCw, Sparkles, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Recommendation {
  id: string;
  type: 'task' | 'template' | 'tip' | 'resource' | 'milestone';
  content: any;
  score: number;
  reason: string;
  locked?: boolean;
}

export default function ForYouFeed() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch(`/api/recommendations/foryou?refresh=${refresh}`);
      if (!response.ok) throw new Error('Failed to fetch recommendations');

      const data = await response.json();
      setRecommendations(data.recommendations);

      if (refresh) {
        toast.success('Recommendations refreshed!');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleContentAction = async (
    contentId: string, 
    contentType: string, 
    action: string
  ) => {
    try {
      await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, contentType, action })
      });

      // Remove dismissed items from view
      if (action === 'dismissed') {
        setRecommendations(prev => 
          prev.filter(r => r.content?.id !== contentId)
        );
      }
    } catch (error) {
      console.error('Error tracking action:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            For You
          </h2>
          <p className="text-muted-foreground">
            Personalized recommendations based on your journey
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchRecommendations(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          {recommendations.length === 0 ? (
            <Card className="p-12 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
              <p className="text-muted-foreground mb-4">
                Complete some tasks to get personalized recommendations
              </p>
              <Button onClick={() => fetchRecommendations(true)}>
                Generate Recommendations
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <ContentCard
                  key={`${rec.type}-${rec.content?.id}`}
                  recommendation={rec}
                  onAction={handleContentAction}
                />
              ))}
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchRecommendations(true)}
                className="w-full sm:w-auto"
              >
                Load More Recommendations
              </Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Tips */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              💡 Quick Tips
            </h3>
            <QuickTipsCarousel />
          </Card>

          {/* Trending Section */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending in Your Niche
            </h3>
            <TrendingSection />
          </Card>

          {/* Motivational Quote */}
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10">
            <blockquote className="space-y-2">
              <p className="text-sm italic">
                "The secret of getting ahead is getting started."
              </p>
              <footer className="text-xs text-muted-foreground">
                — Mark Twain
              </footer>
            </blockquote>
          </Card>
        </div>
      </div>
    </div>
  );
}