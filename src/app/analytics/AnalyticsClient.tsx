'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Heart,
  RefreshCw,
  Calendar,
  Youtube,
  Instagram,
  Twitter,
  Video
} from 'lucide-react';
import { CrossPlatformAnalytics } from '@/lib/services/analytics-sync-service';
import { formatDistanceToNow } from 'date-fns';

interface AnalyticsClientProps {
  initialAnalytics: CrossPlatformAnalytics;
  userId: string;
}

const platformIcons = {
  youtube: Youtube,
  instagram: Instagram,
  twitter: Twitter,
  tiktok: Video,
};

const platformColors = {
  youtube: 'bg-red-500',
  instagram: 'bg-gradient-to-br from-purple-600 to-pink-500',
  twitter: 'bg-blue-400',
  tiktok: 'bg-black',
};

export default function AnalyticsClient({ initialAnalytics, userId }: AnalyticsClientProps) {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/analytics/sync', {
        method: 'POST',
      });
      
      if (response.ok) {
        const newAnalytics = await response.json();
        setAnalytics(newAnalytics);
      }
    } catch (error) {
      console.error('Failed to sync analytics:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return '↑';
    if (value < 0) return '↓';
    return '→';
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Cross-Platform Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your performance across all connected platforms
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Last synced: {formatDistanceToNow(new Date(analytics.lastSyncedAt), { addSuffix: true })}
          </p>
          <Button onClick={handleSync} disabled={isSyncing} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            Sync Now
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Views
              <Eye className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalViews)}</div>
            <p className={`text-sm flex items-center gap-1 ${getTrendColor(analytics.growthTrends.views.weekly)}`}>
              {getTrendIcon(analytics.growthTrends.views.weekly)} {Math.abs(analytics.growthTrends.views.weekly)} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Followers
              <Users className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalFollowers)}</div>
            <p className={`text-sm flex items-center gap-1 ${getTrendColor(analytics.growthTrends.followers.weekly)}`}>
              {getTrendIcon(analytics.growthTrends.followers.weekly)} {Math.abs(analytics.growthTrends.followers.weekly)} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Engagement
              <Heart className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalEngagement)}</div>
            <p className="text-sm text-muted-foreground">
              Across all platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Total Posts
              <BarChart3 className="h-4 w-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalPosts)}</div>
            <p className="text-sm text-muted-foreground">
              Published content
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform-specific Analytics */}
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {Object.keys(analytics.platforms).map((platform) => {
            const Icon = platformIcons[platform as keyof typeof platformIcons];
            return (
              <TabsTrigger key={platform} value={platform} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Growth Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Trends</CardTitle>
              <CardDescription>Performance across all time periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Follower Growth</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Daily</span>
                        <span className={getTrendColor(analytics.growthTrends.followers.daily)}>
                          {analytics.growthTrends.followers.daily > 0 ? '+' : ''}{analytics.growthTrends.followers.daily}
                        </span>
                      </div>
                      <Progress value={Math.min(Math.abs(analytics.growthTrends.followers.daily) / 100 * 100, 100)} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Weekly</span>
                        <span className={getTrendColor(analytics.growthTrends.followers.weekly)}>
                          {analytics.growthTrends.followers.weekly > 0 ? '+' : ''}{analytics.growthTrends.followers.weekly}
                        </span>
                      </div>
                      <Progress value={Math.min(Math.abs(analytics.growthTrends.followers.weekly) / 1000 * 100, 100)} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Monthly</span>
                        <span className={getTrendColor(analytics.growthTrends.followers.monthly)}>
                          {analytics.growthTrends.followers.monthly > 0 ? '+' : ''}{analytics.growthTrends.followers.monthly}
                        </span>
                      </div>
                      <Progress value={Math.min(Math.abs(analytics.growthTrends.followers.monthly) / 10000 * 100, 100)} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">View Growth</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Daily</span>
                        <span className={getTrendColor(analytics.growthTrends.views.daily)}>
                          {analytics.growthTrends.views.daily > 0 ? '+' : ''}{formatNumber(analytics.growthTrends.views.daily)}
                        </span>
                      </div>
                      <Progress value={Math.min(Math.abs(analytics.growthTrends.views.daily) / 10000 * 100, 100)} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Weekly</span>
                        <span className={getTrendColor(analytics.growthTrends.views.weekly)}>
                          {analytics.growthTrends.views.weekly > 0 ? '+' : ''}{formatNumber(analytics.growthTrends.views.weekly)}
                        </span>
                      </div>
                      <Progress value={Math.min(Math.abs(analytics.growthTrends.views.weekly) / 100000 * 100, 100)} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Monthly</span>
                        <span className={getTrendColor(analytics.growthTrends.views.monthly)}>
                          {analytics.growthTrends.views.monthly > 0 ? '+' : ''}{formatNumber(analytics.growthTrends.views.monthly)}
                        </span>
                      </div>
                      <Progress value={Math.min(Math.abs(analytics.growthTrends.views.monthly) / 1000000 * 100, 100)} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Content */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Content</CardTitle>
              <CardDescription>Your best content across all platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topContent.length > 0 ? (
                  analytics.topContent.map((content, index) => (
                    <div key={`${content.platform}-${content.postId}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${platformColors[content.platform as keyof typeof platformColors]}`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{content.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {content.platform.charAt(0).toUpperCase() + content.platform.slice(1)} · {formatDistanceToNow(new Date(content.publishedAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatNumber(content.views)} views</p>
                        <p className="text-sm text-muted-foreground">{formatNumber(content.engagement)} engagement</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No content data available yet. Connect your platforms to start tracking.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform-specific tabs */}
        {Object.entries(analytics.platforms).map(([platform, data]) => {
          const Icon = platformIcons[platform as keyof typeof platformIcons];
          return (
            <TabsContent key={platform} value={platform}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5" />
                    {platform.charAt(0).toUpperCase() + platform.slice(1)} Analytics
                  </CardTitle>
                  <CardDescription>
                    Performance metrics for your {platform} account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Followers</p>
                      <p className="text-2xl font-bold">{formatNumber(data.followers)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Views</p>
                      <p className="text-2xl font-bold">{formatNumber(data.totalViews)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Engagement</p>
                      <p className="text-2xl font-bold">{formatNumber(data.engagement)}</p>
                    </div>
                  </div>

                  {data.topPosts && data.topPosts.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Top Posts</h4>
                      <div className="space-y-3">
                        {data.topPosts.map((post) => (
                          <div key={post.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-medium">{post.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm">{formatNumber(post.views)} views</p>
                              <p className="text-sm text-muted-foreground">{formatNumber(post.engagement)} engagement</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}