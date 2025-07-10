import { prisma } from '@/lib/db';
import { startOfWeek, endOfWeek, differenceInDays, addDays, format } from 'date-fns';

export interface ProgressAnalytics {
  overview: {
    totalTasksCompleted: number;
    totalTimeSpent: number; // in minutes
    currentStreak: number;
    longestStreak: number;
    averageTasksPerDay: number;
    averageQualityScore: number;
    completionRate: number;
    predictedCompletionDate: Date | null;
  };
  weeklyStats: {
    week: string;
    tasksCompleted: number;
    timeSpent: number;
    qualityScore: number;
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
    percentage: number;
    averageTime: number;
  }[];
  platformStats: {
    platform: string;
    tasksCompleted: number;
    milestonesAchieved: number;
    nextMilestone: string | null;
  }[];
  timeAnalysis: {
    mostProductiveHour: number;
    mostProductiveDay: string;
    averageSessionLength: number;
    totalDaysActive: number;
  };
  qualityMetrics: {
    averageQuality: number;
    qualityTrend: 'improving' | 'stable' | 'declining';
    highQualityTasks: number;
    lowQualityTasks: number;
  };
  predictions: {
    estimatedCompletionDate: Date | null;
    currentPace: 'ahead' | 'on-track' | 'behind';
    recommendedDailyTasks: number;
    projectedMilestones: {
      milestone: string;
      estimatedDate: Date;
    }[];
  };
}

export class ProgressAnalyticsService {
  async getAnalytics(userId: string): Promise<ProgressAnalytics> {
    // Get all task completions
    const completions = await prisma.taskCompletion.findMany({
      where: { userId },
      include: { task: true },
      orderBy: { completedAt: 'asc' }
    });

    // Get user profile for start date
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    // Get milestones
    const achievements = await prisma.milestoneAchievement.findMany({
      where: { userId },
      include: { milestone: true }
    });

    // Calculate overview stats
    const overview = this.calculateOverview(completions, profile);
    
    // Calculate weekly stats
    const weeklyStats = this.calculateWeeklyStats(completions);
    
    // Calculate category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(completions);
    
    // Calculate platform stats
    const platformStats = await this.calculatePlatformStats(userId, completions, achievements);
    
    // Calculate time analysis
    const timeAnalysis = this.calculateTimeAnalysis(completions);
    
    // Calculate quality metrics
    const qualityMetrics = this.calculateQualityMetrics(completions);
    
    // Calculate predictions
    const predictions = await this.calculatePredictions(userId, completions, profile);

    return {
      overview,
      weeklyStats,
      categoryBreakdown,
      platformStats,
      timeAnalysis,
      qualityMetrics,
      predictions
    };
  }

  private calculateOverview(completions: any[], profile: any): ProgressAnalytics['overview'] {
    const totalTasksCompleted = completions.length;
    const totalTimeSpent = completions.reduce((sum, c) => sum + (c.timeSpent || 0), 0);
    
    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(completions);
    
    // Calculate average tasks per day
    const startDate = profile?.startDate || new Date();
    const daysActive = differenceInDays(new Date(), startDate) + 1;
    const averageTasksPerDay = totalTasksCompleted / daysActive;
    
    // Calculate average quality
    const qualityScores = completions.filter(c => c.quality).map(c => c.quality);
    const averageQualityScore = qualityScores.length > 0 
      ? qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length 
      : 0;
    
    // Calculate completion rate (assuming 3 tasks per day target)
    const expectedTasks = daysActive * 3;
    const completionRate = (totalTasksCompleted / expectedTasks) * 100;
    
    // Predict completion date
    const predictedCompletionDate = this.predictCompletionDate(
      completions,
      profile?.currentPhase || 1,
      averageTasksPerDay
    );

    return {
      totalTasksCompleted,
      totalTimeSpent,
      currentStreak,
      longestStreak,
      averageTasksPerDay,
      averageQualityScore,
      completionRate,
      predictedCompletionDate
    };
  }

