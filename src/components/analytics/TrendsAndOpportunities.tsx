'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Hash,
  Clock,
  Zap,
  Target,
  Lightbulb,
  Calendar,
  ChevronRight,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TrendAnalysis } from '@/types/analytics';

interface Props {
  data: TrendAnalysis | undefined;
}

export function TrendsAndOpportunities({ data }: Props) {
  if (!data) return null;

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return TrendingUp;
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSeasonalityColor = (type: 'peak' | 'low' | 'normal') => {
    switch (type) {
      case 'peak': return 'bg-green-500';
      case 'low': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Trending Topics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Trending Topics
          </CardTitle>
          <CardDescription>Hot topics in your niche right now</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.trendingTopics.map((topic) => {
              const TrendIcon = getTrendIcon(topic.trend);
              const trendColor = getTrendColor(topic.trend);

              return (
                <div key={topic.topic} className="flex items-start justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">#{topic.topic}</h4>
                      <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                      <Badge variant={topic.trend === 'up' ? 'default' : 'secondary'}>
                        {topic.growthRate > 0 ? '+' : ''}{topic.growthRate}%
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(topic.volume / 1000).toFixed(1)}K mentions • {topic.relevanceScore}/10 relevance
                    </p>
                    {topic.suggestedContent && (
                      <div className="flex items-center gap-2 text-sm">
                        <Lightbulb className="h-3 w-3 text-yellow-500" />
                        <span className="text-muted-foreground">Try: {topic.suggestedContent}</span>
                      </div>
                    )}
                  </div>
                  <Button size="sm" variant="outline">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Content Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Content Opportunities
          </CardTitle>
          <CardDescription>Gaps and opportunities in your content strategy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.contentOpportunities.map((opportunity, index) => (
              <div key={index} className="p-4 rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant={opportunity.priority === 'high' ? 'destructive' : opportunity.priority === 'medium' ? 'default' : 'secondary'}>
                    {opportunity.priority} priority
                  </Badge>
                  <Badge variant="outline">
                    Score: {opportunity.potentialImpact}/10
                  </Badge>
                </div>
                <h4 className="font-medium mb-1">{opportunity.type}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {opportunity.description}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span>{opportunity.estimatedReach} potential reach</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Predictions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Predicted Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>30-Day Predictions</CardTitle>
            <CardDescription>Expected performance based on trends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(data.predictedMetrics).map(([metric, prediction]) => {
              const isPositive = prediction.value > prediction.confidence;
              
              return (
                <div key={metric} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">
                      {metric.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{prediction.value.toFixed(1)}%
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {prediction.confidence}% conf
                      </Badge>
                    </div>
                  </div>
                  <Progress value={prediction.confidence} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Seasonality Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Seasonality Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.seasonalPatterns.map((pattern) => (
                <div key={pattern.period} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getSeasonalityColor(pattern.type)}`} />
                    <div>
                      <p className="font-medium text-sm">{pattern.period}</p>
                      <p className="text-xs text-muted-foreground">{pattern.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {pattern.impact > 0 ? '+' : ''}{pattern.impact}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle>Platform-Specific Opportunities</CardTitle>
          <CardDescription>Tailored recommendations for each platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.platformOpportunities).map(([platform, opportunities]) => (
              <div key={platform} className="space-y-3">
                <h4 className="font-medium capitalize flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  {platform}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
                  {opportunities.map((opp, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      <p className="text-sm text-muted-foreground">{opp}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emerging Niches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Emerging Niches
          </CardTitle>
          <CardDescription>New content areas showing rapid growth</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.emergingNiches.map((niche) => (
              <div key={niche.name} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                <div className="flex-1">
                  <h4 className="font-medium">{niche.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {niche.description}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant="default" className="mb-1">
                    +{niche.growthRate}%
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    growth rate
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}