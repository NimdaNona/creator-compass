import { prisma } from '@/lib/db';
import { xpSystem } from './xp-system';
import { createOpenAIClient } from '@/lib/ai/openai-client';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'special';
  category: 'content' | 'engagement' | 'learning' | 'community';
  difficulty: 'easy' | 'medium' | 'hard';
  requirements: ChallengeRequirement[];
  rewards: ChallengeReward[];
  expiresAt: Date;
  metadata?: Record<string, any>;
}

export interface ChallengeRequirement {
  type: 'task' | 'metric' | 'action' | 'time';
  target: string;
  count: number;
  description: string;
}

export interface ChallengeReward {
  type: 'xp' | 'badge' | 'feature' | 'template';
  value: string | number;
  description: string;
}

export interface UserChallenge {
  challengeId: string;
  userId: string;
  status: 'active' | 'completed' | 'expired' | 'abandoned';
  progress: number;
  completedAt?: Date;
  claimedAt?: Date;
}

export class DailyChallengeSystem {
  private readonly CHALLENGE_TEMPLATES = {
    daily: {
      easy: [
        {
          title: 'Morning Motivation',
          description: 'Start your day right by completing 3 tasks',
          requirements: [{ type: 'task', target: 'complete', count: 3, description: 'Complete 3 tasks' }],
          rewards: [{ type: 'xp', value: 100, description: '100 XP' }]
        },
        {
          title: 'Content Creator',
          description: 'Create and schedule 1 piece of content',
          requirements: [{ type: 'action', target: 'schedule-content', count: 1, description: 'Schedule 1 content' }],
          rewards: [{ type: 'xp', value: 150, description: '150 XP' }]
        },
        {
          title: 'AI Explorer',
          description: 'Have 5 meaningful conversations with your AI assistant',
          requirements: [{ type: 'action', target: 'ai-interaction', count: 5, description: '5 AI interactions' }],
          rewards: [{ type: 'xp', value: 75, description: '75 XP' }]
        }
      ],
      medium: [
        {
          title: 'Productivity Burst',
          description: 'Complete 5 tasks and create 2 templates',
          requirements: [
            { type: 'task', target: 'complete', count: 5, description: 'Complete 5 tasks' },
            { type: 'action', target: 'create-template', count: 2, description: 'Create 2 templates' }
          ],
          rewards: [
            { type: 'xp', value: 300, description: '300 XP' },
            { type: 'badge', value: 'productive-day', description: 'Productive Day badge' }
          ]
        },
        {
          title: 'Learning Journey',
          description: 'Read 2 guides and complete a tutorial',
          requirements: [
            { type: 'action', target: 'read-guide', count: 2, description: 'Read 2 guides' },
            { type: 'action', target: 'complete-tutorial', count: 1, description: 'Complete 1 tutorial' }
          ],
          rewards: [{ type: 'xp', value: 250, description: '250 XP' }]
        }
      ],
      hard: [
        {
          title: 'Content Marathon',
          description: 'Create, schedule, and publish 3 pieces of content',
          requirements: [
            { type: 'action', target: 'create-content', count: 3, description: 'Create 3 contents' },
            { type: 'action', target: 'schedule-content', count: 3, description: 'Schedule 3 contents' },
            { type: 'action', target: 'publish-content', count: 1, description: 'Publish 1 content' }
          ],
          rewards: [
            { type: 'xp', value: 500, description: '500 XP' },
            { type: 'feature', value: 'premium-template', description: 'Unlock premium template' }
          ]
        }
      ]
    },
    weekly: {
      medium: [
        {
          title: 'Consistency Champion',
          description: 'Maintain a 7-day streak',
          requirements: [{ type: 'metric', target: 'streak', count: 7, description: '7-day streak' }],
          rewards: [
            { type: 'xp', value: 1000, description: '1000 XP' },
            { type: 'badge', value: 'week-warrior', description: 'Week Warrior badge' }
          ]
        },
        {
          title: 'Community Builder',
          description: 'Help 3 creators and share 5 achievements',
          requirements: [
            { type: 'action', target: 'help-creator', count: 3, description: 'Help 3 creators' },
            { type: 'action', target: 'share-achievement', count: 5, description: 'Share 5 achievements' }
          ],
          rewards: [
            { type: 'xp', value: 750, description: '750 XP' },
            { type: 'badge', value: 'community-hero', description: 'Community Hero badge' }
          ]
        }
      ]
    }
  };

