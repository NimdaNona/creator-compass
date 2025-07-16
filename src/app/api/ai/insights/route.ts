import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { chatCompletion } from '@/lib/ai/openai-service';
import { userContextService } from '@/lib/ai/user-context';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const insightsRequestSchema = z.object({
  platform: z.string(),
  niche: z.string().optional(),
  progress: z.object({
    currentPhase: z.string(),
    daysActive: z.number(),
    completedTasks: z.number(),
    totalTasks: z.number(),
    streakDays: z.number(),
  }),
  subscription: z.object({
    status: z.string(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, niche, progress, subscription } = insightsRequestSchema.parse(body);

    // Get user data for more context
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userAIProfile: true,
        taskCompletions: {
          orderBy: { completedAt: 'desc' },
          take: 5,
        },
        milestoneAchievements: {
          orderBy: { achievedAt: 'desc' },
          take: 3,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get comprehensive user context
    const userContext = await userContextService.getUserContext(user.id);
    
    // Build context for AI
    const context = {
      platform,
      niche: niche || 'general',
      progress,
      creatorLevel: userContext?.creatorLevel || user.userAIProfile?.creatorLevel || 'beginner',
      recentTasks: user.taskCompletions.map(tc => tc.taskId),
      achievements: user.milestoneAchievements.map(ma => ma.milestoneId),
      isSubscribed: subscription?.status === 'active',
      userContext, // Include full context
    };

    // Generate insights using AI
    const messages = [
      {
        role: 'system' as const,
        content: `You are an AI coach for CreatorCompass, helping content creators on ${platform} follow their 90-day roadmap to success.
        
        Context: CreatorCompass provides structured roadmaps divided into three phases:
        1. Foundation (Days 1-30): Setting up basics, understanding the platform
        2. Growth (Days 31-60): Building audience, improving content quality
        3. Scale (Days 61-90): Monetization, advanced strategies
        
        ${userContext ? `User Profile:
        - They've been active for ${userContext.daysActive} days
        - Current phase: ${userContext.currentPhase}
        - Creator level: ${userContext.creatorLevel}
        - Goals: ${userContext.goals.join(', ')}
        - Challenges: ${userContext.challenges.join(', ')}
        - Equipment: ${userContext.equipment.join(', ')}
        - Time commitment: ${userContext.timeCommitment}
        ` : ''}
        
        Generate 3-4 personalized insights based on the creator's current progress. Focus on:
        - What they're doing well
        - What they should focus on next based on their specific goals and challenges
        - Platform-specific tips for their current phase
        - Motivation based on their streak and progress
        - Address their specific challenges with actionable solutions
        
        Format each insight as JSON with:
        - type: "tip" | "warning" | "success" | "recommendation"
        - title: Brief, engaging title
        - content: Specific, actionable advice (1-2 sentences)
        - priority: "high" | "medium" | "low"
        - action: Optional object with { label: string, href: string }
        
        Be encouraging, specific, and actionable. Reference their actual progress, goals, and challenges.`,
      },
      {
        role: 'user' as const,
        content: `Generate insights for this creator:
        
        Platform: ${context.platform}
        Niche: ${context.niche}
        Current Phase: ${context.progress.currentPhase}
        Days Active: ${context.progress.daysActive}
        Progress: ${context.progress.completedTasks}/${context.progress.totalTasks} tasks
        Streak: ${context.progress.streakDays} days
        Creator Level: ${context.creatorLevel}
        
        Return an array of 3-4 insights in JSON format.`,
      },
    ];

    const response = await chatCompletion(messages, {
      temperature: 0.7,
      maxTokens: 1000,
    });

    try {
      const insights = JSON.parse(response.content);
      
      // Ensure insights have the correct structure
      const validatedInsights = insights.map((insight: any) => ({
        type: insight.type || 'tip',
        title: insight.title || 'Insight',
        content: insight.content || '',
        priority: insight.priority || 'medium',
        action: insight.action,
      }));

      return NextResponse.json({ insights: validatedInsights });
    } catch (parseError) {
      console.error('Failed to parse AI insights:', parseError);
      
      // Return fallback insights
      const fallbackInsights = generateFallbackInsights(context);
      return NextResponse.json({ insights: fallbackInsights });
    }
  } catch (error) {
    console.error('Insights API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateFallbackInsights(context: any) {
  const insights = [];

  // Progress-based insight
  if (context.progress.completedTasks > 0) {
    const completionRate = (context.progress.completedTasks / context.progress.totalTasks) * 100;
    insights.push({
      type: 'success',
      title: `${Math.round(completionRate)}% Complete!`,
      content: `You've completed ${context.progress.completedTasks} tasks. Keep up the great momentum!`,
      priority: 'high',
    });
  }

  // Streak-based insight
  if (context.progress.streakDays > 0) {
    insights.push({
      type: 'success',
      title: `${context.progress.streakDays} Day Streak!`,
      content: 'Consistency is key to creator success. Your dedication is paying off!',
      priority: 'medium',
    });
  }

  // Phase-specific insight
  const phaseInsights = {
    'Foundation': {
      type: 'tip' as const,
      title: 'Foundation Phase Focus',
      content: 'Focus on setting up your channel properly. A strong foundation leads to sustainable growth.',
      priority: 'high' as const,
    },
    'Growth': {
      type: 'tip' as const,
      title: 'Growth Phase Strategy',
      content: 'Time to experiment with content and find what resonates with your audience.',
      priority: 'high' as const,
    },
    'Scale': {
      type: 'recommendation' as const,
      title: 'Ready to Monetize',
      content: 'You\'re in the Scale phase! Consider exploring monetization options.',
      priority: 'high' as const,
      action: {
        label: 'View Monetization Guide',
        href: '/resources/monetization',
      },
    },
  };

  const phaseInsight = phaseInsights[context.progress.currentPhase as keyof typeof phaseInsights];
  if (phaseInsight) {
    insights.push(phaseInsight);
  }

  // Platform-specific tip
  const platformTips = {
    'youtube': 'Focus on searchable content with strong titles and thumbnails.',
    'tiktok': 'Jump on trends quickly while adding your unique twist.',
    'twitch': 'Consistency in streaming schedule builds a loyal audience.',
  };

  insights.push({
    type: 'tip',
    title: `${context.platform.charAt(0).toUpperCase() + context.platform.slice(1)} Tip`,
    content: platformTips[context.platform as keyof typeof platformTips] || 'Keep creating and stay consistent!',
    priority: 'medium',
  });

  return insights.slice(0, 4); // Return max 4 insights
}