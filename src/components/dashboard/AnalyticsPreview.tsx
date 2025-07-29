'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Heart, 
  MessageSquare,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Line } from 'recharts';

interface AnalyticsData {
  views: number;
  viewsChange: number;
  engagement: number;
  engagementChange: number;
  followers: number;
  followersChange: number;
  topContent: {
    title: string;
    views: number;
    engagement: number;
  }[];
}

export default function AnalyticsPreview() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const { selectedPlatform, userSubscription } = useAppStore();
  const isPremium = userSubscription?.tier !== 'free';

  useEffect(() => {
    // Mock data - in production, this would come from platform APIs
    setAnalytics({
      views: 12543,
      viewsChange: 15.3,
      engagement: 8.7,
      engagementChange: 2.1,
      followers: 847,
      followersChange: 23,
      topContent: [
        { title: 'My Best Video Yet!', views: 3421, engagement: 12.3 },
        { title: 'Quick Tips for Beginners', views: 2156, engagement: 9.8 },
        { title: 'Behind the Scenes', views: 1876, engagement: 15.2 }
      ]
    });
  }, []);

  if (!analytics) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full min-h-[300px]">
          <BarChart3 className="h-8 w-8 animate-pulse text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const metrics = [
    {
      label: 'Total Views',
      value: analytics.views.toLocaleString(),
      change: analytics.viewsChange,
      icon: Eye
    },
    {
      label: 'Engagement Rate',
      value: `${analytics.engagement}%`,
      change: analytics.engagementChange,
      icon: Heart
    },
    {
      label: 'New Followers',
      value: `+${analytics.followers}`,
      change: analytics.followersChange,
      icon: Users
    }
  ];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Analytics Overview
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <a href="/analytics">
            View Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </CardHeader>
      
      <CardContent>
        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            const isPositive = metric.change > 0;
            
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center p-2 rounded-full bg-muted mb-2">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={cn(
                    "text-xs font-medium",
                    isPositive ? "text-green-600" : "text-red-600"
                  )}>
                    {Math.abs(metric.change)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top Content */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium mb-2">Top Performing Content</h4>
          {analytics.topContent.map((content, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{content.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {content.views.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {content.engagement}%
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                #{index + 1}
              </Badge>
            </div>
          ))}
        </div>

        {!isPremium && (
          <div className="mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-700 dark:text-purple-300 mb-2">
              Unlock detailed analytics with Pro
            </p>
            <Button size="sm" variant="outline" className="w-full" asChild>
              <a href="/pricing">
                Upgrade Now
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}