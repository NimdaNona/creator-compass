import { prisma } from '@/lib/db';

export interface UserContext {
  userId: string;
  platform: string;
  niche: string;
  currentPhase: number;
  currentWeek: number;
  completedTasks: string[];
  engagementHistory: {
    contentType: string;
    contentId: string;
    action: string;
    createdAt: Date;
  }[];
  preferences?: {
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    timeAvailable?: number; // minutes per day
    goals?: string[];
  };
}

export interface ContentItem {
  id: string;
  type: 'task' | 'template' | 'tip' | 'resource' | 'milestone';
  title: string;
  description: string;
  platform?: string;
  niche?: string;
  difficulty?: string;
  category?: string;
  tags?: string[];
  metadata?: any;
}

export interface ContentRecommendation {
  content: ContentItem;
  score: number;
  reason: string;
}

export class RecommendationEngine {
  private userContext: UserContext;

  constructor(userContext: UserContext) {
    this.userContext = userContext;
  }

  async generateRecommendations(limit: number = 10): Promise<ContentRecommendation[]> {
    const contentPool = await this.getContentPool();
    const scoredContent = this.scoreContent(contentPool);
    const filteredContent = this.filterByProgress(scoredContent);
    const diversifiedContent = this.applyDiversification(filteredContent);
    
    return diversifiedContent.slice(0, limit);
  }

  private async getContentPool(): Promise<ContentItem[]> {
    const items: ContentItem[] = [];

    // Get uncompleted tasks
    const tasks = await prisma.dailyTask.findMany({
      where: {
        AND: [
          {
            OR: [
              { platform: this.userContext.platform },
              { platform: null }
            ]
          },
          {
            OR: [
              { niche: this.userContext.niche },
              { niche: null }
            ]
          },
          {
            id: {
              notIn: this.userContext.completedTasks
            }
          }
        ]
      }
    });

    tasks.forEach(task => {
      items.push({
        id: task.id,
        type: 'task',
        title: task.title,
        description: task.description,
        platform: task.platform,
        niche: task.niche,
        difficulty: task.difficulty,
        category: task.category,
        metadata: {
          phase: task.phase,
          week: task.week,
          timeEstimate: task.timeEstimate
        }
      });
    });

    // Get templates
    const templates = await prisma.generatedTemplate.findMany({
      where: {
        OR: [
          { isPublic: true },
          { userId: this.userContext.userId }
        ],
        platform: this.userContext.platform,
        niche: this.userContext.niche
      },
      orderBy: [
        { rating: 'desc' },
        { uses: 'desc' }
      ],
      take: 20
    });

    templates.forEach(template => {
      items.push({
        id: template.id,
        type: 'template',
        title: template.title,
        description: `${template.category} - ${template.type}`,
        platform: template.platform,
        niche: template.niche,
        metadata: {
          category: template.category,
          rating: template.rating,
          uses: template.uses
        }
      });
    });

    // Get quick tips
    const tips = await prisma.quickTip.findMany({
      where: {
        isActive: true,
        OR: [
          { platform: this.userContext.platform },
          { platform: null }
        ]
      },
      take: 30
    });

    tips.forEach(tip => {
      items.push({
        id: tip.id,
        type: 'tip',
        title: tip.title,
        description: tip.content,
        platform: tip.platform || undefined,
        niche: tip.niche || undefined,
        difficulty: tip.difficulty,
        category: tip.category,
        tags: tip.tags as string[]
      });
    });

    // Get unachieved milestones
    const userAchievements = await prisma.milestoneAchievement.findMany({
      where: { userId: this.userContext.userId },
      select: { milestoneId: true }
    });

    const achievedIds = userAchievements.map(a => a.milestoneId);

    const milestones = await prisma.milestone.findMany({
      where: {
        id: {
          notIn: achievedIds
        },
        OR: [
          { platform: this.userContext.platform },
          { platform: null }
        ]
      }
    });

    milestones.forEach(milestone => {
      items.push({
        id: milestone.id,
        type: 'milestone',
        title: milestone.name,
        description: milestone.description,
        platform: milestone.platform || undefined,
        niche: milestone.niche || undefined,
        metadata: milestone
      });
    });

    return items;
  }

