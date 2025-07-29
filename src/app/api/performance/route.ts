import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Performance metric thresholds
const THRESHOLDS = {
  fcp: { good: 1800, poor: 3000 },
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 },
};

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  componentName?: string;
  url?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { metrics, url, userAgent } = await req.json();

    // Validate metrics
    if (!Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json(
        { error: 'Invalid metrics data' },
        { status: 400 }
      );
    }

    // Process metrics
    const processedMetrics = metrics.map((metric: PerformanceMetric) => {
      const threshold = THRESHOLDS[metric.name as keyof typeof THRESHOLDS];
      
      // Calculate rating if not provided
      if (!metric.rating && threshold) {
        if (metric.value <= threshold.good) {
          metric.rating = 'good';
        } else if (metric.value <= threshold.poor) {
          metric.rating = 'needs-improvement';
        } else {
          metric.rating = 'poor';
        }
      }

      return metric;
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance Metrics]', {
        url,
        metrics: processedMetrics,
        userAgent,
      });
    }

    // Store in database for production
    if (process.env.NODE_ENV === 'production') {
      await prisma.performanceMetric.createMany({
        data: processedMetrics.map((metric: PerformanceMetric) => ({
          userId: session?.user?.id,
          metricName: metric.name,
          value: metric.value,
          rating: metric.rating,
          componentName: metric.componentName,
          url: url || metric.url,
          userAgent,
        })),
      });

      // Alert on poor performance
      const poorMetrics = processedMetrics.filter(m => m.rating === 'poor');
      if (poorMetrics.length > 0) {
        console.warn('[Performance Alert]', {
          url,
          poorMetrics,
          userId: session?.user?.id,
        });
      }
    }

    // Calculate overall score
    const totalScore = processedMetrics.reduce((acc, metric) => {
      if (metric.rating === 'good') return acc + 1;
      if (metric.rating === 'needs-improvement') return acc + 0.5;
      return acc;
    }, 0);

    const overallScore = (totalScore / processedMetrics.length) * 100;

    return NextResponse.json({
      success: true,
      metrics: processedMetrics,
      overallScore,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to process metrics' },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving performance data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    
    const timeRange = searchParams.get('timeRange') || '24h';
    const url = searchParams.get('url');
    const metricName = searchParams.get('metric');

    // Calculate date range
    const hoursMap: Record<string, number> = {
      '1h': 1,
      '24h': 24,
      '7d': 168,
      '30d': 720,
    };
    
    const hours = hoursMap[timeRange] || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Build query
    const where: any = {
      createdAt: { gte: since },
    };

    if (session?.user?.id) {
      where.userId = session.user.id;
    }

    if (url) {
      where.url = url;
    }

    if (metricName) {
      where.metricName = metricName;
    }

    // Fetch metrics
    const metrics = await prisma.performanceMetric.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    // Group by metric name and calculate aggregates
    const aggregates = metrics.reduce((acc, metric) => {
      if (!acc[metric.metricName]) {
        acc[metric.metricName] = {
          name: metric.metricName,
          values: [],
          ratings: { good: 0, 'needs-improvement': 0, poor: 0 },
        };
      }

      acc[metric.metricName].values.push(metric.value);
      acc[metric.metricName].ratings[metric.rating]++;

      return acc;
    }, {} as Record<string, any>);

    // Calculate statistics
    const statistics = Object.values(aggregates).map((agg: any) => {
      const sorted = [...agg.values].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)] || 0;
      const p75 = sorted[Math.floor(sorted.length * 0.75)] || 0;
      const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
      const average = agg.values.reduce((a: number, b: number) => a + b, 0) / agg.values.length;

      return {
        name: agg.name,
        count: agg.values.length,
        average: Math.round(average),
        median: Math.round(median),
        p75: Math.round(p75),
        p95: Math.round(p95),
        ratings: agg.ratings,
      };
    });

    return NextResponse.json({
      timeRange,
      since: since.toISOString(),
      totalMetrics: metrics.length,
      statistics,
      recentMetrics: metrics.slice(0, 100),
    });
  } catch (error) {
    console.error('Failed to retrieve performance metrics:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve metrics' },
      { status: 500 }
    );
  }
}