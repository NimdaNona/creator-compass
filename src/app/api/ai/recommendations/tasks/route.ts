import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { journeyOrchestrator } from '@/lib/ai/journey-orchestrator';
import { prisma } from '@/lib/db';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DynamicTask {
  id: string;
  title: string;
  description: string;
  category: 'content' | 'engagement' | 'optimization' | 'growth';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  impact: 'high' | 'medium' | 'low';
  reason: string;
  actionUrl?: string;
  prerequisites?: string[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get user context
    const context = await journeyOrchestrator.aggregateUserContext(userId);
    
    // Get recent task completions
    const recentCompletions = await prisma.taskCompletion.findMany({
      where: { userId },
      include: { task: true },
      orderBy: { completedAt: 'desc' },
      take: 20
    });

    // Get user's current roadmap tasks
    const currentTasks = await prisma.task.findMany({
      where: {
        platformId: context.profile?.selectedPlatform || 'youtube',
        week: context.profile?.currentWeek || 1,
      },
      take: 10
    });

    // Analyze patterns and generate recommendations
    const taskRecommendations = await generateTaskRecommendations(
      context,
      recentCompletions,
      currentTasks
    );

    return NextResponse.json({
      tasks: taskRecommendations.tasks,
      focusArea: taskRecommendations.focusArea,
      reasoning: taskRecommendations.reasoning
    });
  } catch (error) {
    console.error('Error generating task recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

async function generateTaskRecommendations(
  context: any,
  recentCompletions: any[],
  currentTasks: any[]
): Promise<{ tasks: DynamicTask[], focusArea: string, reasoning: string }> {
  // Analyze user patterns
  const completionRate = calculateCompletionRate(recentCompletions, context);
  const preferredCategories = analyzePreferredCategories(recentCompletions);
  const timeOfDayPattern = analyzeTimePattern(recentCompletions);
  
  // Determine current challenges
  const challenges = identifyCurrentChallenges(context, completionRate);
  
  // Use AI to generate personalized recommendations
  try {
    const prompt = `
      As a creator growth expert, analyze this user's data and recommend 3-5 personalized tasks:
      
      User Context:
      - Platform: ${context.profile?.selectedPlatform || 'Not selected'}
      - Niche: ${context.profile?.selectedNiche || 'Not selected'}
      - Days Active: ${context.profile ? Math.floor((Date.now() - new Date(context.profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
      - Total Tasks Completed: ${context.progress.stats?.totalTasksCompleted || 0}
      - Current Streak: ${context.progress.stats?.streakDays || 0} days
      - Completion Rate: ${(completionRate * 100).toFixed(0)}%
      - Preferred Categories: ${preferredCategories.join(', ')}
      - Most Active Time: ${timeOfDayPattern}
      - Current Challenges: ${challenges.join(', ')}
      
      Current Week Tasks: ${currentTasks.map(t => t.title).join(', ')}
      
      Generate task recommendations that:
      1. Address their specific challenges
      2. Build on their strengths
      3. Are actionable and specific
      4. Vary in difficulty and time commitment
      5. Focus on high-impact activities for their current stage
      
      Return as JSON with:
      {
        "focusArea": "Brief description of what they should focus on",
        "reasoning": "Why these specific tasks were chosen",
        "tasks": [
          {
            "id": "unique-id",
            "title": "Task title",
            "description": "Clear description",
            "category": "content|engagement|optimization|growth",
            "difficulty": "easy|medium|hard",
            "estimatedTime": "15 min|30 min|1 hour|2 hours",
            "impact": "high|medium|low",
            "reason": "Why this task specifically helps them",
            "actionUrl": "/path/to/action (optional)",
            "prerequisites": ["prerequisite1", "prerequisite2"] (optional)
          }
        ]
      }
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const recommendations = JSON.parse(response.choices[0].message.content || '{}');
    
    // Add action URLs based on task categories
    recommendations.tasks = recommendations.tasks.map((task: DynamicTask) => {
      if (!task.actionUrl) {
        switch (task.category) {
          case 'content':
            task.actionUrl = '/templates';
            break;
          case 'engagement':
            task.actionUrl = '/community';
            break;
          case 'optimization':
            task.actionUrl = '/analytics';
            break;
          case 'growth':
            task.actionUrl = '/resources';
            break;
        }
      }
      return task;
    });

    return recommendations;
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    
    // Fallback recommendations
    return generateFallbackRecommendations(context, challenges);
  }
}

function calculateCompletionRate(recentCompletions: any[], context: any): number {
  if (recentCompletions.length === 0) return 0;
  
  const daysActive = context.profile ? 
    Math.floor((Date.now() - new Date(context.profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 1;
  
  const expectedTasks = Math.min(daysActive * 3, 60); // Assume 3 tasks per day average
  const completedTasks = recentCompletions.length;
  
  return Math.min(completedTasks / expectedTasks, 1);
}

function analyzePreferredCategories(recentCompletions: any[]): string[] {
  const categoryCounts: Record<string, number> = {};
  
  recentCompletions.forEach(completion => {
    const category = completion.task?.category || 'general';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  return Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);
}

function analyzeTimePattern(recentCompletions: any[]): string {
  if (recentCompletions.length === 0) return 'No pattern yet';
  
  const hours = recentCompletions
    .map(c => new Date(c.completedAt).getHours())
    .filter(h => !isNaN(h));
  
  if (hours.length === 0) return 'No pattern yet';
  
  const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);
  
  if (avgHour < 6) return 'Early morning (before 6 AM)';
  if (avgHour < 12) return 'Morning (6 AM - 12 PM)';
  if (avgHour < 17) return 'Afternoon (12 PM - 5 PM)';
  if (avgHour < 21) return 'Evening (5 PM - 9 PM)';
  return 'Night (after 9 PM)';
}

function identifyCurrentChallenges(context: any, completionRate: number): string[] {
  const challenges: string[] = [];
  
  if (completionRate < 0.3) {
    challenges.push('low_completion_rate');
  }
  
  if (context.progress.stats?.streakDays === 0) {
    challenges.push('consistency');
  }
  
  if (context.progress.stats?.totalTasksCompleted < 5) {
    challenges.push('getting_started');
  }
  
  if (!context.profile?.selectedPlatform) {
    challenges.push('platform_not_selected');
  }
  
  return challenges;
}

function generateFallbackRecommendations(
  context: any,
  challenges: string[]
): { tasks: DynamicTask[], focusArea: string, reasoning: string } {
  const tasks: DynamicTask[] = [];
  let focusArea = 'Building your creator foundation';
  let reasoning = 'These tasks will help you establish a strong foundation for your creator journey.';

  if (challenges.includes('getting_started')) {
    focusArea = 'Getting started with your creator journey';
    reasoning = 'Let\'s start with some easy wins to build momentum!';
    
    tasks.push({
      id: 'complete-profile',
      title: 'Complete Your Creator Profile',
      description: 'Fill out your profile to unlock personalized recommendations',
      category: 'content',
      difficulty: 'easy',
      estimatedTime: '5 min',
      impact: 'high',
      reason: 'A complete profile helps us give you better recommendations',
      actionUrl: '/settings/profile'
    });
  }

  if (challenges.includes('consistency')) {
    tasks.push({
      id: 'daily-habit',
      title: 'Start a Daily Content Habit',
      description: 'Commit to creating one piece of content today, no matter how small',
      category: 'content',
      difficulty: 'easy',
      estimatedTime: '30 min',
      impact: 'high',
      reason: 'Building consistency is the #1 predictor of creator success'
    });
  }

  // Add platform-specific starter task
  if (context.profile?.selectedPlatform === 'youtube') {
    tasks.push({
      id: 'youtube-thumbnail',
      title: 'Design an Eye-Catching Thumbnail',
      description: 'Create a thumbnail that stands out in search results',
      category: 'optimization',
      difficulty: 'medium',
      estimatedTime: '45 min',
      impact: 'high',
      reason: 'Thumbnails can increase your click-through rate by up to 30%',
      actionUrl: '/templates?category=thumbnails'
    });
  } else if (context.profile?.selectedPlatform === 'tiktok') {
    tasks.push({
      id: 'tiktok-trend',
      title: 'Jump on a Trending Sound',
      description: 'Find a trending sound in your niche and create content around it',
      category: 'growth',
      difficulty: 'easy',
      estimatedTime: '30 min',
      impact: 'high',
      reason: 'Trending sounds can give you 10x more reach on TikTok',
      actionUrl: '/platform-tools/tiktok'
    });
  }

  // Always include a community task
  tasks.push({
    id: 'engage-community',
    title: 'Connect with Your Audience',
    description: 'Reply to at least 5 comments on your recent content',
    category: 'engagement',
    difficulty: 'easy',
    estimatedTime: '15 min',
    impact: 'medium',
    reason: 'Engagement signals boost your content in the algorithm'
  });

  return { tasks, focusArea, reasoning };
}