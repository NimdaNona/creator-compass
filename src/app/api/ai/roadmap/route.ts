import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { roadmapGenerator } from '@/lib/ai/roadmap-generator';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const generateRoadmapSchema = z.object({
  regenerate: z.boolean().optional().default(false),
});

// Generate personalized roadmap
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { regenerate } = generateRoadmapSchema.parse(body);

    // Get user and AI profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userAIProfile: true,
        dynamicRoadmaps: {
          where: { isActive: true },
          orderBy: { generatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.userAIProfile) {
      return NextResponse.json(
        { error: 'AI profile not found. Please complete onboarding first.' },
        { status: 400 }
      );
    }

    // Check if user already has an active roadmap
    if (user.dynamicRoadmaps.length > 0 && !regenerate) {
      return NextResponse.json({
        roadmap: user.dynamicRoadmaps[0],
        message: 'Using existing roadmap. Set regenerate=true to create a new one.',
      });
    }

    // Deactivate existing roadmaps if regenerating
    if (regenerate && user.dynamicRoadmaps.length > 0) {
      await prisma.dynamicRoadmap.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      });
    }

    // Generate new roadmap
    const roadmap = await roadmapGenerator.generatePersonalizedRoadmap(
      user.id,
      {
        creatorLevel: user.userAIProfile.creatorLevel as 'beginner' | 'intermediate' | 'advanced',
        equipment: user.userAIProfile.equipment as any[],
        goals: user.userAIProfile.goals,
        challenges: user.userAIProfile.challenges,
        timeCommitment: user.userAIProfile.timeCommitment,
        preferredPlatforms: [user.profile?.selectedPlatform || 'youtube'],
        contentNiche: user.profile?.selectedNiche || user.userAIProfile.contentStyle || 'general',
        personalityTraits: user.userAIProfile.personalityTraits,
        contentStyle: user.userAIProfile.contentStyle,
      }
    );

    // Create daily tasks from the roadmap
    await createDailyTasksFromRoadmap(roadmap, user.id);

    return NextResponse.json({
      roadmap,
      message: 'Personalized roadmap generated successfully',
    });
  } catch (error) {
    console.error('Generate roadmap error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get user's roadmap
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roadmapId = searchParams.get('id');

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (roadmapId) {
      // Get specific roadmap
      const roadmap = await prisma.dynamicRoadmap.findFirst({
        where: { id: roadmapId, userId: user.id },
      });

      if (!roadmap) {
        return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
      }

      return NextResponse.json({ roadmap });
    } else {
      // Get active roadmap
      const roadmap = await prisma.dynamicRoadmap.findFirst({
        where: { userId: user.id, isActive: true },
        orderBy: { generatedAt: 'desc' },
      });

      if (!roadmap) {
        return NextResponse.json(
          { error: 'No active roadmap found. Generate one first.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ roadmap });
    }
  } catch (error) {
    console.error('Get roadmap error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Adjust roadmap
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roadmapId, reason, adjustmentType } = body;

    if (!roadmapId || !reason || !adjustmentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const adjustedRoadmap = await roadmapGenerator.adjustRoadmap(
      roadmapId,
      user.id,
      reason,
      adjustmentType
    );

    return NextResponse.json({
      roadmap: adjustedRoadmap,
      message: 'Roadmap adjusted successfully',
    });
  } catch (error) {
    console.error('Adjust roadmap error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to create daily tasks from roadmap
async function createDailyTasksFromRoadmap(roadmap: any, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });

  if (!user?.profile) return;

  const platform = user.profile.selectedPlatform || 'youtube';
  const niche = user.profile.selectedNiche || 'general';

  let orderIndex = 0;
  
  for (const phase of roadmap.phases) {
    const phaseNumber = phase.phase;
    const tasksPerWeek = Math.ceil(phase.tasks.length / 4); // Distribute tasks across 4 weeks

    for (let week = 1; week <= 4; week++) {
      const weekTasks = phase.tasks.slice(
        (week - 1) * tasksPerWeek,
        week * tasksPerWeek
      );

      for (let i = 0; i < weekTasks.length; i++) {
        const task = weekTasks[i];
        const dayInWeek = Math.floor(i / Math.ceil(weekTasks.length / 7)) + 1;
        
        await prisma.dailyTask.create({
          data: {
            roadmapId: `${roadmap.id}_phase${phaseNumber}_week${week}`,
            platform,
            niche,
            phase: phaseNumber,
            week,
            dayRange: `Day ${dayInWeek}`,
            title: task.title,
            description: task.description,
            instructions: task.tips || [],
            timeEstimate: task.timeEstimate || 60,
            difficulty: task.difficulty || 'medium',
            category: task.category || 'content',
            platformSpecific: {
              tips: task.tips || [],
              bestPractices: [],
              commonMistakes: [],
            },
            successMetrics: [],
            resources: task.resources?.map((r: string) => ({
              type: 'guide',
              title: r,
            })) || [],
            orderIndex: orderIndex++,
            metadata: {
              aiGenerated: true,
              rationale: task.rationale,
              roadmapId: roadmap.id,
            },
          },
        });
      }
    }
  }
}