  async generateDailyChallenges(userId: string): Promise<Challenge[]> {
    // Get user profile and stats
    const [userProfile, userStats, recentChallenges] = await Promise.all([
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.userStats.findUnique({ where: { userId } }),
      this.getRecentChallenges(userId, 7)
    ]);

    const level = await xpSystem.getUserLevel(userId);
    
    // Generate personalized challenges based on user data
    const challenges: Challenge[] = [];
    
    // Always include one easy challenge
    const easyChallenge = await this.personalizeChallenge(
      this.selectChallenge('daily', 'easy', recentChallenges),
      userProfile,
      'easy'
    );
    challenges.push(easyChallenge);

    // Add medium challenge for level 2+
    if (level.level >= 2) {
      const mediumChallenge = await this.personalizeChallenge(
        this.selectChallenge('daily', 'medium', recentChallenges),
        userProfile,
        'medium'
      );
      challenges.push(mediumChallenge);
    }

    // Add hard challenge for level 5+
    if (level.level >= 5) {
      const hardChallenge = await this.personalizeChallenge(
        this.selectChallenge('daily', 'hard', recentChallenges),
        userProfile,
        'hard'
      );
      challenges.push(hardChallenge);
    }

    // Store challenges in database
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    for (const challenge of challenges) {
      await prisma.dailyChallenge.create({
        data: {
          challengeId: challenge.id,
          userId,
          type: challenge.type,
          title: challenge.title,
          description: challenge.description,
          category: challenge.category,
          difficulty: challenge.difficulty,
          requirements: challenge.requirements,
          rewards: challenge.rewards,
          expiresAt: tomorrow,
          status: 'active',
          progress: 0,
          metadata: challenge.metadata
        }
      });
    }

    return challenges;
  }

  private selectChallenge(
    type: 'daily' | 'weekly',
    difficulty: 'easy' | 'medium' | 'hard',
    recentChallenges: any[]
  ): any {
    const templates = this.CHALLENGE_TEMPLATES[type][difficulty] || [];
    
    // Filter out recently used challenges
    const recentIds = recentChallenges.map(c => c.metadata?.templateId);
    const available = templates.filter((t, index) => 
      !recentIds.includes(`${type}-${difficulty}-${index}`)
    );

    // If all have been used recently, just pick randomly
    const pool = available.length > 0 ? available : templates;
    return {
      ...pool[Math.floor(Math.random() * pool.length)],
      templateId: `${type}-${difficulty}-${Math.floor(Math.random() * pool.length)}`
    };
  }

