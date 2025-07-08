export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'progress' | 'streak' | 'milestone' | 'special' | 'platform';
  requirement: {
    type: 'tasks_completed' | 'streak_days' | 'phase_completed' | 'platform_milestone' | 'special_action';
    value: number;
    platform?: string;
  };
  reward: {
    points: number;
    badge?: string;
    title?: string;
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
  isHidden?: boolean;
}

export interface Streak {
  currentDays: number;
  longestStreak: number;
  lastActiveDate: Date;
  isActive: boolean;
  weeklyGoal: number;
  monthlyGoal: number;
}

export interface UserStats {
  totalTasksCompleted: number;
  totalPoints: number;
  currentLevel: number;
  pointsToNextLevel: number;
  totalTimeSpent: number; // in minutes
  streakData: Streak;
  achievements: Achievement[];
  badges: string[];
  titles: string[];
  currentTitle?: string;
}

export interface Celebration {
  id: string;
  type: 'achievement' | 'streak' | 'level_up' | 'milestone';
  title: string;
  message: string;
  icon: string;
  color: string;
  animation: 'confetti' | 'fireworks' | 'pulse' | 'bounce';
  duration: number; // in milliseconds
  timestamp: Date;
}

export interface LevelSystem {
  level: number;
  title: string;
  pointsRequired: number;
  perks: string[];
  badge: string;
}