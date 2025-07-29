import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { performancePredictor } from '@/lib/ai/performance-predictor';
import { z } from 'zod';

const comparePerformanceSchema = z.object({
  scenarios: z.array(z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    thumbnail: z.string().url().optional(),
    publishDate: z.string().datetime().optional(),
    tags: z.array(z.string()).optional()
  })).min(2).max(5),
  baseParams: z.object({
    contentType: z.string(),
    platform: z.enum(['youtube', 'tiktok', 'twitch']),
    niche: z.string()
  })
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = comparePerformanceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Convert date strings to Date objects
    const scenarios = validationResult.data.scenarios.map(scenario => ({
      ...scenario,
      publishDate: scenario.publishDate 
        ? new Date(scenario.publishDate) 
        : undefined
    }));

    // Compare scenarios
    const comparison = await performancePredictor.compareScenarios(
      scenarios,
      validationResult.data.baseParams,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      comparison,
      comparedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to compare scenarios:', error);
    return NextResponse.json(
      { error: 'Failed to compare scenarios' },
      { status: 500 }
    );
  }
}