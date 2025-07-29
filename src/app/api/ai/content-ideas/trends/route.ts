import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { contentIdeaGenerator } from '@/lib/ai/content-idea-generator';
import { z } from 'zod';

const trendsSchema = z.object({
  platform: z.enum(['youtube', 'tiktok', 'twitch']),
  niche: z.string()
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const niche = searchParams.get('niche');

    // Validate query params
    const validationResult = trendsSchema.safeParse({ platform, niche });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Get trend analysis
    const trends = await contentIdeaGenerator.analyzeTrends(
      validationResult.data.platform,
      validationResult.data.niche
    );

    return NextResponse.json({
      success: true,
      trends,
      platform: validationResult.data.platform,
      niche: validationResult.data.niche,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to analyze trends:', error);
    return NextResponse.json(
      { error: 'Failed to analyze trends' },
      { status: 500 }
    );
  }
}