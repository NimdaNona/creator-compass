'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity,
  Users,
  Eye,
  MessageSquare,
  Heart,
  Share2,
  Clock,
  TrendingUp,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  PlayCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useToast } from '@/components/ui/use-toast';

interface RealTimeMetrics {
  activeUsers: number;
  viewsPerMinute: number;
  engagementsPerMinute: number;
  currentlyWatching: {
    platform: string;
    contentId: string;
    contentTitle: string;
    viewers: number;
  }[];
  recentEngagements: {
    id: string;
    type: 'like' | 'comment' | 'share' | 'follow';
    platform: string;
    contentTitle: string;
    username: string;
    timestamp: Date;
  }[];
  performanceMetrics: {
    time: string;
    views: number;
    engagements: number;
  }[];
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  topLocations: {
    location: string;
    users: number;
    percentage: number;
  }[];
}

export function RealTimeAnalytics() {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRealTimeData = async () => {
    try {
      const response = await fetch('/api/analytics/real-time');
      if (!response.ok) throw new Error('Failed to fetch real-time data');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load real-time analytics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Activity className="h-8 w-8 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Loading real-time data...</p>
        </div>
      </div>
    );
  }

  const getEngagementIcon = (type: string) => {
    switch (type) {
      case 'like': return Heart;
      case 'comment': return MessageSquare;
      case 'share': return Share2;
      case 'follow': return Users;
      default: return Activity;
    }
  };

  const getDeviceIcon = (device: string) => {
    switch (device) {
      case 'mobile': return Smartphone;
      case 'desktop': return Monitor;
      default: return Monitor;
    }
  };

  return (
    <div className="space-y-6">
      {/* Real-Time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeUsers}</div>
            <div className="text-xs text-muted-foreground">users online</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Views/Min</CardTitle>
            <Eye className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.viewsPerMinute}</div>
            <div className="text-xs text-muted-foreground">current rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagements/Min</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.engagementsPerMinute}</div>
            <div className="text-xs text-muted-foreground">interactions</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Watching</CardTitle>
            <PlayCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.currentlyWatching.length}</div>
            <div className="text-xs text-muted-foreground">active content</div>
          </CardContent>
        </Card>
      </div>

      {/* Live Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Live Performance
          </CardTitle>
          <CardDescription>Real-time views and engagement metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.performanceMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="views" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={false}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="engagements" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Currently Watching */}
        <Card>
          <CardHeader>
            <CardTitle>Currently Watching</CardTitle>
            <CardDescription>Content being viewed right now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence>
                {metrics.currentlyWatching.map((content) => (
                  <motion.div
                    key={content.contentId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm line-clamp-1">{content.contentTitle}</p>
                      <p className="text-xs text-muted-foreground">{content.platform}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span className="text-sm font-medium">{content.viewers}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Recent Engagements */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Engagements</CardTitle>
            <CardDescription>Latest interactions from your audience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence>
                {metrics.recentEngagements.slice(0, 5).map((engagement) => {
                  const Icon = getEngagementIcon(engagement.type);
                  
                  return (
                    <motion.div
                      key={engagement.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{engagement.username}</span>
                          <span className="text-muted-foreground"> {engagement.type}d </span>
                          <span className="font-medium line-clamp-1">{engagement.contentTitle}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {engagement.platform} • just now
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device & Location Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Device Breakdown</CardTitle>
            <CardDescription>How users are accessing your content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.deviceBreakdown).map(([device, percentage]) => {
                const Icon = getDeviceIcon(device);
                
                return (
                  <div key={device} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium capitalize">{device}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Top Locations
            </CardTitle>
            <CardDescription>Where your audience is right now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topLocations.map((location) => (
                <div key={location.location} className="flex items-center justify-between">
                  <span className="text-sm">{location.location}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {location.users} users
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ({location.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Status Indicator */}
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Live data • Updates every 5 seconds</span>
          <Clock className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}