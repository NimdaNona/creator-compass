import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { abTestingAdvisor } from '@/lib/ai/ab-testing-advisor';
import { z } from 'zod';

const analyzeResultsSchema = z.object({
  testId: z.string().min(1),
  variants: z.array(z.object({
    name: z.string(),
    metrics: z.object({
      views: z.number(),
      engagement: z.number(),
      retention: z.number(),
      clicks: z.number().optional(),
      conversions: z.number().optional()
    }),
    sampleSize: z.number()
  })).min(2),
  duration: z.number()
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = analyzeResultsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Analyze A/B test results
    const analysis = await abTestingAdvisor.analyzeTestResults(
      validationResult.data.testId,
      {
        variants: validationResult.data.variants,
        duration: validationResult.data.duration
      },
      session.user.id
    );

    return NextResponse.json({
      success: true,
      analysis,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to analyze A/B test results:', error);
    return NextResponse.json(
      { error: 'Failed to analyze A/B test results' },
      { status: 500 }
    );
  }
}