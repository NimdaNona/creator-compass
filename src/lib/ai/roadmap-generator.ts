import { chatCompletion } from './openai-service';
import { knowledgeBase } from './knowledge-base';
import { UserAIProfile, DynamicRoadmap, RoadmapPhase, DynamicTask } from './types';
import type { PrismaClient } from '@prisma/client';

type DBType = PrismaClient;

export class RoadmapGenerator {
  private dbInstance: DBType | null = null;

  // Lazy load database
  private async getDb(): Promise<DBType> {
    if (!this.dbInstance) {
      const { db } = await import('@/lib/db');
      this.dbInstance = db;
    }
    return this.dbInstance;
  }
  async generatePersonalizedRoadmap(
    userId: string,
    userProfile: UserAIProfile
  ): Promise<DynamicRoadmap> {
    // Get relevant context from knowledge base
    const context = await this.gatherContext(userProfile);
    
    // Generate roadmap phases
    const phases = await this.generatePhases(userProfile, context);
    
    // Create and save the roadmap
    const roadmap: DynamicRoadmap = {
      id: `roadmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      phases,
      customizedFor: userProfile,
      generatedAt: new Date(),
      adjustments: [],
    };

    // Save to database
    const db = await this.getDb();
    await db.dynamicRoadmap.create({
      data: {
        id: roadmap.id,
        userId,
        title: `${userProfile.contentNiche} Creator Journey`,
        description: `Personalized roadmap for a ${userProfile.creatorLevel} ${userProfile.contentNiche} creator`,
        phases: roadmap.phases,
        customizedFor: userProfile,
        isActive: true,
      },
    });

    return roadmap;
  }

  private async gatherContext(userProfile: UserAIProfile): Promise<string> {
    const queries = [
      `${userProfile.creatorLevel} ${userProfile.contentNiche} creator roadmap`,
      `equipment for ${userProfile.creatorLevel} creators budget`,
      `${userProfile.preferredPlatforms.join(' ')} growth strategies`,
      userProfile.challenges.join(' '),
    ];

    let context = '';
    for (const query of queries) {
      const relevantContext = await knowledgeBase.getRelevantContext(query, {
        platform: userProfile.preferredPlatforms[0],
        niche: userProfile.contentNiche,
        maxTokens: 500,
      });
      context += relevantContext + '\n\n';
    }

    return context;
  }

  private async generatePhases(
    userProfile: UserAIProfile,
    context: string
  ): Promise<RoadmapPhase[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are an expert content creation coach creating a personalized 90-day roadmap.
        Create 3 phases (30 days each) with specific, actionable tasks tailored to the user's profile.
        Each phase should build on the previous one and be appropriate for their level and goals.
        
        Format your response as a JSON array of phases with this structure:
        [
          {
            "phase": 1,
            "title": "Phase Title",
            "description": "Phase description",
            "duration": "30 days",
            "goals": ["goal1", "goal2"],
            "milestones": ["milestone1", "milestone2"]
          }
        ]`,
      },
      {
        role: 'user' as const,
        content: `Create a personalized roadmap for this creator:
        
        Profile:
        - Level: ${userProfile.creatorLevel}
        - Niche: ${userProfile.contentNiche}
        - Platforms: ${userProfile.preferredPlatforms.join(', ')}
        - Goals: ${userProfile.goals.join(', ')}
        - Challenges: ${userProfile.challenges.join(', ')}
        - Time Commitment: ${userProfile.timeCommitment}
        - Equipment: ${JSON.stringify(userProfile.equipment)}
        
        Context from knowledge base:
        ${context}
        
        Create 3 phases that address their specific needs and challenges.`,
      },
    ];

    const response = await chatCompletion(messages, {
      temperature: 0.7,
      maxTokens: 2000,
    });

