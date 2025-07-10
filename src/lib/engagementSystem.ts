import { Achievement, Streak, UserStats, Celebration, LevelSystem } from '@/types/achievements';
import achievementsData from '@/data/achievements.json';

export class EngagementSystem {
  private userStats: UserStats;
  private achievements: Achievement[];
  private levels: LevelSystem[];

  constructor(userStats: UserStats) {
    this.userStats = userStats;
    this.achievements = achievementsData.achievements as Achievement[];
    this.levels = achievementsData.levels as LevelSystem[];
  }

  // Calculate current level based on points
  getCurrentLevel(): LevelSystem {
    let currentLevel = this.levels[0];
    for (const level of this.levels) {
      if (this.userStats.totalPoints >= level.pointsRequired) {
        currentLevel = level;
      } else {
        break;
      }
    }
    return currentLevel;
  }

  // Calculate points needed for next level
  getPointsToNextLevel(): number {
    const currentLevel = this.getCurrentLevel();
    const nextLevel = this.levels.find(level => level.level === currentLevel.level + 1);
    if (!nextLevel) return 0;
    return nextLevel.pointsRequired - this.userStats.totalPoints;
  }

  // Check if user leveled up after completing a task
  checkLevelUp(previousPoints: number): { leveledUp: boolean; newLevel?: LevelSystem } {
    const previousLevel = this.levels.find(level => {
      const nextLevel = this.levels.find(l => l.level === level.level + 1);
      return previousPoints >= level.pointsRequired && 
             (!nextLevel || previousPoints < nextLevel.pointsRequired);
    });
    
    const currentLevel = this.getCurrentLevel();
    
    if (previousLevel && currentLevel.level > previousLevel.level) {
      return { leveledUp: true, newLevel: currentLevel };
    }
    
    return { leveledUp: false };
  }

  // Update streak when user completes a task
  updateStreak(): { streakUpdated: boolean; newStreakRecord?: boolean } {
    const today = new Date();
    const lastActive = new Date(this.userStats.streakData.lastActiveDate);
    
    // Check if it's the same day
    const isSameDay = today.toDateString() === lastActive.toDateString();
    if (isSameDay) {
      return { streakUpdated: false };
    }

    // Check if it's consecutive days
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = yesterday.toDateString() === lastActive.toDateString();

    let newStreakRecord = false;
    
    if (isConsecutive) {
      // Continue streak
      this.userStats.streakData.currentDays += 1;
      if (this.userStats.streakData.currentDays > this.userStats.streakData.longestStreak) {
        this.userStats.streakData.longestStreak = this.userStats.streakData.currentDays;
        newStreakRecord = true;
      }
    } else {
      // Reset streak
      this.userStats.streakData.currentDays = 1;
    }

    this.userStats.streakData.lastActiveDate = today;
    this.userStats.streakData.isActive = true;

    return { streakUpdated: true, newStreakRecord };
  }

  // Check for newly unlocked achievements
  checkAchievements(taskCompleted?: string, platform?: string): Achievement[] {
    const unlockedAchievements: Achievement[] = [];
    
    for (const achievement of this.achievements) {
      // Skip if already unlocked
      if (this.userStats.achievements.some(a => a.id === achievement.id)) {
        continue;
      }

      let shouldUnlock = false;

      switch (achievement.requirement.type) {
        case 'tasks_completed':
          shouldUnlock = this.userStats.totalTasksCompleted >= achievement.requirement.value;
          break;
          
        case 'streak_days':
          shouldUnlock = this.userStats.streakData.currentDays >= achievement.requirement.value;
          break;
          
        case 'phase_completed':
          // This would need to be tracked separately based on roadmap progress
          shouldUnlock = this.checkPhaseCompletion(achievement.requirement.value);
          break;
          
        case 'platform_milestone':
          if (platform && platform === achievement.requirement.platform) {
            // Count platform-specific tasks completed
            shouldUnlock = this.getPlatformTaskCount(platform) >= achievement.requirement.value;
          }
          break;
          
        case 'special_action':
          // Special achievements are unlocked through specific actions
          shouldUnlock = this.checkSpecialAchievement(achievement.id, taskCompleted);
          break;
      }

      if (shouldUnlock) {
        const unlockedAchievement = {
          ...achievement,
          unlockedAt: new Date()
        };
        unlockedAchievements.push(unlockedAchievement);
        this.userStats.achievements.push(unlockedAchievement);
        this.userStats.totalPoints += achievement.reward.points;
        
        if (achievement.reward.badge && !this.userStats.badges.includes(achievement.reward.badge)) {
          this.userStats.badges.push(achievement.reward.badge);
        }
        
        if (achievement.reward.title && !this.userStats.titles.includes(achievement.reward.title)) {
          this.userStats.titles.push(achievement.reward.title);
        }
      }
    }

    return unlockedAchievements;
  }

  // Check phase completion (this would integrate with roadmap progress)
  private checkPhaseCompletion(phaseNumber: number): boolean {
    // This would need to be implemented based on actual roadmap progress
    // For now, return false as a placeholder
    return false;
  }

  // Get platform-specific task count
  private getPlatformTaskCount(platform: string): number {
    // This would need to be tracked separately
    // For now, return a placeholder based on total tasks
    return Math.floor(this.userStats.totalTasksCompleted * 0.7);
  }

