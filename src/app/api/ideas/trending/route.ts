import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { trendingTopicsByPlatform, seasonalOpportunities } from '@/data/trendingTopics';

// Schema for fetching trends
const trendingSchema = z.object({
  platform: z.string().optional(),
  niche: z.string().optional()
});

// POST /api/ideas/trending - Get trending topics
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform } = trendingSchema.parse(body);

    // Get platform-specific trends or default to YouTube
    const platformKey = platform || 'youtube';
    const trends = trendingTopicsByPlatform[platformKey] || trendingTopicsByPlatform['youtube'];

    // Get current month for seasonal content
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' }).toLowerCase();
    const monthKey = currentMonth as keyof typeof seasonalOpportunities;
    const seasonal = seasonalOpportunities[monthKey] || [];

    // Add some seasonal trends if available
    const seasonalTrends = seasonal.slice(0, 2).map((topic, index) => ({
      id: `seasonal-${index}`,
      title: topic,
      category: 'Seasonal',
      platform: platformKey,
      trendScore: 85 + Math.floor(Math.random() * 10),
      growth: 20 + Math.floor(Math.random() * 30),
      viewsEstimate: '20K-100K',
      competition: 'medium' as const,
      hashtags: [
        topic.toLowerCase().replace(/\s+/g, ''),
        currentMonth,
        'seasonal',
        '2024'
      ],
      description: `Timely content opportunity for ${topic} this ${currentMonth}.`,
      timeToTrend: '1-2 weeks',
      examples: [
        { creator: '@seasonalcreator1', views: '75K', engagement: '8%' },
        { creator: '@seasonalcreator2', views: '45K', engagement: '6%' }
      ]
    }));

    // Combine platform trends with seasonal
    const allTrends = [...trends, ...seasonalTrends];

    // Sort by trend score
    allTrends.sort((a, b) => b.trendScore - a.trendScore);

    // Return top trends
    return NextResponse.json({ 
      trends: allTrends.slice(0, 10),
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error fetching trending topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending topics' },
      { status: 500 }
    );
  }
}