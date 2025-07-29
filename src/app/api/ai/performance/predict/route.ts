import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { performancePredictor } from '@/lib/ai/performance-predictor';
import { z } from 'zod';

const predictPerformanceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  thumbnail: z.string().url().optional(),
  contentType: z.string(),
  platform: z.enum(['youtube', 'tiktok', 'twitch']),
  niche: z.string(),
  publishDate: z.string().datetime().optional(),
  historicalData: z.array(z.object({
    contentId: z.string(),
    views: z.number(),
    likes: z.number(),
    comments: z.number(),
    shares: z.number(),
    watchTime: z.number(),
    publishedAt: z.string().datetime()
  })).optional(),
  tags: z.array(z.string()).optional()
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = predictPerformanceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects
    const params = {
      ...validationResult.data,
      publishDate: validationResult.data.publishDate 
        ? new Date(validationResult.data.publishDate) 
        : undefined,
      historicalData: validationResult.data.historicalData?.map(d => ({
        ...d,
        publishedAt: new Date(d.publishedAt)
      }))
    };

    // Predict performance
    const prediction = await performancePredictor.predictPerformance(
      params,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      prediction,
      predictedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to predict performance:', error);
    return NextResponse.json(
      { error: 'Failed to predict performance' },
      { status: 500 }
    );
  }
}