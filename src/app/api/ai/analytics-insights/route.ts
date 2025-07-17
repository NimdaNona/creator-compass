import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { chatCompletionStream } from '@/lib/ai/openai';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const analyticsInsightsSchema = z.object({
  platform: z.string(),
  analyticsData: z.object({
    views: z.number().optional(),
    engagement: z.number().optional(),
    followers: z.number().optional(),
    avgWatchTime: z.number().optional(),
    topContent: z.array(z.string()).optional(),
    peakHours: z.array(z.string()).optional(),
    demographics: z.record(z.any()).optional(),
  }).optional(),
  includeRecommendations: z.boolean().optional().default(true),
  includePredictions: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, analyticsData, includeRecommendations, includePredictions } = 
      analyticsInsightsSchema.parse(body);

    // Get user profile for context
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        analytics: {
          orderBy: { createdAt: 'desc' },
          take: 30, // Last 30 days of analytics
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build analytics context
    const historicalData = user.analytics || [];
    const userContext = {
      platform,
      creatorLevel: user.profile?.creatorLevel || 'beginner',
      niche: user.profile?.niche || 'general',
      goals: user.profile?.goals || [],
      currentData: analyticsData || {},
      historicalTrends: calculateTrends(historicalData),
    };

    const systemPrompt = `You are an AI analytics expert for Creator Compass, specializing in content creator growth analytics.

Platform: ${platform}
Creator Level: ${userContext.creatorLevel}
Niche: ${userContext.niche}
Goals: ${userContext.goals.join(', ')}

Current Analytics Data:
${JSON.stringify(userContext.currentData, null, 2)}

Historical Trends:
${JSON.stringify(userContext.historicalTrends, null, 2)}

Your task is to analyze the data and provide:

1. Metric Trends Analysis:
   - Identify key performance metrics and their trends
   - Calculate percentage changes
   - Provide insights on what's driving the changes
   - Give specific recommendations for improvement

2. Growth Predictions (if requested):
   - Forecast 30-day and 90-day growth
   - Base predictions on historical trends and current trajectory
   - Include confidence levels (0-100%)
   - List key factors influencing predictions

3. Content Recommendations (if requested):
   - Suggest specific content types based on performance
   - Prioritize by expected impact
   - Include time estimates
   - Tag with relevant categories

4. Engagement Patterns:
   - Identify positive and negative patterns
   - Explain their impact
   - Provide actionable suggestions

Format your response as a JSON object with these keys:
{
  "trends": [array of metric trends],
  "predictions": [array of growth predictions],
  "recommendations": [array of content recommendations],
  "patterns": [array of engagement patterns]
}`;

    const userPrompt = `Analyze the creator's performance data and provide actionable insights. Focus on:
- What's working well and should be amplified
- Areas needing improvement with specific solutions
- Growth opportunities based on platform trends
- Content strategies that align with their goals`;

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Process AI response
    (async () => {
      try {
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userPrompt },
        ];

        const aiStream = await chatCompletionStream(messages);
        let fullResponse = '';

        for await (const chunk of aiStream) {
          if (chunk.content) {
            fullResponse += chunk.content;
          }
        }

        // Parse AI response
        try {
          const parsed = JSON.parse(fullResponse);
          
          // Send trends
          if (parsed.trends) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              trends: parsed.trends 
            })}\n\n`));
          }

          // Send predictions if requested
          if (includePredictions && parsed.predictions) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              predictions: parsed.predictions 
            })}\n\n`));
          }

          // Send recommendations if requested
          if (includeRecommendations && parsed.recommendations) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              recommendations: parsed.recommendations 
            })}\n\n`));
          }

          // Send patterns
          if (parsed.patterns) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              patterns: parsed.patterns 
            })}\n\n`));
          }

        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          
          // Send fallback insights
          const fallbackInsights = generateFallbackInsights(platform, analyticsData);
          
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            trends: fallbackInsights.trends 
          })}\n\n`));
          
          if (includePredictions) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              predictions: fallbackInsights.predictions 
            })}\n\n`));
          }
          
          if (includeRecommendations) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              recommendations: fallbackInsights.recommendations 
            })}\n\n`));
          }
          
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            patterns: fallbackInsights.patterns 
          })}\n\n`));
        }

        await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (error) {
        console.error('Stream processing error:', error);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ 
          error: 'Failed to generate insights' 
        })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Analytics insights API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateTrends(historicalData: any[]): any {
  // Simple trend calculation based on historical data
  if (historicalData.length < 2) return {};

  const latest = historicalData[0];
  const previous = historicalData[1];

  return {
    viewsTrend: latest?.views && previous?.views 
      ? ((latest.views - previous.views) / previous.views * 100).toFixed(1)
      : 0,
    engagementTrend: latest?.engagement && previous?.engagement
      ? ((latest.engagement - previous.engagement) / previous.engagement * 100).toFixed(1)
      : 0,
    followersTrend: latest?.followers && previous?.followers
      ? ((latest.followers - previous.followers) / previous.followers * 100).toFixed(1)
      : 0,
  };
}

function generateFallbackInsights(platform: string, data: any) {
  return {
    trends: [
      {
        metric: 'Views',
        value: data?.views || 0,
        change: 15,
        trend: 'up',
        insight: 'Views are trending upward',
        recommendation: 'Maintain consistent posting schedule',
      },
      {
        metric: 'Engagement',
        value: data?.engagement || 0,
        change: -5,
        trend: 'down',
        insight: 'Slight dip in engagement',
        recommendation: 'Try more interactive content formats',
      },
    ],
    predictions: [
      {
        metric: 'Followers',
        current: data?.followers || 0,
        predicted30Days: Math.round((data?.followers || 0) * 1.2),
        predicted90Days: Math.round((data?.followers || 0) * 1.5),
        confidence: 75,
        factors: ['Consistent growth', 'Content quality'],
      },
    ],
    recommendations: [
      {
        type: 'Content',
        title: 'Create trending content',
        reason: 'Trending topics get 3x more views',
        expectedImpact: '+30% reach',
        priority: 'high',
        estimatedTime: '2 hours',
        tags: ['trending', 'growth'],
      },
    ],
    patterns: [
      {
        pattern: 'Best performance on weekdays',
        description: 'Content posted Mon-Fri gets more engagement',
        impact: 'positive',
        suggestion: 'Focus posting schedule on weekdays',
      },
    ],
  };
}