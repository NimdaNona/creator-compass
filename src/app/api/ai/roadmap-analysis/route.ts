import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { chatCompletionStream } from '@/lib/ai/openai-service';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const roadmapAnalysisSchema = z.object({
  platform: z.string().optional(),
  niche: z.string().optional(),
  progress: z.object({
    currentPhase: z.number(),
    completedTasks: z.number(),
    totalTasks: z.number(),
    streakDays: z.number(),
    startDate: z.string().optional(),
  }),
  roadmapData: z.object({
    phases: z.array(z.object({
      id: z.number(),
      name: z.string(),
      tasks: z.number(),
    })),
    currentTasks: z.array(z.string()),
  }),
  userBehavior: z.object({
    avgTaskCompletionTime: z.number(),
    preferredWorkTime: z.string(),
    strugglingAreas: z.array(z.string()),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { platform, niche, progress, roadmapData, userBehavior } = 
      roadmapAnalysisSchema.parse(body);

    // Get user profile and roadmap data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        roadmapProgress: {
          orderBy: { updatedAt: 'desc' },
          take: 30, // Last 30 days of progress
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate task completion velocity
    const completionVelocity = calculateCompletionVelocity(user.roadmapProgress || []);
    
    // Build context for AI analysis
    const userContext = {
      platform: platform || 'general',
      niche: niche || user.profile?.niche || 'general',
      creatorLevel: user.profile?.creatorLevel || 'beginner',
      goals: user.profile?.goals || [],
      progress: {
        ...progress,
        velocity: completionVelocity,
        consistency: progress.streakDays > 7 ? 'high' : progress.streakDays > 3 ? 'medium' : 'low',
      },
      roadmapData,
      userBehavior: userBehavior || {
        avgTaskCompletionTime: 2.5,
        preferredWorkTime: 'evening',
        strugglingAreas: [],
      },
    };

    const systemPrompt = `You are an AI roadmap optimization expert for Creator Compass, specializing in helping content creators optimize their journey.

User Context:
Platform: ${userContext.platform}
Niche: ${userContext.niche}
Creator Level: ${userContext.creatorLevel}
Goals: ${userContext.goals.join(', ')}

Current Progress:
Phase: ${userContext.progress.currentPhase} of ${roadmapData.phases.length}
Tasks Completed: ${userContext.progress.completedTasks} of ${userContext.progress.totalTasks}
Streak: ${userContext.progress.streakDays} days
Velocity: ${userContext.progress.velocity} tasks/day
Consistency: ${userContext.progress.consistency}

User Behavior:
Avg Task Time: ${userContext.userBehavior.avgTaskCompletionTime} hours
Preferred Work Time: ${userContext.userBehavior.preferredWorkTime}
Struggling Areas: ${userContext.userBehavior.strugglingAreas.join(', ')}

Current Tasks:
${roadmapData.currentTasks.join('\n')}

Your task is to analyze their roadmap progress and provide:

1. Task Adjustments (array of adjustments):
   - Identify tasks that could be simplified, enhanced, rescheduled, or replaced
   - Explain the reason for each adjustment
   - Assess the impact (high/medium/low)
   - Provide specific adjusted task descriptions

2. Milestone Recommendations (array of milestones):
   - Analyze progress toward key milestones
   - Identify risk levels (on-track/at-risk/behind)
   - Provide actionable steps to reach milestones
   - Estimate realistic completion times

3. Personalized Tips (array of tips):
   - Generate tips based on user behavior and progress
   - Categorize as motivation/strategy/technical/growth
   - Make them actionable and specific
   - Link to related tasks when applicable

4. Overall Analysis:
   - Calculate overall progress percentage
   - Identify progress trend (improving/steady/declining)
   - Generate high-level recommendations
   - Estimate time to completion

Format your response as a JSON object with these keys:
{
  "adjustments": [array of task adjustments],
  "milestones": [array of milestone recommendations],
  "tips": [array of personalized tips],
  "analysis": {
    "overallProgress": number,
    "streak": number,
    "tasksCompleted": number,
    "tasksRemaining": number,
    "estimatedCompletion": string,
    "progressTrend": string,
    "recommendations": [array of strings]
  }
}`;

    const userPrompt = `Analyze my creator roadmap and provide personalized recommendations to optimize my journey. Focus on:
- Practical adjustments that match my working style
- Realistic milestones based on my progress velocity
- Tips that address my specific struggling areas
- Maintaining momentum with my ${progress.streakDays}-day streak`;

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Process AI response
    (async () => {
      try {
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userPrompt },
        ];

        const aiStream = await chatCompletionStream(messages);
        let fullResponse = '';

        for await (const chunk of aiStream) {
          if (chunk.content) {
            fullResponse += chunk.content;
          }
        }

        // Parse AI response
        try {
          const parsed = JSON.parse(fullResponse);
          
          // Send adjustments
          if (parsed.adjustments) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              adjustments: parsed.adjustments 
            })}\n\n`));
          }

          // Send milestones
          if (parsed.milestones) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              milestones: parsed.milestones 
            })}\n\n`));
          }

          // Send tips
          if (parsed.tips) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              tips: parsed.tips 
            })}\n\n`));
          }

          // Send analysis
          if (parsed.analysis) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              analysis: parsed.analysis 
            })}\n\n`));
          }

        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          
          // Send fallback data
          const fallbackData = generateFallbackRoadmapAnalysis(userContext);
          
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            adjustments: fallbackData.adjustments 
          })}\n\n`));
          
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            milestones: fallbackData.milestones 
          })}\n\n`));
          
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            tips: fallbackData.tips 
          })}\n\n`));
          
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            analysis: fallbackData.analysis 
          })}\n\n`));
        }

        await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (error) {
        console.error('Stream processing error:', error);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ 
          error: 'Failed to generate roadmap analysis' 
        })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Roadmap analysis API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateCompletionVelocity(progressHistory: any[]): number {
  if (progressHistory.length < 2) return 0;

  // Calculate average tasks completed per day over the history
  const totalDays = progressHistory.length;
  const totalTasksCompleted = progressHistory.reduce((sum, p) => sum + (p.tasksCompleted || 0), 0);
  
  return Number((totalTasksCompleted / totalDays).toFixed(2));
}

