import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { trackUsage } from '@/lib/usage';

// Schema for saving an idea
const saveIdeaSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string(),
  hook: z.string().optional(),
  contentType: z.string(),
  category: z.string(),
  keywords: z.array(z.string()),
  platform: z.string().optional(),
  estimatedEngagement: z.enum(['high', 'medium', 'low']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  format: z.string().optional()
});

// POST /api/ideas/save - Save a generated idea
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = saveIdeaSchema.parse(body);

    // Track usage for free tier limits
    const isActive = user.subscription?.status === 'active';
    if (!isActive) {
      const usageCheck = await trackUsage(user.id, 'ideas', true);
      if (!usageCheck.allowed) {
        return NextResponse.json(
          { 
            error: 'Daily idea limit reached',
            upgradeRequired: true
          },
          { status: 403 }
        );
      }
    }

    // Create the content idea
    const idea = await prisma.contentIdea.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        description: validatedData.description,
        hook: validatedData.hook,
        contentType: validatedData.contentType,
        category: validatedData.category,
        tags: validatedData.keywords,
        platform: validatedData.platform || 'general',
        metadata: {
          estimatedEngagement: validatedData.estimatedEngagement,
          difficulty: validatedData.difficulty,
          format: validatedData.format
        },
        status: 'saved'
      }
    });

    return NextResponse.json({ idea }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error saving idea:', error);
    return NextResponse.json(
      { error: 'Failed to save idea' },
      { status: 500 }
    );
  }
}