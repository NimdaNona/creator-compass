import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { thumbnailAnalyzer } from '@/lib/ai/thumbnail-analyzer';
import { z } from 'zod';

const compareThumbnailsSchema = z.object({
  thumbnailUrls: z.array(z.string().url()).min(2).max(5),
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
    const validationResult = compareThumbnailsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Compare thumbnails
    const comparison = await thumbnailAnalyzer.compareThumbnails(
      validationResult.data.thumbnailUrls,
      validationResult.data.platform,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      comparison,
      comparedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to compare thumbnails:', error);
    return NextResponse.json(
      { error: 'Failed to compare thumbnails' },
      { status: 500 }
    );
  }
}