  private scoreContent(items: ContentItem[]): ContentRecommendation[] {
    return items.map(item => {
      let score = 0;
      let reasons: string[] = [];

      // Niche relevance (0.3 weight)
      if (item.niche === this.userContext.niche) {
        score += 0.3;
        reasons.push('Matches your niche');
      } else if (!item.niche) {
        score += 0.15; // General content gets half weight
      }

      // Current progress stage (0.25 weight)
      if (item.type === 'task' && item.metadata) {
        const taskPhase = item.metadata.phase;
        const taskWeek = item.metadata.week;
        
        if (taskPhase === this.userContext.currentPhase) {
          if (taskWeek === this.userContext.currentWeek) {
            score += 0.25;
            reasons.push('Current week task');
          } else if (taskWeek === this.userContext.currentWeek + 1) {
            score += 0.15;
            reasons.push('Upcoming week');
          }
        }
      }

      // Platform best practices (0.2 weight)
      if (item.platform === this.userContext.platform) {
        score += 0.2;
        reasons.push(`${item.platform} specific`);
      } else if (!item.platform) {
        score += 0.1; // Cross-platform content
      }

      // User engagement history (0.1 weight)
      const recentEngagement = this.userContext.engagementHistory
        .filter(e => e.contentType === item.type)
        .slice(0, 10);
      
      if (recentEngagement.length > 0) {
        const engagementScore = recentEngagement.reduce((acc, e) => {
          if (e.action === 'completed' || e.action === 'saved') return acc + 0.02;
          if (e.action === 'viewed') return acc + 0.01;
          if (e.action === 'dismissed') return acc - 0.02;
          return acc;
        }, 0);
        
        score += Math.max(0, Math.min(0.1, engagementScore));
        if (engagementScore > 0) {
          reasons.push('Based on your activity');
        }
      }

      // Difficulty matching (0.15 weight)
      if (item.difficulty && this.userContext.preferences?.difficulty) {
        if (item.difficulty === this.userContext.preferences.difficulty) {
          score += 0.15;
          reasons.push('Matches your level');
        }
      }

      // Boost highly-rated templates
      if (item.type === 'template' && item.metadata?.rating >= 4.5) {
        score += 0.1;
        reasons.push('Highly rated');
      }

      // Boost upcoming milestones
      if (item.type === 'milestone') {
        score += 0.05;
        reasons.push('Achievement opportunity');
      }

      return {
        content: item,
        score,
        reason: reasons.join(' • ')
      };
    });
  }

  private filterByProgress(items: ContentRecommendation[]): ContentRecommendation[] {
    return items.filter(item => {
      // Don't recommend tasks from future phases
      if (item.content.type === 'task' && item.content.metadata) {
        const taskPhase = item.content.metadata.phase;
        if (taskPhase > this.userContext.currentPhase + 1) {
          return false;
        }
      }

      // Don't recommend already engaged content in last 24 hours
      const recentlyEngaged = this.userContext.engagementHistory.find(e => 
        e.contentId === item.content.id &&
        e.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      if (recentlyEngaged) {
        return false;
      }

      return true;
    });
  }

  private applyDiversification(items: ContentRecommendation[]): ContentRecommendation[] {
    // Sort by score first
    const sorted = items.sort((a, b) => b.score - a.score);
    
    // Ensure content diversity
    const diversified: ContentRecommendation[] = [];
    const typeCount: Record<string, number> = {};
    const categoryCount: Record<string, number> = {};

    for (const item of sorted) {
      const type = item.content.type;
      const category = item.content.category || 'general';

      // Limit each type to prevent monotony
      if (!typeCount[type]) typeCount[type] = 0;
      if (!categoryCount[category]) categoryCount[category] = 0;

      // Allow max 3 of same type, 2 of same category in top 10
      if (typeCount[type] < 3 && categoryCount[category] < 2) {
        diversified.push(item);
        typeCount[type]++;
        categoryCount[category]++;
      }

      if (diversified.length >= 20) break;
    }

    return diversified;
  }

  async trackEngagement(contentId: string, contentType: string, action: string) {
    await prisma.contentEngagement.create({
      data: {
        userId: this.userContext.userId,
        contentType,
        contentId,
        action
      }
    });

    // Update recommendation shown/engaged status
    if (action === 'viewed') {
      await prisma.contentRecommendation.updateMany({
        where: {
          userId: this.userContext.userId,
          contentId,
          shown: false
        },
        data: {
          shown: true
        }
      });
    } else if (['completed', 'saved', 'shared'].includes(action)) {
      await prisma.contentRecommendation.updateMany({
        where: {
          userId: this.userContext.userId,
          contentId
        },
        data: {
          engaged: true
        }
      });
    }
  }

  async saveRecommendations(recommendations: ContentRecommendation[]) {
    const data = recommendations.map(rec => ({
      userId: this.userContext.userId,
      contentType: rec.content.type,
      contentId: rec.content.id,
      score: rec.score,
      reason: rec.reason
    }));

    await prisma.contentRecommendation.createMany({
      data,
      skipDuplicates: true
    });
  }
}

export async function getUserContext(userId: string): Promise<UserContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      taskCompletions: {
        select: { taskId: true }
      }
    }
  });

  if (!user || !user.profile || !user.profile.selectedPlatform || !user.profile.selectedNiche) {
    return null;
  }

  const engagementHistory = await prisma.contentEngagement.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return {
    userId,
    platform: user.profile.selectedPlatform,
    niche: user.profile.selectedNiche,
    currentPhase: user.profile.currentPhase,
    currentWeek: user.profile.currentWeek,
    completedTasks: user.taskCompletions.map(tc => tc.taskId),
    engagementHistory,
    preferences: user.profile.preferences ? JSON.parse(user.profile.preferences) : undefined
  };
}