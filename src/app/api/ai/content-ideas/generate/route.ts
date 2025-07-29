import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { contentIdeaGenerator } from '@/lib/ai/content-idea-generator';
import { z } from 'zod';

const generateIdeasSchema = z.object({
  platform: z.enum(['youtube', 'tiktok', 'twitch']),
  niche: z.string(),
  targetAudience: z.string().optional(),
  contentGoals: z.array(z.string()).optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  preferences: z.object({
    contentLength: z.enum(['short', 'medium', 'long']).optional(),
    style: z.enum(['educational', 'entertainment', 'motivational', 'informational']).optional(),
    frequency: z.enum(['daily', 'weekly', 'biweekly']).optional()
  }).optional()
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = generateIdeasSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const params = {
      ...validationResult.data,
      userId: session.user.id
    };

    // Generate content ideas
    const ideas = await contentIdeaGenerator.generateIdeas(params);

    return NextResponse.json({
      success: true,
      ideas,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to generate content ideas:', error);
    return NextResponse.json(
      { error: 'Failed to generate content ideas' },
      { status: 500 }
    );
  }
}