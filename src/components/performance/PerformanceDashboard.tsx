'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { performanceMonitor } from '@/lib/services/performance-monitor-service';

interface PerformanceData {
  timeRange: string;
  since: string;
  totalMetrics: number;
  statistics: Array<{
    name: string;
    count: number;
    average: number;
    median: number;
    p75: number;
    p95: number;
    ratings: {
      good: number;
      'needs-improvement': number;
      poor: number;
    };
  }>;
}

export function PerformanceDashboard() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');
  const [localMetrics, setLocalMetrics] = useState(performanceMonitor.getStatistics());

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/performance?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setData(data);
      }
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange]);

  useEffect(() => {
    // Update local metrics every 5 seconds
    const interval = setInterval(() => {
      setLocalMetrics(performanceMonitor.getStatistics());
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-600 bg-green-50';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-50';
      case 'poor':
        return 'text-red-600 bg-red-50';
      default:
        return '';
    }
  };

  const getMetricIcon = (current: number, previous: number) => {
    if (!previous) return <Minus className="h-4 w-4 text-gray-400" />;
    
    const change = ((current - previous) / previous) * 100;
    if (Math.abs(change) < 5) {
      return <Minus className="h-4 w-4 text-gray-400" />;
    } else if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    }
  };

  const formatMetricName = (name: string) => {
    const nameMap: Record<string, string> = {
      FCP: 'First Contentful Paint',
      LCP: 'Largest Contentful Paint',
      FID: 'First Input Delay',
      CLS: 'Cumulative Layout Shift',
      TTFB: 'Time to First Byte',
    };
    return nameMap[name] || name;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Performance Monitoring</h2>
          <p className="text-muted-foreground">
            Real-time performance metrics and Web Vitals
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPerformanceData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Local Metrics (Real-time) */}
      {Object.keys(localMetrics).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Session Metrics</CardTitle>
            <CardDescription>
              Real-time metrics from your current session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(localMetrics).map(([name, stats]) => (
                <div key={name} className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {name.replace(/^(custom|measure)\./, '')}
                  </p>
                  <p className="text-2xl font-bold">
                    {Math.round(stats.average)}ms
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stats.count} samples
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Server Metrics */}
      {data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.statistics.map((metric) => (
              <Card key={metric.name}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {formatMetricName(metric.name)}
                  </CardTitle>
                  <CardDescription>
                    {metric.count} measurements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Average</p>
                      <p className="font-semibold">{metric.average}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Median</p>
                      <p className="font-semibold">{metric.median}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">75th %ile</p>
                      <p className="font-semibold">{metric.p75}ms</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">95th %ile</p>
                      <p className="font-semibold">{metric.p95}ms</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Rating Distribution</p>
                    <div className="flex gap-2">
                      {Object.entries(metric.ratings).map(([rating, count]) => (
                        <Badge
                          key={rating}
                          variant="secondary"
                          className={getRatingColor(rating)}
                        >
                          {rating}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{data.totalMetrics}</p>
                  <p className="text-sm text-muted-foreground">Total Metrics</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {data.statistics.reduce(
                      (acc, stat) => acc + stat.ratings.good,
                      0
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Good Ratings</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">
                    {data.statistics.reduce(
                      (acc, stat) => acc + stat.ratings.poor,
                      0
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Poor Ratings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!data && !loading && (
        <Card>
          <CardContent className="text-center py-10">
            <p className="text-muted-foreground">
              No performance data available. Metrics will appear as users interact with your application.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}