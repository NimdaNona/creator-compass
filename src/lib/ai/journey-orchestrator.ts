import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Journey stages that users progress through
export enum JourneyStage {
  DISCOVERY = 'discovery',
  FOUNDATION = 'foundation',
  GROWTH = 'growth',
  SCALE = 'scale',
  MASTERY = 'mastery'
}

// Types of AI interactions
export enum InteractionType {
  GUIDANCE = 'guidance',
  SUGGESTION = 'suggestion',
  COACHING = 'coaching',
  ANALYSIS = 'analysis',
  TUTORIAL = 'tutorial',
  CELEBRATION = 'celebration'
}

interface UserContext {
  userId: string;
  profile: any;
  progress: any;
  recentTasks: any[];
  achievements: any[];
  challenges: string[];
  subscription: any;
  preferences: any;
}

interface JourneyInsight {
  stage: JourneyStage;
  currentFocus: string;
  nextSteps: NextStep[];
  recommendations: Recommendation[];
  motivationalMessage?: string;
}

interface NextStep {
  title: string;
  description: string;
  type: 'task' | 'milestone' | 'feature' | 'learning';
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
  estimatedTime?: string;
}

interface Recommendation {
  title: string;
  description: string;
  rationale: string;
  type: 'content' | 'tool' | 'strategy' | 'community';
  impact: 'high' | 'medium' | 'low';
}

export class JourneyOrchestrator {
  /**
   * Get or create user journey state
   */
  async getUserJourneyState(userId: string) {
    let journeyState = await prisma.userJourneyState.findUnique({
      where: { userId }
    });

    if (!journeyState) {
      journeyState = await prisma.userJourneyState.create({
        data: {
          userId,
          currentStage: JourneyStage.DISCOVERY,
          completedMilestones: [],
          activeGoals: [],
          aiInsights: {},
          nextSteps: [],
          guidanceFrequency: 'adaptive'
        }
      });
    }

    return journeyState;
  }

