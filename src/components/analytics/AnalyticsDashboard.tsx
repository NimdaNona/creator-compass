'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FeatureSection } from '@/components/upgrade/FeaturePreview';
import { ExportButton } from '@/components/export/ExportButton';
import { useAppStore } from '@/store/useAppStore';
import { useSubscription } from '@/hooks/useSubscription';
import { exportAnalyticsToPDF, exportToCSV } from '@/lib/export';
import { toast } from 'sonner';
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';
import { cn } from '@/lib/utils';
import { AIAnalyticsInsights } from './AIAnalyticsInsights';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  Clock,
  Calendar,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
  Target,
  Award,
  ChevronRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface AnalyticsData {
  metrics: {
    totalFollowers: number;
    followersChange: string;
    totalViews: number;
    viewsChange: string;
    avgEngagement: string;
    engagementChange: string;
    totalRevenue: number;
    revenueChange: number;
    completedTasks: number;
    completedMilestones: number;
    contentPublished: number;
  };
  growthData: Array<{
    month: string;
    followers: number;
    views: number;
    engagement: number;
  }>;
  contentPerformance: Array<{
    type: string;
    count: number;
    views: number;
    engagement: number;
  }>;
  contentMetrics: {
    published: number;
    scheduled: number;
    draft: number;
    ideas: number;
  };
  audienceData: Array<{
    age: string;
    percentage: number;
  }>;
  insights: Array<{
    type: string;
    title: string;
    description: string;
  }>;
}

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

