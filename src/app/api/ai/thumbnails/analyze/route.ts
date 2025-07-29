import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { thumbnailAnalyzer } from '@/lib/ai/thumbnail-analyzer';
import { z } from 'zod';

const analyzeThumbnailSchema = z.object({
  imageUrl: z.string().url(),
  platform: z.enum(['youtube', 'tiktok', 'twitch'])
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = analyzeThumbnailSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Analyze thumbnail
    const analysis = await thumbnailAnalyzer.analyzeThumbnail(
      validationResult.data.imageUrl,
      validationResult.data.platform,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      analysis,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to analyze thumbnail:', error);
    return NextResponse.json(
      { error: 'Failed to analyze thumbnail' },
      { status: 500 }
    );
  }
}