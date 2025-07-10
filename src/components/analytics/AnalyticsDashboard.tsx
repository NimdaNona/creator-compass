'use client';

import { useState } from 'react';
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

// Mock data for charts
const growthData = [
  { month: 'Jan', followers: 1200, views: 45000, engagement: 3.2 },
  { month: 'Feb', followers: 1350, views: 52000, engagement: 3.5 },
  { month: 'Mar', followers: 1580, views: 61000, engagement: 3.8 },
  { month: 'Apr', followers: 1820, views: 72000, engagement: 4.1 },
  { month: 'May', followers: 2150, views: 85000, engagement: 4.3 },
  { month: 'Jun', followers: 2480, views: 98000, engagement: 4.5 },
];

const contentPerformance = [
  { type: 'Tutorial', views: 35000, engagement: 4.5, count: 12 },
  { type: 'Review', views: 28000, engagement: 3.8, count: 8 },
  { type: 'Vlog', views: 22000, engagement: 3.2, count: 15 },
  { type: 'Shorts', views: 45000, engagement: 5.2, count: 30 },
  { type: 'Live', views: 18000, engagement: 4.8, count: 5 },
];

const audienceData = [
  { age: '13-17', percentage: 15 },
  { age: '18-24', percentage: 35 },
  { age: '25-34', percentage: 30 },
  { age: '35-44', percentage: 15 },
  { age: '45+', percentage: 5 },
];

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

export function AnalyticsDashboard() {
  const { selectedPlatform } = useAppStore();
  const { subscription, isActive } = useSubscription();
  const [timeRange, setTimeRange] = useState('6months');
  const [activeTab, setActiveTab] = useState('overview');
  
  const isPremium = isActive && subscription?.plan !== 'free';

  // Mock metrics
  const metrics = {
    totalFollowers: 2480,
    followersChange: 15.2,
    totalViews: 98000,
    viewsChange: 12.8,
    avgEngagement: 4.5,
    engagementChange: 2.1,
    totalRevenue: 1250,
    revenueChange: 18.5,
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    format = 'number' 
  }: {
    title: string;
    value: number;
    change: number;
    icon: React.ElementType;
    format?: 'number' | 'percent' | 'currency';
  }) => {
    const formatValue = () => {
      switch (format) {
        case 'percent':
          return `${value}%`;
        case 'currency':
          return `$${value.toLocaleString()}`;
        default:
          return value.toLocaleString();
      }
    };

    const isPositive = change > 0;
    const isNeutral = change === 0;

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
              {Math.abs(change)}%
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
        {/* Metrics Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Followers"
            value={metrics.totalFollowers}
            change={metrics.followersChange}
            icon={Users}
          />
          <MetricCard
            title="Total Views"
            value={metrics.totalViews}
            change={metrics.viewsChange}
            icon={Eye}
          />
          <MetricCard
            title="Avg. Engagement"
            value={metrics.avgEngagement}
            change={metrics.engagementChange}
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
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium">Strong Growth Momentum</p>
                    <p className="text-xs text-muted-foreground">
                      Your follower count has increased by 106% in the last 6 months
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium">Engagement Rate Above Average</p>
                    <p className="text-xs text-muted-foreground">
                      Your 4.5% engagement rate is 2x higher than the platform average
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium">Best Performing Content Type</p>
                    <p className="text-xs text-muted-foreground">
                      Short-form content generates 45% more views than other formats
                    </p>
                  </div>
                </div>
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
      </FeatureSection>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}