export function AnalyticsDashboard() {
  const { selectedPlatform } = useAppStore();
  const { subscription, isActive } = useSubscription();
  const [timeRange, setTimeRange] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const isPremium = isActive && subscription?.plan !== 'free';

  // Handle real-time analytics updates
  const handleRealtimeUpdate = useCallback((update: any) => {
    setAnalyticsData(prev => {
      if (!prev) return prev;
      
      const newData = { ...prev };
      
      // Update specific metric
      if (update.type === 'metric' && update.metric) {
        newData.metrics = {
          ...newData.metrics,
          [update.metric]: update.value
        };
        
        // Update change percentage if provided
        const changeKey = `${update.metric}Change`;
        if (update.change !== undefined && changeKey in newData.metrics) {
          (newData.metrics as any)[changeKey] = update.change;
        }
      }
      
      // Update content metrics
      if (update.type === 'content' && update.contentUpdate) {
        newData.contentMetrics = {
          ...newData.contentMetrics,
          ...update.contentUpdate
        };
      }
      
      // Update milestone completion
      if (update.type === 'milestone' && update.milestoneUpdate) {
        newData.metrics.completedMilestones = update.milestoneUpdate.completed;
      }
      
      return newData;
    });
  }, []);

  // Use real-time analytics hook
  useRealtimeAnalytics({
    onUpdate: handleRealtimeUpdate,
    enabled: isPremium && !loading && !error
  });

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isPremium) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          timeRange,
          platform: selectedPlatform?.id || 'all'
        });
        
        const response = await fetch(`/api/analytics?${params}`);
        const data = await response.json();
        
        if (!response.ok) {
          if (data.upgradeRequired) {
            // Analytics is a premium feature, handled by FeatureSection
            setError(null);
          } else {
            throw new Error(data.error || 'Failed to fetch analytics');
          }
        } else {
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchAnalytics, 30000);
    
    return () => clearInterval(interval);
  }, [timeRange, selectedPlatform, isPremium]);

  // Use default data if no analytics data is loaded
  const metrics = analyticsData?.metrics || {
    totalFollowers: 0,
    followersChange: '0',
    totalViews: 0,
    viewsChange: '0',
    avgEngagement: '0',
    engagementChange: '0',
    totalRevenue: 0,
    revenueChange: 0,
    completedTasks: 0,
    completedMilestones: 0,
    contentPublished: 0
  };
  
  const growthData = analyticsData?.growthData || [];
  const contentPerformance = analyticsData?.contentPerformance || [];
  const audienceData = analyticsData?.audienceData || [];
  const insights = analyticsData?.insights || [];
  const contentMetrics = analyticsData?.contentMetrics || {
    published: 0,
    scheduled: 0,
    draft: 0,
    ideas: 0
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: {
    title: string;
    value: number | string;
    change: number | string;
    icon: React.ElementType;
    format?: 'number' | 'percent' | 'currency';
  }) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const numChange = typeof change === 'string' ? parseFloat(change) : change;
    const formatValue = () => {
      switch (format) {
        case 'percent':
          return `${numValue}%`;
        case 'currency':
          return `$${numValue.toLocaleString()}`;
        default:
          return numValue.toLocaleString();
      }
    };

    const isPositive = numChange > 0;
    const isNeutral = numChange === 0;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue()}</div>
          <div className="flex items-center space-x-1 text-xs">
            {isNeutral ? (
              <Minus className="h-3 w-3 text-muted-foreground" />
            ) : isPositive ? (
              <ArrowUp className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-500" />
            )}
            <span className={cn(
              isNeutral ? 'text-muted-foreground' : isPositive ? 'text-green-500' : 'text-red-500'
            )}>
              {Math.abs(numChange)}%
            </span>
            <span className="text-muted-foreground">from last period</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your growth and performance on {selectedPlatform?.name || 'all platforms'}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          {isPremium && (
            <ExportButton
              onExport={async (format) => {
                const analyticsData = {
                  metrics,
                  growthData,
                  contentPerformance,
                  audienceData
                };
                
                if (format === 'pdf') {
                  await exportAnalyticsToPDF(analyticsData, { 
                    title: `${selectedPlatform?.name || 'Platform'} Analytics Report` 
                  });
                } else if (format === 'csv') {
                  // Export growth data as CSV
                  exportToCSV(growthData, { 
                    filename: `growth-data-${timeRange}`,
                    headers: ['month', 'followers', 'views', 'engagement']
                  });
                }
              }}
              size="sm"
              feature="analytics-export"
            />
          )}
        </div>
      </div>

      {/* Feature Preview Wrapper */}
      <FeatureSection
        feature="analytics"
        title="Premium Analytics"
        description="Get detailed insights into your content performance, audience demographics, and growth trends"
      >
        {loading && isPremium ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Metrics Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Followers"
            value={metrics.totalFollowers}
            change={parseFloat(metrics.followersChange)}
            icon={Users}
          />
          <MetricCard
            title="Total Views"
            value={metrics.totalViews}
            change={parseFloat(metrics.viewsChange)}
            icon={Eye}
          />
          <MetricCard
            title="Avg. Engagement"
            value={parseFloat(metrics.avgEngagement)}
            change={parseFloat(metrics.engagementChange)}
            icon={Activity}
            format="percent"
          />
          <MetricCard
            title="Revenue"
            value={metrics.totalRevenue}
            change={metrics.revenueChange}
            icon={Target}
            format="currency"
          />
        </div>

        {/* AI Insights */}
        <AIAnalyticsInsights 
          platform={selectedPlatform?.id || 'youtube'}
          analyticsData={{
            views: metrics.totalViews,
            engagement: parseFloat(metrics.avgEngagement),
            followers: metrics.totalFollowers,
            avgWatchTime: 245,
            topContent: contentPerformance.map(c => c.type),
            peakHours: ['2-4 PM', '7-9 PM'],
            demographics: { age: '18-34', gender: 'mixed', location: 'US/UK' },
          }}
          className="mb-6"
        />

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="audience">Audience</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Growth Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="followers" 
                      stroke="#8b5cf6" 
                      fillOpacity={1} 
                      fill="url(#colorFollowers)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="views" 
                      stroke="#ec4899" 
                      fillOpacity={1} 
                      fill="url(#colorViews)" 
                      yAxisId="right"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Key Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights.length > 0 ? insights.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5",
                      insight.type === 'growth' ? 'bg-green-500' :
                      insight.type === 'engagement' ? 'bg-blue-500' :
                      'bg-purple-500'
                    )} />
                    <div>
                      <p className="text-sm font-medium">{insight.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No insights available yet. Keep creating content!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contentPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" fill="#8b5cf6" />
                    <Bar dataKey="engagement" fill="#ec4899" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performing Content */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Tutorial: Getting Started with...', 'Review: Best Tools for...', 'How I Grew My Channel...'].map((title, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{title}</p>
                          <p className="text-xs text-muted-foreground">
                            {(15000 + index * 5000).toLocaleString()} views • {4.5 - index * 0.2}% engagement
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audience Tab */}
          <TabsContent value="audience" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Age Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={audienceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({age, percentage}) => `${age}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                      >
                        {audienceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Audience Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Gender Split</span>
                      <span className="text-muted-foreground">62% Male, 38% Female</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '62%' }} />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Top Countries</span>
                    </div>
                    <div className="space-y-2 mt-2">
                      {['United States', 'United Kingdom', 'Canada'].map((country, index) => (
                        <div key={country} className="flex justify-between text-xs">
                          <span>{country}</span>
                          <span className="text-muted-foreground">{35 - index * 10}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Peak Activity Time</span>
                      <span className="text-muted-foreground">7-9 PM EST</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Streams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-sm">Ad Revenue</span>
                    </div>
                    <span className="text-sm font-medium">$750</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-pink-500" />
                      <span className="text-sm">Sponsorships</span>
                    </div>
                    <span className="text-sm font-medium">$400</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm">Affiliate</span>
                    </div>
                    <span className="text-sm font-medium">$100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          </>
        )}
      </FeatureSection>
    </div>
  );
}