  private calculateStreaks(completions: any[]): { currentStreak: number; longestStreak: number } {
    if (completions.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Group completions by date
    const completionsByDate = new Map<string, number>();
    completions.forEach(c => {
      const date = format(new Date(c.completedAt), 'yyyy-MM-dd');
      completionsByDate.set(date, (completionsByDate.get(date) || 0) + 1);
    });

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    const sortedDates = Array.from(completionsByDate.keys()).sort();
    
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      
      if (lastDate && differenceInDays(date, lastDate) === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);
      lastDate = date;
    }

    // Check if streak is current
    const today = new Date();
    const lastCompletionDate = new Date(sortedDates[sortedDates.length - 1]);
    if (differenceInDays(today, lastCompletionDate) <= 1) {
      currentStreak = tempStreak;
    }

    return { currentStreak, longestStreak };
  }

  private calculateWeeklyStats(completions: any[]): ProgressAnalytics['weeklyStats'] {
    const weeklyMap = new Map<string, { tasks: number; time: number; quality: number[]; }>();

    completions.forEach(c => {
      const weekStart = startOfWeek(new Date(c.completedAt));
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, { tasks: 0, time: 0, quality: [] });
      }
      
      const week = weeklyMap.get(weekKey)!;
      week.tasks++;
      week.time += c.timeSpent || 0;
      if (c.quality) week.quality.push(c.quality);
    });

    return Array.from(weeklyMap.entries())
      .map(([week, stats]) => ({
        week,
        tasksCompleted: stats.tasks,
        timeSpent: stats.time,
        qualityScore: stats.quality.length > 0 
          ? stats.quality.reduce((a, b) => a + b, 0) / stats.quality.length 
          : 0
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  private calculateCategoryBreakdown(completions: any[]): ProgressAnalytics['categoryBreakdown'] {
    const categoryMap = new Map<string, { count: number; time: number; }>();
    
    completions.forEach(c => {
      const category = c.task?.category || 'uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 0, time: 0 });
      }
      
      const cat = categoryMap.get(category)!;
      cat.count++;
      cat.time += c.timeSpent || 0;
    });

    const total = completions.length;
    
    return Array.from(categoryMap.entries())
      .map(([category, stats]) => ({
        category,
        count: stats.count,
        percentage: (stats.count / total) * 100,
        averageTime: stats.count > 0 ? stats.time / stats.count : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  private async calculatePlatformStats(
    userId: string, 
    completions: any[], 
    achievements: any[]
  ): Promise<ProgressAnalytics['platformStats']> {
    const platforms = ['youtube', 'tiktok', 'twitch'];
    const stats = [];

    for (const platform of platforms) {
      const platformCompletions = completions.filter(c => c.task?.platform === platform);
      const platformAchievements = achievements.filter(a => a.milestone?.platform === platform);
      
      // Get next milestone
      const nextMilestone = await prisma.milestone.findFirst({
        where: {
          platform,
          id: {
            notIn: platformAchievements.map(a => a.milestoneId)
          }
        },
        orderBy: { orderIndex: 'asc' }
      });

      stats.push({
        platform,
        tasksCompleted: platformCompletions.length,
        milestonesAchieved: platformAchievements.length,
        nextMilestone: nextMilestone?.name || null
      });
    }

    return stats;
  }

  private calculateTimeAnalysis(completions: any[]): ProgressAnalytics['timeAnalysis'] {
    if (completions.length === 0) {
      return {
        mostProductiveHour: 14, // Default to 2 PM
        mostProductiveDay: 'Monday',
        averageSessionLength: 0,
        totalDaysActive: 0
      };
    }

    // Hour analysis
    const hourCounts = new Array(24).fill(0);
    completions.forEach(c => {
      const hour = new Date(c.completedAt).getHours();
      hourCounts[hour]++;
    });
    const mostProductiveHour = hourCounts.indexOf(Math.max(...hourCounts));

    // Day analysis
    const dayCounts: Record<string, number> = {
      Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0,
      Thursday: 0, Friday: 0, Saturday: 0
    };
    completions.forEach(c => {
      const day = format(new Date(c.completedAt), 'EEEE');
      dayCounts[day]++;
    });
    const mostProductiveDay = Object.entries(dayCounts)
      .sort((a, b) => b[1] - a[1])[0][0];

    // Session analysis
    const totalTime = completions.reduce((sum, c) => sum + (c.timeSpent || 0), 0);
    const averageSessionLength = completions.length > 0 ? totalTime / completions.length : 0;

    // Days active
    const uniqueDays = new Set(
      completions.map(c => format(new Date(c.completedAt), 'yyyy-MM-dd'))
    );
    const totalDaysActive = uniqueDays.size;

    return {
      mostProductiveHour,
      mostProductiveDay,
      averageSessionLength,
      totalDaysActive
    };
  }

  private calculateQualityMetrics(completions: any[]): ProgressAnalytics['qualityMetrics'] {
    const qualityScores = completions
      .filter(c => c.quality !== null && c.quality !== undefined)
      .map(c => c.quality);

    if (qualityScores.length === 0) {
      return {
        averageQuality: 0,
        qualityTrend: 'stable',
        highQualityTasks: 0,
        lowQualityTasks: 0
      };
    }

    const averageQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
    
    // Calculate trend by comparing last 10 to previous 10
    let qualityTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (qualityScores.length >= 20) {
      const recent = qualityScores.slice(-10);
      const previous = qualityScores.slice(-20, -10);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
      
      if (recentAvg > previousAvg + 0.5) qualityTrend = 'improving';
      else if (recentAvg < previousAvg - 0.5) qualityTrend = 'declining';
    }

    const highQualityTasks = qualityScores.filter(q => q >= 4).length;
    const lowQualityTasks = qualityScores.filter(q => q <= 2).length;

    return {
      averageQuality,
      qualityTrend,
      highQualityTasks,
      lowQualityTasks
    };
  }

  private async calculatePredictions(
    userId: string,
    completions: any[],
    profile: any
  ): Promise<ProgressAnalytics['predictions']> {
    const currentPhase = profile?.currentPhase || 1;
    const averageTasksPerDay = this.calculateAverageTasksPerDay(completions);
    
    // Get total tasks for completion
    const totalTasks = await prisma.dailyTask.count({
      where: {
        platform: profile?.selectedPlatform || 'youtube',
        niche: profile?.selectedNiche || 'general'
      }
    });

    const completedTasks = completions.length;
    const remainingTasks = totalTasks - completedTasks;
    
    // Calculate estimated completion
    const daysToComplete = averageTasksPerDay > 0 ? remainingTasks / averageTasksPerDay : null;
    const estimatedCompletionDate = daysToComplete 
      ? addDays(new Date(), Math.ceil(daysToComplete))
      : null;

    // Determine current pace
    const expectedProgress = (currentPhase / 3) * 100; // Assuming 3 phases
    const actualProgress = (completedTasks / totalTasks) * 100;
    const currentPace = actualProgress >= expectedProgress + 10 ? 'ahead' 
      : actualProgress <= expectedProgress - 10 ? 'behind' 
      : 'on-track';

    // Recommended daily tasks
    const daysRemaining = 90 - differenceInDays(new Date(), profile?.startDate || new Date());
    const recommendedDailyTasks = daysRemaining > 0 
      ? Math.ceil(remainingTasks / daysRemaining)
      : 3;

    // Project milestone dates
    const upcomingMilestones = await prisma.milestone.findMany({
      where: {
        platform: profile?.selectedPlatform,
        id: {
          notIn: (await prisma.milestoneAchievement.findMany({
            where: { userId },
            select: { milestoneId: true }
          })).map(a => a.milestoneId)
        }
      },
      orderBy: { orderIndex: 'asc' },
      take: 3
    });

    const projectedMilestones = upcomingMilestones.map((milestone, index) => ({
      milestone: milestone.name,
      estimatedDate: addDays(new Date(), (index + 1) * 30) // Rough estimate
    }));

    return {
      estimatedCompletionDate,
      currentPace,
      recommendedDailyTasks,
      projectedMilestones
    };
  }

  private predictCompletionDate(
    completions: any[],
    currentPhase: number,
    averageTasksPerDay: number
  ): Date | null {
    if (averageTasksPerDay === 0) return null;

    // Estimate total tasks (30 per phase, 3 phases)
    const totalEstimatedTasks = 90;
    const remainingTasks = totalEstimatedTasks - completions.length;
    
    if (remainingTasks <= 0) return new Date();
    
    const daysToComplete = remainingTasks / averageTasksPerDay;
    return addDays(new Date(), Math.ceil(daysToComplete));
  }

  private calculateAverageTasksPerDay(completions: any[]): number {
    if (completions.length === 0) return 0;

    const firstDate = new Date(completions[0].completedAt);
    const lastDate = new Date(completions[completions.length - 1].completedAt);
    const daysDiff = differenceInDays(lastDate, firstDate) + 1;
    
    return completions.length / daysDiff;
  }

  async getProgressPrediction(userId: string): Promise<{
    daysRemaining: number;
    tasksRemaining: number;
    recommendedPace: string;
    estimatedCompletion: Date | null;
    milestoneProjections: Array<{
      name: string;
      estimatedDate: Date;
      requirement: string;
    }>;
  }> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    const completions = await prisma.taskCompletion.count({
      where: { userId }
    });

    const totalTasks = await prisma.dailyTask.count({
      where: {
        platform: profile?.selectedPlatform || 'youtube',
        niche: profile?.selectedNiche || 'general'
      }
    });

    const tasksRemaining = totalTasks - completions;
    const startDate = profile?.startDate || new Date();
    const daysElapsed = differenceInDays(new Date(), startDate);
    const daysRemaining = Math.max(0, 90 - daysElapsed);

    const averageTasksPerDay = daysElapsed > 0 ? completions / daysElapsed : 0;
    const requiredPace = daysRemaining > 0 ? tasksRemaining / daysRemaining : 0;

    let recommendedPace = 'maintain current pace';
    if (requiredPace > averageTasksPerDay * 1.2) {
      recommendedPace = 'increase pace';
    } else if (requiredPace < averageTasksPerDay * 0.8) {
      recommendedPace = 'can slow down slightly';
    }

    const estimatedCompletion = averageTasksPerDay > 0
      ? addDays(new Date(), tasksRemaining / averageTasksPerDay)
      : null;

    // Get upcoming milestones
    const upcomingMilestones = await prisma.milestone.findMany({
      where: {
        platform: profile?.selectedPlatform,
        id: {
          notIn: (await prisma.milestoneAchievement.findMany({
            where: { userId },
            select: { milestoneId: true }
          })).map(a => a.milestoneId)
        }
      },
      orderBy: { orderIndex: 'asc' },
      take: 3
    });

    const milestoneProjections = upcomingMilestones.map((milestone, index) => {
      const tasksPerMilestone = totalTasks / 10; // Rough estimate
      const tasksUntilMilestone = (index + 1) * tasksPerMilestone;
      const daysUntilMilestone = averageTasksPerDay > 0
        ? tasksUntilMilestone / averageTasksPerDay
        : 30 * (index + 1);

      return {
        name: milestone.name,
        estimatedDate: addDays(new Date(), daysUntilMilestone),
        requirement: JSON.stringify(milestone.requirement)
      };
    });

    return {
      daysRemaining,
      tasksRemaining,
      recommendedPace,
      estimatedCompletion,
      milestoneProjections
    };
  }
}

export const progressAnalytics = new ProgressAnalyticsService();