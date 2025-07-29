import { prisma } from '@/lib/db';
import { aiPersonality } from './personality-service';
import { conversationMemory } from './conversation-memory';
import { createOpenAIClient } from './openai-client';

export interface ProactiveTrigger {
  id: string;
  type: 'milestone' | 'inactivity' | 'pattern' | 'context' | 'achievement';
  condition: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  message?: string;
  action?: string;
}

export interface ProactiveSuggestion {
  id: string;
  userId: string;
  triggerId: string;
  message: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
  expiresAt?: Date;
  dismissedAt?: Date;
  createdAt: Date;
}

export class ProactiveAssistanceService {
  private triggers: ProactiveTrigger[] = [
    // Milestone triggers
    {
      id: 'first-week-complete',
      type: 'milestone',
      condition: { daysActive: 7 },
      priority: 'high',
      message: 'Congratulations on your first week! Time to review your progress.'
    },
    {
      id: 'streak-milestone',
      type: 'milestone',
      condition: { streakDays: [3, 7, 14, 30, 60, 90] },
      priority: 'medium',
      message: 'Amazing streak! Keep the momentum going.'
    },
    {
      id: 'tasks-completed',
      type: 'milestone',
      condition: { tasksCompleted: [10, 25, 50, 100] },
      priority: 'medium',
      message: 'Milestone reached! You\'re making great progress.'
    },

    // Inactivity triggers
    {
      id: 'inactive-2-days',
      type: 'inactivity',
      condition: { daysInactive: 2 },
      priority: 'medium',
      message: 'We noticed you\'ve been away. Need help getting back on track?'
    },
    {
      id: 'inactive-week',
      type: 'inactivity',
      condition: { daysInactive: 7 },
      priority: 'high',
      message: 'It\'s been a week! Your creator journey is waiting for you.'
    },

    // Pattern triggers
    {
      id: 'consistent-morning-user',
      type: 'pattern',
      condition: { activityPattern: 'morning', consecutiveDays: 5 },
      priority: 'low',
      message: 'You\'re a morning creator! Here\'s your daily motivation.'
    },
    {
      id: 'weekend-warrior',
      type: 'pattern',
      condition: { activityPattern: 'weekend', consecutiveWeeks: 2 },
      priority: 'low',
      message: 'Weekend productivity mode activated! Let\'s make it count.'
    },

    // Context triggers
    {
      id: 'stuck-on-stage',
      type: 'context',
      condition: { stageProgress: { below: 30, daysInStage: 14 } },
      priority: 'high',
      message: 'Looks like you might be stuck. Let me help you move forward.'
    },
    {
      id: 'approaching-deadline',
      type: 'context',
      condition: { deadlineDays: [7, 3, 1] },
      priority: 'high',
      message: 'Deadline approaching! Let\'s prioritize your tasks.'
    },

    // Achievement triggers
    {
      id: 'near-achievement',
      type: 'achievement',
      condition: { progressPercentage: 80 },
      priority: 'medium',
      message: 'You\'re so close to unlocking a new achievement!'
    }
  ];

