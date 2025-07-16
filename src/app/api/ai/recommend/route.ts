import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateRecommendations, prioritizeTasks } from '@/lib/ai/openai-service';
import { knowledgeBase } from '@/lib/ai/knowledge-base';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const recommendRequestSchema = z.object({
  type: z.enum(['equipment', 'content', 'strategy', 'next-steps', 'all']),
  context: z.object({
    currentPage: z.string().optional(),
    recentActivity: z.array(z.string()).optional(),
    specificNeed: z.string().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, context } = recommendRequestSchema.parse(body);

    // Get user data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userAIProfile: true,
        profile: true,
        stats: true,
        taskCompletions: {
          orderBy: { completedAt: 'desc' },
          take: 10,
        },
        milestoneAchievements: {
          orderBy: { achievedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build user context
    const userContext = {
      creatorLevel: user.userAIProfile?.creatorLevel || 'beginner',
      platform: user.profile?.selectedPlatform || 'youtube',
      niche: user.profile?.selectedNiche || 'general',
      goals: user.userAIProfile?.goals || [],
      challenges: user.userAIProfile?.challenges || [],
      recentCompletions: user.taskCompletions.map(tc => tc.taskId),
      achievements: user.milestoneAchievements.map(ma => ma.milestoneId),
      stats: {
        totalTasks: user.stats?.totalTasksCompleted || 0,
        streak: user.stats?.currentStreak || 0,
        level: user.stats?.level || 1,
      },
      ...context,
    };

    let recommendations: string[] = [];

    if (type === 'all') {
      // Generate comprehensive recommendations
      const [equipment, content, strategy, nextSteps] = await Promise.all([
        generateRecommendations(userContext, 'equipment'),
        generateRecommendations(userContext, 'content'),
        generateRecommendations(userContext, 'strategy'),
        generateRecommendations(userContext, 'next-steps'),
      ]);

      recommendations = [
        ...equipment.map(r => ({ type: 'equipment', ...r })),
        ...content.map(r => ({ type: 'content', ...r })),
        ...strategy.map(r => ({ type: 'strategy', ...r })),
        ...nextSteps.map(r => ({ type: 'next-steps', ...r })),
      ];
    } else {
      // Generate specific type of recommendations
      const recs = await generateRecommendations(userContext, type);
      recommendations = recs.map(r => ({ type, ...r }));
    }

    // Save recommendations to database
    const savedRecommendations = await Promise.all(
      recommendations.map(rec =>
        prisma.aIRecommendation.create({
          data: {
            userId: user.id,
            type: rec.type,
            title: rec.title || `${rec.type} recommendation`,
            description: rec.description || rec,
            priority: rec.priority || 'medium',
            reason: rec.reason || 'Based on your profile and activity',
            actionItems: rec.actionItems || [],
            estimatedImpact: rec.estimatedImpact,
            timeframe: rec.timeframe,
          },
        })
      )
    );

    return NextResponse.json({
      recommendations: savedRecommendations,
      context: userContext,
    });
  } catch (error) {
    console.error('Recommend API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get user's recommendations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status'); // active, implemented, dismissed

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
      ...(status === 'active' && { implemented: false, dismissed: false }),
      ...(status === 'implemented' && { implemented: true }),
      ...(status === 'dismissed' && { dismissed: true }),
    };

    const recommendations = await prisma.aIRecommendation.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Get recommendations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update recommendation status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recommendationId, implemented, dismissed } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const recommendation = await prisma.aIRecommendation.findFirst({
      where: {
        id: recommendationId,
        userId: user.id,
      },
    });

    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 });
    }

    const updated = await prisma.aIRecommendation.update({
      where: { id: recommendationId },
      data: {
        ...(implemented !== undefined && { implemented }),
        ...(dismissed !== undefined && { dismissed }),
      },
    });

    return NextResponse.json({ recommendation: updated });
  } catch (error) {
    console.error('Update recommendation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}