  /**
   * Aggregate user context from multiple sources
   */
  async aggregateUserContext(userId: string): Promise<UserContext> {
    const [profile, stats, progress, recentTasks, achievements, subscription, aiProfile] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.userStats.findUnique({ where: { userId } }),
      prisma.userProgress.findMany({ 
        where: { userId },
        orderBy: { completedAt: 'desc' },
        take: 10
      }),
      prisma.taskCompletion.findMany({
        where: { userId },
        include: { task: true },
        orderBy: { completedAt: 'desc' },
        take: 10
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        orderBy: { unlockedAt: 'desc' }
      }),
      prisma.userSubscription.findUnique({ where: { userId } }),
      prisma.userAIProfile.findUnique({ where: { userId } })
    ]);

    // Determine challenges based on progress
    const challenges = this.identifyUserChallenges(stats, recentTasks);

    return {
      userId,
      profile,
      progress: {
        stats,
        recentTasks: recentTasks.map(rt => rt.task),
        completionRate: this.calculateCompletionRate(recentTasks),
        momentum: this.calculateMomentum(stats)
      },
      recentTasks,
      achievements,
      challenges,
      subscription,
      preferences: aiProfile
    };
  }

  /**
   * Generate journey insights based on user context
   */
  async generateJourneyInsights(context: UserContext): Promise<JourneyInsight> {
    const journeyState = await this.getUserJourneyState(context.userId);
    const stage = this.determineJourneyStage(context);
    const currentFocus = this.determineCurrentFocus(context, stage);
    
    // Use AI to generate personalized insights
    const aiInsights = await this.generateAIInsights(context, stage, currentFocus);
    
    // Generate next steps based on stage and context
    const nextSteps = this.generateNextSteps(context, stage, currentFocus);
    
    // Generate recommendations
    const recommendations = await this.generateRecommendations(context, stage);

    // Update journey state
    await prisma.userJourneyState.update({
      where: { userId: context.userId },
      data: {
        currentStage: stage,
        currentFocus,
        nextSteps,
        aiInsights,
        lastGuidanceAt: new Date()
      }
    });

    return {
      stage,
      currentFocus,
      nextSteps,
      recommendations,
      motivationalMessage: aiInsights.motivationalMessage
    };
  }

  /**
   * Track AI interaction for learning and improvement
   */
  async trackInteraction(
    userId: string,
    type: InteractionType,
    context: any,
    interaction: any,
    userResponse?: string,
    responseData?: any
  ) {
    await prisma.aIInteraction.create({
      data: {
        userId,
        interactionType: type,
        context,
        interaction,
        userResponse,
        responseData,
        sessionId: context.sessionId || null
      }
    });
  }

  /**
   * Determine user's current journey stage
   */
  private determineJourneyStage(context: UserContext): JourneyStage {
    const { profile, progress, achievements } = context;
    
    if (!profile || progress.stats?.totalTasksCompleted === 0) {
      return JourneyStage.DISCOVERY;
    }

    const tasksCompleted = progress.stats?.totalTasksCompleted || 0;
    const daysActive = Math.floor(
      (Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Stage determination logic
    if (daysActive < 7 || tasksCompleted < 10) {
      return JourneyStage.DISCOVERY;
    } else if (daysActive < 30 || tasksCompleted < 50) {
      return JourneyStage.FOUNDATION;
    } else if (daysActive < 90 || tasksCompleted < 200) {
      return JourneyStage.GROWTH;
    } else if (achievements.length > 20) {
      return JourneyStage.MASTERY;
    } else {
      return JourneyStage.SCALE;
    }
  }

  /**
   * Determine user's current focus area
   */
  private determineCurrentFocus(context: UserContext, stage: JourneyStage): string {
    const recentCategories = context.recentTasks
      .map(task => task.task?.category)
      .filter(Boolean);

    const categoryCounts = recentCategories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantCategory = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    // Stage-specific focus determination
    switch (stage) {
      case JourneyStage.DISCOVERY:
        return 'Setting up your creator profile and exploring the platform';
      case JourneyStage.FOUNDATION:
        return dominantCategory === 'content' 
          ? 'Creating your first content pieces'
          : 'Building your channel foundation';
      case JourneyStage.GROWTH:
        return dominantCategory === 'engagement'
          ? 'Growing your audience and engagement'
          : 'Optimizing your content strategy';
      case JourneyStage.SCALE:
        return 'Scaling your content production and monetization';
      case JourneyStage.MASTERY:
        return 'Mastering advanced strategies and mentoring others';
      default:
        return 'Continuing your creator journey';
    }
  }

  /**
   * Generate next steps based on context
   */
  private generateNextSteps(
    context: UserContext, 
    stage: JourneyStage, 
    currentFocus: string
  ): NextStep[] {
    const nextSteps: NextStep[] = [];

    // Stage-specific next steps
    switch (stage) {
      case JourneyStage.DISCOVERY:
        if (!context.profile?.selectedPlatform) {
          nextSteps.push({
            title: 'Choose Your Primary Platform',
            description: 'Select the platform where you want to start your creator journey',
            type: 'milestone',
            priority: 'high',
            actionUrl: '/onboarding'
          });
        }
        nextSteps.push({
          title: 'Complete Your First Daily Task',
          description: 'Start building momentum with your first task',
          type: 'task',
          priority: 'high',
          actionUrl: '/dashboard',
          estimatedTime: '15 min'
        });
        break;

      case JourneyStage.FOUNDATION:
        nextSteps.push({
          title: 'Set Up Your Content Calendar',
          description: 'Plan your content schedule for consistent uploads',
          type: 'feature',
          priority: 'high',
          actionUrl: '/calendar',
          estimatedTime: '30 min'
        });
        if (context.progress.completionRate < 0.7) {
          nextSteps.push({
            title: 'Improve Task Completion Rate',
            description: 'Try to complete at least 70% of your daily tasks',
            type: 'milestone',
            priority: 'medium'
          });
        }
        break;

      case JourneyStage.GROWTH:
        nextSteps.push({
          title: 'Analyze Your Performance',
          description: 'Review your analytics to understand what content works best',
          type: 'feature',
          priority: 'high',
          actionUrl: '/analytics',
          estimatedTime: '20 min'
        });
        nextSteps.push({
          title: 'Engage with Your Community',
          description: 'Connect with other creators in your niche',
          type: 'learning',
          priority: 'medium',
          actionUrl: '/community'
        });
        break;

      case JourneyStage.SCALE:
      case JourneyStage.MASTERY:
        nextSteps.push({
          title: 'Optimize Your Workflow',
          description: 'Use AI tools to streamline your content creation',
          type: 'feature',
          priority: 'high',
          actionUrl: '/templates'
        });
        break;
    }

    // Add challenge-specific steps
    if (context.challenges.includes('low_engagement')) {
      nextSteps.push({
        title: 'Boost Engagement',
        description: 'Try new content formats and engagement strategies',
        type: 'learning',
        priority: 'high',
        actionUrl: '/resources?category=engagement'
      });
    }

    return nextSteps;
  }

  /**
   * Generate AI-powered insights
   */
  private async generateAIInsights(
    context: UserContext,
    stage: JourneyStage,
    currentFocus: string
  ): Promise<any> {
    try {
      const prompt = `
        As a creator growth expert, analyze this user's journey:
        
        Stage: ${stage}
        Current Focus: ${currentFocus}
        Days Active: ${context.profile ? Math.floor((Date.now() - new Date(context.profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0}
        Tasks Completed: ${context.progress.stats?.totalTasksCompleted || 0}
        Completion Rate: ${(context.progress.completionRate * 100).toFixed(0)}%
        Streak: ${context.progress.stats?.streakDays || 0} days
        Platform: ${context.profile?.selectedPlatform || 'Not selected'}
        Niche: ${context.profile?.selectedNiche || 'Not selected'}
        
        Provide:
        1. A brief motivational message (1-2 sentences)
        2. Key insight about their progress
        3. One specific tip for improvement
        
        Format as JSON with: motivationalMessage, keyInsight, improvementTip
      `;

      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('Error generating AI insights:', error);
      return {
        motivationalMessage: "Keep pushing forward! Every step counts on your creator journey.",
        keyInsight: "Consistency is key to building your audience.",
        improvementTip: "Try to maintain a regular posting schedule."
      };
    }
  }

  /**
   * Generate personalized recommendations
   */
  private async generateRecommendations(
    context: UserContext,
    stage: JourneyStage
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Platform-specific recommendations
    if (context.profile?.selectedPlatform === 'youtube') {
      recommendations.push({
        title: 'Optimize Your Thumbnails',
        description: 'Eye-catching thumbnails can increase your click-through rate by 30%',
        rationale: 'YouTube analytics show that thumbnail quality directly impacts video performance',
        type: 'strategy',
        impact: 'high'
      });
    }

    // Stage-specific recommendations
    if (stage === JourneyStage.GROWTH) {
      recommendations.push({
        title: 'Collaborate with Other Creators',
        description: 'Partner with creators in your niche to cross-promote content',
        rationale: 'Collaborations help you tap into new audiences and grow faster',
        type: 'community',
        impact: 'high'
      });
    }

    // Challenge-specific recommendations
    if (context.challenges.includes('inconsistent_posting')) {
      recommendations.push({
        title: 'Use Content Batching',
        description: 'Create multiple pieces of content in one session',
        rationale: 'Batching helps maintain consistency even during busy periods',
        type: 'strategy',
        impact: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Identify user challenges based on their data
   */
  private identifyUserChallenges(stats: any, recentTasks: any[]): string[] {
    const challenges: string[] = [];

    if (stats?.streakDays === 0) {
      challenges.push('consistency');
    }

    if (stats?.totalTasksCompleted < 10) {
      challenges.push('getting_started');
    }

    const completionRate = this.calculateCompletionRate(recentTasks);
    if (completionRate < 0.5) {
      challenges.push('low_completion');
    }

    return challenges;
  }

  /**
   * Calculate task completion rate
   */
  private calculateCompletionRate(recentTasks: any[]): number {
    if (recentTasks.length === 0) return 0;
    const completed = recentTasks.filter(t => t.completedAt).length;
    return completed / recentTasks.length;
  }

  /**
   * Calculate user momentum
   */
  private calculateMomentum(stats: any): 'increasing' | 'stable' | 'decreasing' {
    if (!stats) return 'stable';
    
    const streakDays = stats.streakDays || 0;
    const longestStreak = stats.longestStreak || 0;
    
    if (streakDays === 0) return 'decreasing';
    if (streakDays >= longestStreak * 0.8) return 'increasing';
    return 'stable';
  }
}

// Export singleton instance
export const journeyOrchestrator = new JourneyOrchestrator();