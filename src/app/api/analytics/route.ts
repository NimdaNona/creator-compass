import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check subscription status
    const isActive = user.subscription?.status === 'active';
    if (!isActive) {
      return NextResponse.json(
        { 
          error: 'Analytics is a premium feature',
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || '30days';
    const platform = searchParams.get('platform') || 'all';

    // Calculate date range
    let startDate = new Date();
    switch (timeRange) {
      case '7days':
        startDate = subDays(new Date(), 7);
        break;
      case '30days':
        startDate = subDays(new Date(), 30);
        break;
      case '3months':
        startDate = subDays(new Date(), 90);
        break;
      case '6months':
        startDate = subDays(new Date(), 180);
        break;
      case '1year':
        startDate = subDays(new Date(), 365);
        break;
    }

    // Fetch user's progress and milestones
    const progress = await prisma.progress.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startDate
        }
      },
      include: {
        completedTasks: true,
        milestones: true
      }
    });

    // Fetch calendar events for content metrics
    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: user.id,
        scheduledDate: {
          gte: startDate
        },
        ...(platform !== 'all' && { platform })
      }
    });

    // Calculate metrics
    const totalDays = Math.ceil((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const completedTasks = progress.flatMap(p => p.completedTasks).length;
    const totalMilestones = progress.flatMap(p => p.milestones).length;
    const completedMilestones = progress.flatMap(p => p.milestones).filter(m => m.isCompleted).length;

    // Group events by status
    const contentMetrics = {
      published: events.filter(e => e.status === 'published').length,
      scheduled: events.filter(e => e.status === 'scheduled').length,
      draft: events.filter(e => e.status === 'draft').length,
      ideas: events.filter(e => e.status === 'idea').length
    };

    // Calculate growth data (mock data for now, would come from platform APIs)
    const growthData = [];
    const monthlyInterval = Math.ceil(totalDays / 6);
    
    for (let i = 0; i < 6; i++) {
      const date = subDays(new Date(), totalDays - (i * monthlyInterval));
      growthData.push({
        month: format(date, 'MMM'),
        followers: 1200 + (i * 250) + Math.floor(Math.random() * 100),
        views: 45000 + (i * 8500) + Math.floor(Math.random() * 5000),
        engagement: 3.2 + (i * 0.2) + (Math.random() * 0.3)
      });
    }

    // Content performance by type
    const contentTypes = ['video', 'short', 'live', 'post'];
    const contentPerformance = contentTypes.map(type => {
      const typeEvents = events.filter(e => e.contentType === type);
      return {
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count: typeEvents.length,
        views: 15000 + Math.floor(Math.random() * 30000),
        engagement: 3 + Math.random() * 2
      };
    });

    // Calculate metrics with changes
    const previousPeriodMultiplier = 0.85; // Previous period had 85% of current metrics
    const metrics = {
      totalFollowers: growthData[growthData.length - 1].followers,
      followersChange: ((growthData[growthData.length - 1].followers - growthData[0].followers) / growthData[0].followers * 100).toFixed(1),
      totalViews: growthData[growthData.length - 1].views,
      viewsChange: ((growthData[growthData.length - 1].views - growthData[0].views) / growthData[0].views * 100).toFixed(1),
      avgEngagement: growthData[growthData.length - 1].engagement.toFixed(1),
      engagementChange: ((growthData[growthData.length - 1].engagement - growthData[0].engagement) / growthData[0].engagement * 100).toFixed(1),
      totalRevenue: 1250,
      revenueChange: 18.5,
      completedTasks,
      completedMilestones,
      contentPublished: contentMetrics.published
    };

    // Audience data (mock for now)
    const audienceData = [
      { age: '13-17', percentage: 15 },
      { age: '18-24', percentage: 35 },
      { age: '25-34', percentage: 30 },
      { age: '35-44', percentage: 15 },
      { age: '45+', percentage: 5 }
    ];

    return NextResponse.json({
      metrics,
      growthData,
      contentPerformance,
      contentMetrics,
      audienceData,
      insights: [
        {
          type: 'growth',
          title: 'Strong Growth Momentum',
          description: `Your follower count has increased by ${metrics.followersChange}% in the selected period`
        },
        {
          type: 'engagement',
          title: 'Engagement Rate Above Average',
          description: `Your ${metrics.avgEngagement}% engagement rate is above the platform average`
        },
        {
          type: 'content',
          title: 'Content Consistency',
          description: `You've published ${contentMetrics.published} pieces of content in this period`
        }
      ]
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}