  async checkTriggers(userId: string): Promise<ProactiveSuggestion[]> {
    const suggestions: ProactiveSuggestion[] = [];
    
    // Get user context
    const context = await this.getUserContext(userId);
    
    // Check each trigger
    for (const trigger of this.triggers) {
      if (await this.evaluateTrigger(trigger, context)) {
        const suggestion = await this.createSuggestion(userId, trigger, context);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }
    
    return suggestions;
  }

  private async getUserContext(userId: string) {
    const [user, stats, journeyState, recentActivity] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          subscription: true
        }
      }),
      prisma.userStats.findUnique({
        where: { userId }
      }),
      prisma.userJourneyState.findUnique({
        where: { userId }
      }),
      this.getRecentActivity(userId)
    ]);

    return {
      user,
      stats,
      journeyState,
      recentActivity,
      currentDate: new Date()
    };
  }

  private async getRecentActivity(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [interactions, tasks] = await Promise.all([
      prisma.aIInteraction.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      prisma.taskProgress.findMany({
        where: {
          userId,
          updatedAt: { gte: thirtyDaysAgo }
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
      })
    ]);

    return { interactions, tasks };
  }

  private async evaluateTrigger(
    trigger: ProactiveTrigger, 
    context: any
  ): Promise<boolean> {
    switch (trigger.type) {
      case 'milestone':
        return this.evaluateMilestoneTrigger(trigger, context);
      case 'inactivity':
        return this.evaluateInactivityTrigger(trigger, context);
      case 'pattern':
        return this.evaluatePatternTrigger(trigger, context);
      case 'context':
        return this.evaluateContextTrigger(trigger, context);
      case 'achievement':
        return this.evaluateAchievementTrigger(trigger, context);
      default:
        return false;
    }
  }

  private evaluateMilestoneTrigger(trigger: ProactiveTrigger, context: any): boolean {
    const { stats } = context;
    
    if (trigger.condition.daysActive) {
      const daysActive = Math.floor(
        (Date.now() - new Date(context.user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysActive === trigger.condition.daysActive;
    }
    
    if (trigger.condition.streakDays && Array.isArray(trigger.condition.streakDays)) {
      return trigger.condition.streakDays.includes(stats?.streakDays || 0);
    }
    
    if (trigger.condition.tasksCompleted && Array.isArray(trigger.condition.tasksCompleted)) {
      return trigger.condition.tasksCompleted.includes(stats?.totalTasksCompleted || 0);
    }
    
    return false;
  }

  private evaluateInactivityTrigger(trigger: ProactiveTrigger, context: any): boolean {
    const lastActivity = context.recentActivity.interactions[0]?.createdAt || 
                        context.recentActivity.tasks[0]?.updatedAt;
    
    if (!lastActivity) return false;
    
    const daysInactive = Math.floor(
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysInactive === trigger.condition.daysInactive;
  }

  private evaluatePatternTrigger(trigger: ProactiveTrigger, context: any): boolean {
    // Analyze activity patterns
    const activityHours = context.recentActivity.interactions.map(i => 
      new Date(i.createdAt).getHours()
    );
    
    if (trigger.condition.activityPattern === 'morning') {
      const morningActivity = activityHours.filter(h => h >= 5 && h < 12).length;
      return morningActivity > activityHours.length * 0.6;
    }
    
    if (trigger.condition.activityPattern === 'weekend') {
      const weekendActivity = context.recentActivity.interactions.filter(i => {
        const day = new Date(i.createdAt).getDay();
        return day === 0 || day === 6;
      }).length;
      return weekendActivity > context.recentActivity.interactions.length * 0.4;
    }
    
    return false;
  }

  private evaluateContextTrigger(trigger: ProactiveTrigger, context: any): boolean {
    if (trigger.condition.stageProgress) {
      const progress = context.journeyState?.stageProgress || 0;
      const daysInStage = Math.floor(
        (Date.now() - new Date(context.journeyState?.stageStartedAt || Date.now()).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      
      return progress < trigger.condition.stageProgress.below && 
             daysInStage >= trigger.condition.stageProgress.daysInStage;
    }
    
    return false;
  }

  private evaluateAchievementTrigger(trigger: ProactiveTrigger, context: any): boolean {
    // Check achievements close to completion
    // This would need to be implemented based on your achievement system
    return false;
  }

  private async createSuggestion(
    userId: string, 
    trigger: ProactiveTrigger,
    context: any
  ): Promise<ProactiveSuggestion | null> {
    // Check if this suggestion was already created recently
    const recentSuggestion = await prisma.aIProactiveSuggestion.findFirst({
      where: {
        userId,
        triggerId: trigger.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
        }
      }
    });

    if (recentSuggestion) return null;

    // Generate personalized message
    const personalizedMessage = await this.generatePersonalizedMessage(
      trigger,
      context
    );

    // Create suggestion in database
    const suggestion = await prisma.aIProactiveSuggestion.create({
      data: {
        userId,
        triggerId: trigger.id,
        triggerType: trigger.type,
        message: personalizedMessage,
        priority: trigger.priority,
        actionUrl: this.determineActionUrl(trigger, context),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        metadata: {
          triggerCondition: trigger.condition,
          userContext: {
            streakDays: context.stats?.streakDays,
            currentStage: context.journeyState?.currentStage,
            platform: context.user?.profile?.selectedPlatform
          }
        }
      }
    });

    return {
      id: suggestion.id,
      userId: suggestion.userId,
      triggerId: suggestion.triggerId,
      message: suggestion.message,
      actionUrl: suggestion.actionUrl || undefined,
      priority: suggestion.priority as 'low' | 'medium' | 'high',
      expiresAt: suggestion.expiresAt || undefined,
      dismissedAt: suggestion.dismissedAt || undefined,
      createdAt: suggestion.createdAt
    };
  }

  private async generatePersonalizedMessage(
    trigger: ProactiveTrigger,
    context: any
  ): Promise<string> {
    const personality = await aiPersonality.getPersonalityProfile(context.user.id);
    const openai = createOpenAIClient();
    
    const prompt = `Generate a personalized proactive assistance message:
    
Trigger: ${trigger.type} - ${trigger.id}
Base Message: ${trigger.message}
User Context:
- Name: ${context.user.name || 'Creator'}
- Platform: ${context.user.profile?.selectedPlatform || 'Not selected'}
- Current Stage: ${context.journeyState?.currentStage || 'discovery'}
- Streak Days: ${context.stats?.streakDays || 0}
- Total Tasks: ${context.stats?.totalTasksCompleted || 0}

AI Personality: ${personality.type}
Personality Traits: ${personality.traits.join(', ')}

Generate a brief, personalized message that:
1. Matches the AI personality type
2. Is encouraging and actionable
3. References the specific context
4. Includes a clear call to action
5. Is under 2 sentences`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant for content creators.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 100
      });

      return response.choices[0].message.content || trigger.message || 'I have a suggestion for you!';
    } catch (error) {
      console.error('Failed to generate personalized message:', error);
      return trigger.message || 'I have a suggestion for you!';
    }
  }

  private determineActionUrl(trigger: ProactiveTrigger, context: any): string | null {
    switch (trigger.type) {
      case 'milestone':
        return '/achievements';
      case 'inactivity':
        return '/dashboard';
      case 'pattern':
        return '/roadmap';
      case 'context':
        if (trigger.id === 'stuck-on-stage') {
          return `/roadmap?stage=${context.journeyState?.currentStage}`;
        }
        return '/roadmap';
      case 'achievement':
        return '/achievements';
      default:
        return null;
    }
  }

  async dismissSuggestion(suggestionId: string, userId: string): Promise<void> {
    await prisma.aIProactiveSuggestion.update({
      where: { 
        id: suggestionId,
        userId // Ensure user owns the suggestion
      },
      data: { 
        dismissedAt: new Date() 
      }
    });
  }

  async getActiveSuggestions(userId: string): Promise<ProactiveSuggestion[]> {
    const suggestions = await prisma.aIProactiveSuggestion.findMany({
      where: {
        userId,
        dismissedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 5 // Limit to top 5 suggestions
    });

    return suggestions.map(s => ({
      id: s.id,
      userId: s.userId,
      triggerId: s.triggerId,
      message: s.message,
      actionUrl: s.actionUrl || undefined,
      priority: s.priority as 'low' | 'medium' | 'high',
      expiresAt: s.expiresAt || undefined,
      dismissedAt: s.dismissedAt || undefined,
      createdAt: s.createdAt
    }));
  }
}

export const proactiveAssistance = new ProactiveAssistanceService();