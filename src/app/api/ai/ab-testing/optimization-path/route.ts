import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { abTestingAdvisor } from '@/lib/ai/ab-testing-advisor';
import { z } from 'zod';

const generateOptimizationPathSchema = z.object({
  currentContent: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    thumbnail: z.string().url().optional(),
    metrics: z.object({
      views: z.number(),
      engagement: z.number(),
      retention: z.number()
    })
  }),
  goals: z.object({
    targetViews: z.number().optional(),
    targetEngagement: z.number().optional(),
    targetRetention: z.number().optional(),
    timeframe: z.number().optional()
  }),
  platform: z.enum(['youtube', 'tiktok', 'twitch']),
  niche: z.string(),
  constraints: z.array(z.string()).optional()
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = generateOptimizationPathSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Generate optimization path
    const optimizationPath = await abTestingAdvisor.generateOptimizationPath(
      validationResult.data,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      optimizationPath,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to generate optimization path:', error);
    return NextResponse.json(
      { error: 'Failed to generate optimization path' },
      { status: 500 }
    );
  }
}