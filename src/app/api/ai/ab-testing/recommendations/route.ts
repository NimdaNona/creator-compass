import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { abTestingAdvisor } from '@/lib/ai/ab-testing-advisor';
import { z } from 'zod';

const generateRecommendationsSchema = z.object({
  contentType: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  currentMetrics: z.object({
    views: z.number(),
    engagement: z.number(),
    retention: z.number(),
    clickThrough: z.number().optional()
  }).optional(),
  platform: z.enum(['youtube', 'tiktok', 'twitch']),
  niche: z.string(),
  goals: z.array(z.string()).optional()
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = generateRecommendationsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Generate A/B test recommendations
    const recommendations = await abTestingAdvisor.generateTestRecommendations(
      validationResult.data,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      recommendations,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to generate A/B test recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate A/B test recommendations' },
      { status: 500 }
    );
  }
}