function generateFallbackRoadmapAnalysis(context: any) {
  const progressPercentage = Math.round((context.progress.completedTasks / context.progress.totalTasks) * 100);
  
  return {
    adjustments: [
      {
        taskId: '1',
        originalTask: context.roadmapData.currentTasks[0] || 'Create content calendar',
        adjustedTask: 'Create a simplified 2-week content calendar',
        reason: 'Breaking down into smaller, manageable chunks',
        impact: 'high',
        type: 'simplify',
      },
      {
        taskId: '2',
        originalTask: context.roadmapData.currentTasks[1] || 'Set up analytics',
        adjustedTask: 'Set up basic analytics tracking (just views and engagement)',
        reason: 'Focus on essential metrics first',
        impact: 'medium',
        type: 'simplify',
      },
    ],
    milestones: [
      {
        milestone: `Complete ${context.roadmapData.phases[context.progress.currentPhase - 1]?.name || 'Current'} Phase`,
        currentProgress: progressPercentage,
        recommendation: progressPercentage > 80 
          ? 'You\'re almost there! Focus on finishing the last few tasks'
          : 'Keep your momentum going with daily progress',
        actions: [
          'Complete one task per day',
          'Focus on high-impact tasks first',
          'Review and optimize your workflow',
        ],
        estimatedCompletion: progressPercentage > 80 ? '5 days' : '2 weeks',
        risk: progressPercentage > 70 ? 'on-track' : progressPercentage > 40 ? 'at-risk' : 'behind',
      },
    ],
    tips: [
      {
        title: `${context.userBehavior.preferredWorkTime} Productivity`,
        content: `Since you work best in the ${context.userBehavior.preferredWorkTime}, batch your creative tasks during this time for maximum efficiency.`,
        category: 'strategy',
        priority: 'high',
        actionable: true,
      },
      {
        title: 'Maintain Your Streak',
        content: `You're on a ${context.progress.streakDays}-day streak! Keep it going by setting a minimum daily goal.`,
        category: 'motivation',
        priority: 'high',
        actionable: true,
      },
    ],
    analysis: {
      overallProgress: progressPercentage,
      streak: context.progress.streakDays,
      tasksCompleted: context.progress.completedTasks,
      tasksRemaining: context.progress.totalTasks - context.progress.completedTasks,
      estimatedCompletion: `${Math.ceil((context.progress.totalTasks - context.progress.completedTasks) / (context.progress.velocity || 1))} days`,
      progressTrend: context.progress.velocity > 1 ? 'improving' : 'steady',
      recommendations: [
        'Focus on completing current phase before moving forward',
        `Maintain your ${context.progress.streakDays}-day streak to build momentum`,
        'Consider breaking down complex tasks into smaller steps',
      ],
    },
  };
}