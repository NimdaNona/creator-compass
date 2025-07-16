import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateContent, moderateContent } from '@/lib/ai/openai-service';
import { ContentGenerationType } from '@/lib/ai/types';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const generateRequestSchema = z.object({
  type: z.enum([
    'bio',
    'content-idea',
    'caption',
    'script-outline',
    'thumbnail-concept',
    'title',
    'description',
    'hashtags',
    'hook',
    'call-to-action',
    'channel-description',
    'video-tags',
  ] as const),
  context: z.object({
    platform: z.enum(['youtube', 'tiktok', 'twitch']).optional(),
    niche: z.string().optional(),
    topic: z.string().optional(),
    targetAudience: z.string().optional(),
    tone: z.enum(['professional', 'casual', 'humorous', 'educational', 'inspirational']).optional(),
    keywords: z.array(z.string()).optional(),
    length: z.enum(['short', 'medium', 'long']).optional(),
    style: z.string().optional(),
    additionalContext: z.string().optional(),
  }),
  options: z.object({
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(50).max(4000).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, context, options } = generateRequestSchema.parse(body);

    // Get user ID and check usage limits
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscription: true,
        usageTracking: {
          where: {
            feature: 'templates',
            resetAt: { gt: new Date() },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check usage limits for free users
    const usage = user.usageTracking[0];
    const isSubscribed = user.subscription?.status === 'active';
    
    if (!isSubscribed && usage) {
      const freeLimit = 10; // Free users get 10 generations per month
      if (usage.count >= freeLimit) {
        return NextResponse.json(
          { 
            error: 'Template generation limit reached',
            limit: freeLimit,
            resetAt: usage.resetAt,
            upgradeUrl: '/pricing',
          },
          { status: 429 }
        );
      }
    }

    // Moderate user input
    const contextString = JSON.stringify(context);
    const isSafe = await moderateContent(contextString);
    
    if (!isSafe) {
      return NextResponse.json(
        { error: 'Content violates usage guidelines' },
        { status: 400 }
      );
    }

    // Add user profile context
    const userProfile = await prisma.userAIProfile.findUnique({
      where: { userId: user.id },
    });

    const enrichedContext = {
      ...context,
      userProfile: userProfile ? {
        creatorLevel: userProfile.creatorLevel,
        contentStyle: userProfile.contentStyle,
        goals: userProfile.goals,
      } : undefined,
    };

    // Generate content
    const generatedContent = await generateContent(
      type as ContentGenerationType,
      enrichedContext,
      options
    );

    // Save generated content
    await prisma.generatedContent.create({
      data: {
        userId: user.id,
        type,
        prompt: contextString,
        content: { text: generatedContent },
        metadata: enrichedContext,
      },
    });

    // Update usage tracking
    if (!isSubscribed) {
      await prisma.usageTracking.update({
        where: {
          userId_feature: {
            userId: user.id,
            feature: 'templates',
          },
        },
        data: {
          count: { increment: 1 },
        },
      });
    }

    return NextResponse.json({
      content: generatedContent,
      type,
      remainingCredits: isSubscribed ? 'unlimited' : (10 - (usage?.count || 0) - 1),
    });
  } catch (error) {
    console.error('Generate API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get user's generated content history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const where = {
      userId: user.id,
      ...(type && { type }),
    };

    const [generatedContent, total] = await Promise.all([
      prisma.generatedContent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.generatedContent.count({ where }),
    ]);

    return NextResponse.json({
      content: generatedContent,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get generated content error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}