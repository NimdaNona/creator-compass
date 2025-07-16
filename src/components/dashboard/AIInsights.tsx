'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  TrendingUp, 
  AlertCircle, 
  Lightbulb, 
  Target,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

interface Insight {
  type: 'tip' | 'warning' | 'success' | 'recommendation';
  title: string;
  content: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  priority: 'high' | 'medium' | 'low';
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  rationale: string;
  action: {
    label: string;
    href?: string;
  };
  impact: 'high' | 'medium' | 'low';
  timeEstimate: string;
}

export function AIInsights() {
  const { selectedPlatform, selectedNiche, progress, subscription } = useAppStore();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchInsights = async () => {
    if (!selectedPlatform || !progress) return;

    setIsLoading(true);
    try {
      // Fetch AI-powered insights
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform.id,
          niche: selectedNiche?.name,
          progress: {
            currentPhase: progress.currentPhase,
            daysActive: Math.floor((Date.now() - new Date(progress.startDate).getTime()) / (1000 * 60 * 60 * 24)),
            completedTasks: progress.completedTasks || 0,
            totalTasks: progress.totalTasks || 90,
            streakDays: progress.streakDays || 0,
          },
          subscription,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch insights');

      const data = await response.json();
      
      // Parse insights
      const parsedInsights: Insight[] = data.insights?.map((insight: any) => ({
        type: insight.type || 'tip',
        title: insight.title,
        content: insight.content,
        action: insight.action,
        priority: insight.priority || 'medium',
      })) || [];

      setInsights(parsedInsights);

      // Fetch recommendations
      const recResponse = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform.id,
          niche: selectedNiche?.name,
          progress: {
            currentPhase: progress.currentPhase,
            completedTasks: progress.completedTasks || 0,
          },
        }),
      });

      if (recResponse.ok) {
        const recData = await recResponse.json();
        setRecommendations(recData.recommendations || []);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      
      // Set fallback insights
      setInsights([
        {
          type: 'tip',
          title: 'Focus on Consistency',
          content: 'Posting regularly is key to growth. Try to maintain your schedule even when you don\'t feel inspired.',
          priority: 'high',
        },
        {
          type: 'recommendation',
          title: 'Optimize Your Upload Time',
          content: 'Based on your niche, try uploading content between 2-4 PM for better initial engagement.',
          priority: 'medium',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInsights();
    setIsRefreshing(false);
    toast.success('Insights refreshed!');
  };

  useEffect(() => {
    fetchInsights();
  }, [selectedPlatform, progress]);

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'tip':
        return <Lightbulb className="h-4 w-4" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'recommendation':
        return <Target className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'tip':
        return 'text-blue-600 bg-blue-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'recommendation':
        return 'text-purple-600 bg-purple-50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Insights Card */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              <CardTitle>AI Insights</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-white hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <CardDescription className="text-purple-100">
            Personalized guidance based on your progress
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-8">
              <Info className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No insights available yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Keep working on your tasks to get personalized insights
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-4 ${getInsightColor(insight.type)} border transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getInsightIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{insight.title}</h4>
                      <p className="text-sm opacity-90">{insight.content}</p>
                      {insight.action && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 -ml-2"
                          onClick={insight.action.onClick}
                          asChild={!!insight.action.href}
                        >
                          {insight.action.href ? (
                            <a href={insight.action.href}>
                              {insight.action.label}
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </a>
                          ) : (
                            <>
                              {insight.action.label}
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {insight.priority === 'high' && (
                      <Badge variant="destructive" className="text-xs">
                        Important
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations Card */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle>AI Recommendations</CardTitle>
            </div>
            <CardDescription>
              Next steps to accelerate your growth
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-4">
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div key={rec.id} className="border rounded-lg p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{rec.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getImpactColor(rec.impact)} variant="secondary">
                        {rec.impact} impact
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {rec.timeEstimate}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                  
                  <div className="bg-muted/50 rounded p-2 mb-3">
                    <p className="text-xs text-muted-foreground">
                      <strong>Why this matters:</strong> {rec.rationale}
                    </p>
                  </div>
                  
                  <Button size="sm" variant="outline" asChild>
                    <a href={rec.action.href || '#'}>
                      {rec.action.label}
                      <ChevronRight className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}