import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { performancePredictor } from '@/lib/ai/performance-predictor';
import { z } from 'zod';

const optimizeContentSchema = z.object({
  content: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    thumbnail: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    contentType: z.string(),
    platform: z.enum(['youtube', 'tiktok', 'twitch']),
    niche: z.string()
  }),
  targetMetric: z.enum(['views', 'engagement', 'retention', 'growth'])
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = optimizeContentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Optimize content
    const optimization = await performancePredictor.optimizeContent(
      validationResult.data.content,
      validationResult.data.targetMetric,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      optimization,
      optimizedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to optimize content:', error);
    return NextResponse.json(
      { error: 'Failed to optimize content' },
      { status: 500 }
    );
  }
}