import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyzeUserProfile } from '@/lib/ai/openai-service';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const analyzeRequestSchema = z.object({
  input: z.string().min(10).max(2000),
  conversationHistory: z.array(z.string()).optional(),
  updateProfile: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { input, conversationHistory, updateProfile } = analyzeRequestSchema.parse(body);

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Analyze user profile
    const analysis = await analyzeUserProfile(input, conversationHistory);

    // Update or create user AI profile if requested
    if (updateProfile) {
      await prisma.userAIProfile.upsert({
        where: { userId: user.id },
        update: {
          creatorLevel: analysis.creatorLevel,
          equipment: analysis.equipment,
          goals: analysis.goals,
          challenges: analysis.challenges,
          timeCommitment: analysis.timeCommitment,
          aiAssessment: analysis,
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          creatorLevel: analysis.creatorLevel,
          equipment: analysis.equipment,
          goals: analysis.goals,
          challenges: analysis.challenges,
          timeCommitment: analysis.timeCommitment,
          contentStyle: analysis.contentNiche,
          aiAssessment: analysis,
        },
      });
    }

    return NextResponse.json({
      analysis,
      profileUpdated: updateProfile,
    });
  } catch (error) {
    console.error('Analyze API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get current user profile analysis
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userAIProfile: true,
        profile: true,
        stats: true,
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build comprehensive profile
    const profile = {
      aiProfile: user.userAIProfile,
      basicProfile: user.profile,
      stats: user.stats,
      subscription: user.subscription,
      analysisNeeded: !user.userAIProfile,
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Get profile analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}