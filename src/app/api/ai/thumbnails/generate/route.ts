import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { thumbnailAnalyzer } from '@/lib/ai/thumbnail-analyzer';
import { z } from 'zod';

const generateThumbnailSchema = z.object({
  title: z.string().min(1),
  style: z.enum(['minimalist', 'bold', 'professional', 'playful', 'dramatic']),
  platform: z.enum(['youtube', 'tiktok', 'twitch']),
  elements: z.object({
    includeText: z.boolean().optional(),
    includeFace: z.boolean().optional(),
    includeGraphics: z.boolean().optional(),
    includeBackground: z.boolean().optional()
  }).optional(),
  colorScheme: z.enum(['vibrant', 'muted', 'monochrome', 'complementary', 'analogous']).optional(),
  mood: z.string().optional(),
  targetAudience: z.string().optional(),
  competitors: z.array(z.string()).optional()
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = generateThumbnailSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Generate thumbnail concepts
    const concepts = await thumbnailAnalyzer.generateThumbnailConcepts(
      validationResult.data,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      concepts,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to generate thumbnail concepts:', error);
    return NextResponse.json(
      { error: 'Failed to generate thumbnail concepts' },
      { status: 500 }
    );
  }
}