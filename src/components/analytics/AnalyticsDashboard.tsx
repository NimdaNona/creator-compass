'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  MessageSquare,
  DollarSign,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  LineChart,
  PieChart,
  Activity
} from 'lucide-react';
import { AnalyticsOverview } from './AnalyticsOverview';
import { ContentPerformance } from './ContentPerformance';
import { AudienceInsights } from './AudienceInsights';
import { EngagementAnalytics } from './EngagementAnalytics';
import { GrowthMetrics } from './GrowthMetrics';
import { CompetitorAnalysis } from './CompetitorAnalysis';
import { TrendsAndOpportunities } from './TrendsAndOpportunities';
import { RealTimeAnalytics } from './RealTimeAnalytics';
import { useToast } from '@/components/ui/use-toast';
import type { AnalyticsData, AnalyticsPeriod } from '@/types/analytics';

export function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodType, setPeriodType] = useState<AnalyticsPeriod['type']>('monthly');
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/overview?periodType=${periodType}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [periodType]);

  const handleExport = async (format: 'pdf' | 'csv' | 'json' | 'excel') => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          periodType,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          sections: 'overview,content-performance,audience-insights,engagement-analysis'
        })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${format}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: `Analytics exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export analytics data',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your performance and growth across all platforms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodType} onValueChange={(value: any) => setPeriodType(value)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => fetchAnalytics()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="real-time">Real-Time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <AnalyticsOverview data={analyticsData} />
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <ContentPerformance data={analyticsData?.metrics} />
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <AudienceInsights data={analyticsData?.audienceMetrics} />
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <EngagementAnalytics data={analyticsData?.engagementMetrics} />
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <GrowthMetrics data={analyticsData?.growthMetrics} />
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <CompetitorAnalysis data={analyticsData?.competitorAnalysis} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <TrendsAndOpportunities data={analyticsData?.trends} />
        </TabsContent>

        <TabsContent value="real-time" className="space-y-6">
          <RealTimeAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}