  private async personalizeChallenge(
    template: any,
    userProfile: any,
    difficulty: string
  ): Promise<Challenge> {
    const openai = createOpenAIClient();
    
    // Generate personalized title and description
    const prompt = `Personalize this challenge for a ${userProfile?.selectedPlatform || 'content'} creator:
Template: ${template.title} - ${template.description}
Platform: ${userProfile?.selectedPlatform || 'Any'}
Niche: ${userProfile?.selectedNiche || 'General'}
Difficulty: ${difficulty}

Generate a personalized title and description that:
1. Relates to their platform and niche
2. Maintains the same requirements
3. Feels engaging and achievable
4. Uses encouraging language

Format as JSON: { "title": "", "description": "" }`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that personalizes challenges for content creators.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      });

      const personalized = JSON.parse(response.choices[0].message.content || '{}');

      return {
        id: `daily-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: personalized.title || template.title,
        description: personalized.description || template.description,
        type: 'daily',
        category: this.determineCategory(template.requirements),
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        requirements: template.requirements,
        rewards: template.rewards,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: {
          templateId: template.templateId,
          personalized: true,
          platform: userProfile?.selectedPlatform,
          niche: userProfile?.selectedNiche
        }
      };
    } catch (error) {
      // Fallback to template if personalization fails
      return {
        id: `daily-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: template.title,
        description: template.description,
        type: 'daily',
        category: this.determineCategory(template.requirements),
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        requirements: template.requirements,
        rewards: template.rewards,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: { templateId: template.templateId }
      };
    }
  }

  private determineCategory(requirements: ChallengeRequirement[]): Challenge['category'] {
    const categories = requirements.map(req => {
      if (req.target.includes('content') || req.target.includes('publish')) return 'content';
      if (req.target.includes('ai') || req.target.includes('guide')) return 'learning';
      if (req.target.includes('help') || req.target.includes('share')) return 'community';
      return 'engagement';
    });

    // Return most common category
    const counts = categories.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)[0][0] as Challenge['category'];
  }

  async updateChallengeProgress(
    userId: string,
    actionType: string,
    increment: number = 1
  ): Promise<void> {
    // Get active challenges
    const activeChallenges = await prisma.dailyChallenge.findMany({
      where: {
        userId,
        status: 'active',
        expiresAt: { gt: new Date() }
      }
    });

    for (const challenge of activeChallenges) {
      const requirements = challenge.requirements as ChallengeRequirement[];
      let updated = false;
      let totalProgress = 0;
      let completedRequirements = 0;

      // Check each requirement
      for (const req of requirements) {
        if (req.target === actionType || 
            (req.type === 'action' && actionType.includes(req.target))) {
          updated = true;
        }

        // Calculate progress for this requirement
        const progress = await this.getRequirementProgress(userId, req, challenge.createdAt);
        if (progress >= req.count) {
          completedRequirements++;
        }
        totalProgress += (progress / req.count) * (100 / requirements.length);
      }

      if (updated) {
        const isCompleted = completedRequirements === requirements.length;
        
        await prisma.dailyChallenge.update({
          where: { id: challenge.id },
          data: {
            progress: Math.min(100, totalProgress),
            status: isCompleted ? 'completed' : 'active',
            completedAt: isCompleted ? new Date() : null
          }
        });

        // Award rewards if completed
        if (isCompleted && !challenge.claimedAt) {
          await this.claimChallengeRewards(userId, challenge.id);
        }
      }
    }
  }

  private async getRequirementProgress(
    userId: string,
    requirement: ChallengeRequirement,
    since: Date
  ): Promise<number> {
    switch (requirement.type) {
      case 'task':
        return await prisma.taskProgress.count({
          where: {
            userId,
            completed: true,
            completedAt: { gte: since }
          }
        });

      case 'action':
        return await prisma.xPTransaction.count({
          where: {
            userId,
            actionId: requirement.target,
            createdAt: { gte: since }
          }
        });

      case 'metric':
        const stats = await prisma.userStats.findUnique({
          where: { userId }
        });
        if (requirement.target === 'streak') {
          return stats?.streakDays || 0;
        }
        return 0;

      default:
        return 0;
    }
  }

  async claimChallengeRewards(userId: string, challengeId: string): Promise<void> {
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge || challenge.status !== 'completed' || challenge.claimedAt) {
      return;
    }

    const rewards = challenge.rewards as ChallengeReward[];
    
    for (const reward of rewards) {
      switch (reward.type) {
        case 'xp':
          await xpSystem.awardXP(userId, 'complete-challenge', {
            challengeId,
            xpAmount: reward.value
          });
          break;

        case 'badge':
          await prisma.userAchievement.create({
            data: {
              userId,
              achievementId: `challenge-${reward.value}`,
              achievementType: 'challenge',
              title: `Challenge Badge: ${reward.value}`,
              description: `Earned by completing ${challenge.title}`,
              metadata: { challengeId, reward }
            }
          });
          break;

        case 'feature':
          await prisma.unlockedFeature.create({
            data: {
              userId,
              featureId: `challenge-unlock-${reward.value}`,
              featureName: reward.description,
              unlockedAt: new Date(),
              unlockedBy: 'challenge'
            }
          });
          break;
      }
    }

    await prisma.dailyChallenge.update({
      where: { id: challengeId },
      data: { claimedAt: new Date() }
    });
  }

  async getActiveChallenges(userId: string): Promise<Challenge[]> {
    const challenges = await prisma.dailyChallenge.findMany({
      where: {
        userId,
        status: { in: ['active', 'completed'] },
        expiresAt: { gt: new Date() }
      },
      orderBy: { difficulty: 'asc' }
    });

    return challenges.map(c => ({
      id: c.challengeId,
      title: c.title,
      description: c.description,
      type: c.type as 'daily' | 'weekly' | 'special',
      category: c.category as Challenge['category'],
      difficulty: c.difficulty as Challenge['difficulty'],
      requirements: c.requirements as ChallengeRequirement[],
      rewards: c.rewards as ChallengeReward[],
      expiresAt: c.expiresAt,
      metadata: {
        ...c.metadata as Record<string, any>,
        progress: c.progress,
        status: c.status,
        completedAt: c.completedAt,
        claimedAt: c.claimedAt
      }
    }));
  }

  private async getRecentChallenges(userId: string, days: number): Promise<any[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return await prisma.dailyChallenge.findMany({
      where: {
        userId,
        createdAt: { gte: since }
      },
      select: { metadata: true }
    });
  }

  async createSpecialChallenge(
    title: string,
    description: string,
    requirements: ChallengeRequirement[],
    rewards: ChallengeReward[],
    targetUserIds?: string[],
    expiresInHours: number = 48
  ): Promise<void> {
    const challenge: Challenge = {
      id: `special-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      type: 'special',
      category: this.determineCategory(requirements),
      difficulty: rewards.some(r => r.type === 'xp' && Number(r.value) > 500) ? 'hard' : 'medium',
      requirements,
      rewards,
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
      metadata: { special: true }
    };

    // If no specific users, make it available to all
    const userIds = targetUserIds || await prisma.user.findMany({
      where: { emailVerified: { not: null } },
      select: { id: true }
    }).then(users => users.map(u => u.id));

    // Create challenge for each user
    await prisma.dailyChallenge.createMany({
      data: userIds.map(userId => ({
        challengeId: challenge.id,
        userId,
        type: challenge.type,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        difficulty: challenge.difficulty,
        requirements: challenge.requirements,
        rewards: challenge.rewards,
        expiresAt: challenge.expiresAt,
        status: 'active',
        progress: 0,
        metadata: challenge.metadata
      }))
    });
  }
}

export const dailyChallenges = new DailyChallengeSystem();