  // Check special achievements
  private checkSpecialAchievement(achievementId: string, taskCompleted?: string): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday

    switch (achievementId) {
      case 'early_bird':
        return hour < 8;
        
      case 'night_owl':
        return hour >= 22;
        
      case 'weekend_warrior':
        return day === 0 || day === 6; // Saturday or Sunday
        
      case 'speed_demon':
        // Check if 5 tasks completed today
        return this.getTasksCompletedToday() >= 5;
        
      default:
        return false;
    }
  }

  // Get tasks completed today (placeholder)
  private getTasksCompletedToday(): number {
    // This would need to track daily task completion
    return 1; // Placeholder
  }

  // Generate celebrations for achievements, level ups, and streaks
  generateCelebrations(
    unlockedAchievements: Achievement[],
    levelUp?: { leveledUp: boolean; newLevel?: LevelSystem },
    streakUpdate?: { streakUpdated: boolean; newStreakRecord?: boolean }
  ): Celebration[] {
    const celebrations: Celebration[] = [];

    // Achievement celebrations
    for (const achievement of unlockedAchievements) {
      celebrations.push({
        id: `achievement_${achievement.id}`,
        type: 'achievement',
        title: 'Achievement Unlocked!',
        message: `${achievement.icon} ${achievement.title}`,
        icon: achievement.icon,
        color: this.getRarityColor(achievement.rarity),
        animation: this.getRarityAnimation(achievement.rarity),
        duration: this.getRarityDuration(achievement.rarity),
        timestamp: new Date()
      });
    }

    // Level up celebration
    if (levelUp?.leveledUp && levelUp.newLevel) {
      celebrations.push({
        id: `levelup_${levelUp.newLevel.level}`,
        type: 'level_up',
        title: 'Level Up!',
        message: `${levelUp.newLevel.badge} You're now a ${levelUp.newLevel.title}!`,
        icon: levelUp.newLevel.badge,
        color: '#FFD700',
        animation: 'fireworks',
        duration: 4000,
        timestamp: new Date()
      });
    }

    // Streak celebrations
    if (streakUpdate?.streakUpdated) {
      if (streakUpdate.newStreakRecord) {
        celebrations.push({
          id: `streak_record_${this.userStats.streakData.currentDays}`,
          type: 'streak',
          title: 'New Streak Record!',
          message: `🔥 ${this.userStats.streakData.currentDays} days - Personal best!`,
          icon: '🔥',
          color: '#FF6B35',
          animation: 'confetti',
          duration: 3000,
          timestamp: new Date()
        });
      } else if (this.userStats.streakData.currentDays % 7 === 0) {
        // Celebrate weekly milestones
        celebrations.push({
          id: `streak_week_${this.userStats.streakData.currentDays}`,
          type: 'streak',
          title: 'Week Milestone!',
          message: `🔥 ${this.userStats.streakData.currentDays} day streak!`,
          icon: '🔥',
          color: '#FF6B35',
          animation: 'pulse',
          duration: 2000,
          timestamp: new Date()
        });
      }
    }

    return celebrations;
  }

  // Get color based on rarity
  private getRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common': return '#9CA3AF';
      case 'uncommon': return '#10B981';
      case 'rare': return '#3B82F6';
      case 'epic': return '#8B5CF6';
      case 'legendary': return '#F59E0B';
      default: return '#9CA3AF';
    }
  }

  // Get animation based on rarity
  private getRarityAnimation(rarity: string): 'confetti' | 'fireworks' | 'pulse' | 'bounce' {
    switch (rarity) {
      case 'common': return 'pulse';
      case 'uncommon': return 'bounce';
      case 'rare': return 'pulse';
      case 'epic': return 'confetti';
      case 'legendary': return 'fireworks';
      default: return 'pulse';
    }
  }

  // Get duration based on rarity
  private getRarityDuration(rarity: string): number {
    switch (rarity) {
      case 'common': return 2000;
      case 'uncommon': return 2500;
      case 'rare': return 3000;
      case 'epic': return 4000;
      case 'legendary': return 5000;
      default: return 2000;
    }
  }

  // Process task completion and return all engagement updates
  processTaskCompletion(taskId: string, platform?: string): {
    achievements: Achievement[];
    levelUp: { leveledUp: boolean; newLevel?: LevelSystem };
    streakUpdate: { streakUpdated: boolean; newStreakRecord?: boolean };
    celebrations: Celebration[];
    updatedStats: UserStats;
  } {
    const previousPoints = this.userStats.totalPoints;
    
    // Update basic stats
    this.userStats.totalTasksCompleted += 1;
    this.userStats.totalPoints += 10; // Base points per task
    
    // Check for achievements
    const achievements = this.checkAchievements(taskId, platform);
    
    // Check for level up
    const levelUp = this.checkLevelUp(previousPoints);
    
    // Update streak
    const streakUpdate = this.updateStreak();
    
    // Generate celebrations
    const celebrations = this.generateCelebrations(achievements, levelUp, streakUpdate);
    
    return {
      achievements,
      levelUp,
      streakUpdate,
      celebrations,
      updatedStats: this.userStats
    };
  }
}