    try {
      const phases = JSON.parse(response.content);
      
      // Generate tasks for each phase
      const phasesWithTasks = await Promise.all(
        phases.map(async (phase: any) => ({
          ...phase,
          tasks: await this.generateTasksForPhase(phase, userProfile),
        }))
      );

      return phasesWithTasks;
    } catch (error) {
      console.error('Failed to parse phases:', error);
      return this.getDefaultPhases(userProfile);
    }
  }

  private async generateTasksForPhase(
    phase: any,
    userProfile: UserAIProfile
  ): Promise<DynamicTask[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are creating specific daily tasks for a content creator's roadmap phase.
        Generate 20-30 tasks spread across 4 weeks (5-8 tasks per week).
        Tasks should be specific, actionable, and appropriate for the creator's level.
        
        Format as JSON array:
        [
          {
            "title": "Task title",
            "description": "Detailed description",
            "difficulty": "easy|medium|hard",
            "timeEstimate": 30,
            "category": "content|technical|community|analytics|monetization",
            "rationale": "Why this task is important",
            "tips": ["tip1", "tip2"],
            "resources": ["resource1", "resource2"]
          }
        ]`,
      },
      {
        role: 'user' as const,
        content: `Generate tasks for Phase ${phase.phase}: ${phase.title}
        
        Phase Goals: ${phase.goals.join(', ')}
        Creator Level: ${userProfile.creatorLevel}
        Platform: ${userProfile.preferredPlatforms[0]}
        Niche: ${userProfile.contentNiche}
        
        Create varied tasks that progressively build skills and achieve the phase goals.`,
      },
    ];

    const response = await chatCompletion(messages, {
      temperature: 0.8,
      maxTokens: 3000,
    });

    try {
      const tasks = JSON.parse(response.content);
      return tasks.map((task: any, index: number) => ({
        id: `task_${phase.phase}_${index}`,
        ...task,
        personalized: true,
        aiGenerated: true,
      }));
    } catch (error) {
      console.error('Failed to parse tasks:', error);
      return this.getDefaultTasks(phase.phase);
    }
  }

  private getDefaultPhases(userProfile: UserAIProfile): RoadmapPhase[] {
    // Fallback phases if AI generation fails
    return [
      {
        phase: 1,
        title: 'Foundation & Setup',
        description: 'Establish your creator foundation and basic content production',
        duration: '30 days',
        goals: [
          'Set up professional profiles',
          'Create first 10 pieces of content',
          'Establish posting schedule',
        ],
        tasks: this.getDefaultTasks(1),
        milestones: ['First video published', 'Profile optimization complete'],
      },
      {
        phase: 2,
        title: 'Growth & Optimization',
        description: 'Optimize content and grow your audience',
        duration: '30 days',
        goals: [
          'Double content output',
          'Implement SEO strategies',
          'Engage with community',
        ],
        tasks: this.getDefaultTasks(2),
        milestones: ['100 followers reached', 'First viral content'],
      },
      {
        phase: 3,
        title: 'Monetization & Scale',
        description: 'Begin monetization and scale your content business',
        duration: '30 days',
        goals: [
          'Apply for monetization programs',
          'Launch first product/service',
          'Build email list',
        ],
        tasks: this.getDefaultTasks(3),
        milestones: ['First revenue earned', 'Email list started'],
      },
    ];
  }

  private getDefaultTasks(phase: number): DynamicTask[] {
    // Basic task templates
    const taskTemplates = {
      1: [
        {
          title: 'Set up creator profile',
          category: 'technical',
          difficulty: 'easy' as const,
        },
        {
          title: 'Create channel banner',
          category: 'content',
          difficulty: 'medium' as const,
        },
      ],
      2: [
        {
          title: 'Analyze top performers',
          category: 'analytics',
          difficulty: 'medium' as const,
        },
        {
          title: 'Optimize posting times',
          category: 'analytics',
          difficulty: 'easy' as const,
        },
      ],
      3: [
        {
          title: 'Apply for partner program',
          category: 'monetization',
          difficulty: 'medium' as const,
        },
        {
          title: 'Create lead magnet',
          category: 'monetization',
          difficulty: 'hard' as const,
        },
      ],
    };

    return (taskTemplates[phase as keyof typeof taskTemplates] || []).map((template, index) => ({
      id: `default_task_${phase}_${index}`,
      title: template.title,
      description: `Complete ${template.title} for your content creation journey`,
      personalized: false,
      difficulty: template.difficulty,
      timeEstimate: 60,
      category: template.category,
      aiGenerated: false,
    }));
  }

  async adjustRoadmap(
    roadmapId: string,
    userId: string,
    reason: string,
    adjustmentType: 'accelerate' | 'slow-down' | 'pivot'
  ): Promise<DynamicRoadmap> {
    const db = await this.getDb();
    const roadmap = await db.dynamicRoadmap.findFirst({
      where: { id: roadmapId, userId },
    });

    if (!roadmap) {
      throw new Error('Roadmap not found');
    }

    // Generate adjustment recommendations
    const adjustments = await this.generateAdjustments(
      roadmap,
      reason,
      adjustmentType
    );

    // Update roadmap
    const updatedRoadmap = await db.dynamicRoadmap.update({
      where: { id: roadmapId },
      data: {
        phases: adjustments.phases,
        adjustments: [
          ...(roadmap.adjustments as any[]),
          {
            date: new Date(),
            reason,
            changes: adjustments.changes,
            impact: adjustments.impact,
          },
        ],
      },
    });

    return {
      id: updatedRoadmap.id,
      userId: updatedRoadmap.userId,
      phases: updatedRoadmap.phases as RoadmapPhase[],
      customizedFor: updatedRoadmap.customizedFor as UserAIProfile,
      generatedAt: updatedRoadmap.generatedAt,
      adjustments: updatedRoadmap.adjustments as any[],
    };
  }

  private async generateAdjustments(
    roadmap: any,
    reason: string,
    adjustmentType: string
  ): Promise<{
    phases: RoadmapPhase[];
    changes: string[];
    impact: 'minor' | 'moderate' | 'major';
  }> {
    const messages = [
      {
        role: 'system' as const,
        content: `You are adjusting a creator's roadmap based on their progress and needs.
        Make appropriate adjustments while maintaining the overall journey structure.`,
      },
      {
        role: 'user' as const,
        content: `Adjust this roadmap:
        
        Current phases: ${JSON.stringify(roadmap.phases, null, 2)}
        Reason for adjustment: ${reason}
        Adjustment type: ${adjustmentType}
        
        Provide updated phases and list the specific changes made.`,
      },
    ];

    const response = await chatCompletion(messages, {
      temperature: 0.6,
      maxTokens: 2000,
    });

    // Parse and return adjustments
    try {
      const result = JSON.parse(response.content);
      return {
        phases: result.phases || roadmap.phases,
        changes: result.changes || ['Roadmap adjusted based on progress'],
        impact: result.impact || 'moderate',
      };
    } catch (error) {
      console.error('Failed to parse adjustments:', error);
      return {
        phases: roadmap.phases as RoadmapPhase[],
        changes: ['Minor adjustments made'],
        impact: 'minor',
      };
    }
  }
}

// Export singleton instance
export const roadmapGenerator = new RoadmapGenerator();