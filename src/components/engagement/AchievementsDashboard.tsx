'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/store/useAppStore';
import { Achievement, UserStats, LevelSystem } from '@/types/achievements';
import {
  Trophy,
  Star,
  Zap,
  Target,
  Crown,
  Calendar,
  TrendingUp,
  Lock,
  CheckCircle,
  BarChart3,
  Users,
  Clock,
  Award,
  Flame
} from 'lucide-react';

export function AchievementsDashboard() {
  const { progress } = useAppStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock user stats and achievements for development
  const mockAchievements: Achievement[] = [
    {
      id: 'first-task',
      name: 'First Steps',
      description: 'Complete your first task',
      type: 'task',
      icon: '🎯',
      points: 50,
      rarity: 'common',
      category: 'progress',
      requirements: { tasks: 1 },
      unlockedAt: new Date()
    },
    {
      id: 'week-streak',
      name: 'Week Warrior',
      description: 'Complete tasks for 7 days straight',
      type: 'streak',
      icon: '🔥',
      points: 200,
      rarity: 'rare',
      category: 'consistency',
      requirements: { streakDays: 7 },
      unlockedAt: new Date()
    },
    {
      id: 'power-user',
      name: 'Power User',
      description: 'Complete 50 tasks',
      type: 'task',
      icon: '⚡',
      points: 500,
      rarity: 'epic',
      category: 'progress',
      requirements: { tasks: 50 }
    }
  ];

  const userStats: UserStats = {
    totalTasksCompleted: progress?.completedTasks.length || 12,
    totalPoints: progress?.totalPoints || 420,
    currentLevel: 3,
    pointsToNextLevel: 180,
    totalTimeSpent: 450,
    streakData: {
      currentDays: progress?.streakDays || 5,
      longestStreak: 14,
      lastActiveDate: new Date(),
      isActive: true,
      weeklyGoal: 7,
      monthlyGoal: 30
    },
    achievements: mockAchievements.slice(0, 2),
    badges: ['🎯', '🚀', '⚡', '🔥', '🏗️'],
    titles: ['Task Master', 'Consistent Creator', 'Foundation Builder'],
    currentTitle: 'Task Master'
  };

  // Mock level system
  const levels = [
    { level: 1, name: 'Novice', minPoints: 0, maxPoints: 100, color: 'gray' },
    { level: 2, name: 'Apprentice', minPoints: 100, maxPoints: 300, color: 'blue' },
    { level: 3, name: 'Creator', minPoints: 300, maxPoints: 600, color: 'green' },
    { level: 4, name: 'Expert', minPoints: 600, maxPoints: 1000, color: 'purple' },
    { level: 5, name: 'Master', minPoints: 1000, maxPoints: 1500, color: 'gold' }
  ];

  const currentLevel = levels.find(l => l.level === userStats.currentLevel) || levels[0];
  const nextLevel = levels.find(l => l.level === userStats.currentLevel + 1);
  const levelProgress = nextLevel ? 
    ((userStats.totalPoints - currentLevel.minPoints) / 
     (nextLevel.minPoints - currentLevel.minPoints)) * 100 : 100;

  const categories = [
    { id: 'progress', name: 'Progress', icon: Target, count: 5 },
    { id: 'streak', name: 'Streaks', icon: Flame, count: 3 },
    { id: 'milestone', name: 'Milestones', icon: Trophy, count: 4 },
    { id: 'platform', name: 'Platform', icon: Users, count: 3 },
    { id: 'special', name: 'Special', icon: Star, count: 7 }
  ];

  const getAchievementsByCategory = (category: string) => {
    return mockAchievements.filter(a => a.category === category);
  };

  const isAchievementUnlocked = (achievementId: string) => {
    return userStats.achievements.some(a => a.id === achievementId);
  };

  const getAchievementProgress = (achievement: Achievement) => {
    // Handle both requirements and requirement properties for compatibility
    const requirements = achievement.requirements || achievement.requirement;
    if (!requirements) return 0;
    
    if (requirements.tasks) {
      return Math.min((userStats.totalTasksCompleted / requirements.tasks) * 100, 100);
    }
    if (requirements.streakDays) {
      return Math.min((userStats.streakData.currentDays / requirements.streakDays) * 100, 100);
    }
    return 0;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'uncommon': return 'bg-green-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const renderAchievementCard = (achievement: Achievement) => {
    const isUnlocked = isAchievementUnlocked(achievement.id);
    const progress = getAchievementProgress(achievement);
    
    return (
      <Card 
        key={achievement.id} 
        className={`relative overflow-hidden transition-all hover:scale-105 ${
          isUnlocked ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20' : ''
        } ${achievement.isHidden && !isUnlocked ? 'opacity-50' : ''}`}
      >
        <CardContent className="p-4">
          {/* Rarity Indicator */}
          <div className={`absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] ${getRarityColor(achievement.rarity)}`} />
          
          {/* Achievement Icon */}
          <div className="flex items-start space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
              isUnlocked ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-muted'
            }`}>
              {isUnlocked ? achievement.icon : <Lock className="w-6 h-6 text-muted-foreground" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className={`font-semibold ${isUnlocked ? 'text-yellow-800 dark:text-yellow-200' : ''}`}>
                  {achievement.isHidden && !isUnlocked ? '???' : achievement.title}
                </h4>
                {isUnlocked && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {achievement.isHidden && !isUnlocked ? 'Hidden achievement - complete tasks to unlock!' : achievement.description}
              </p>
              
              {/* Progress Bar for Incomplete Achievements */}
              {!isUnlocked && !achievement.isHidden && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              
              {/* Reward Info */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {achievement.reward.points} pts
                  </Badge>
                  <Badge variant="outline" className={`text-xs capitalize ${getRarityColor(achievement.rarity)} text-white`}>
                    {achievement.rarity}
                  </Badge>
                </div>
                
                {isUnlocked && achievement.unlockedAt && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Level Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-2xl font-bold">{currentLevel.level}</p>
                <p className="text-xs text-muted-foreground">{currentLevel.title}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress to Level {userStats.currentLevel + 1}</span>
                <span>{Math.round(levelProgress)}%</span>
              </div>
              <Progress value={levelProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Total Points */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">{userStats.totalPoints.toLocaleString()}</p>
                <p className="text-xs text-green-600">+{userStats.pointsToNextLevel} to next level</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold">{userStats.streakData.currentDays}</p>
                <p className="text-xs text-muted-foreground">days active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements Count */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-2xl font-bold">{userStats.achievements.length}</p>
                <p className="text-xs text-muted-foreground">of {mockAchievements.length} total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center space-x-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center space-x-1">
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{category.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Recent Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userStats.achievements.slice(0, 6).map(achievement => renderAchievementCard(achievement))}
              </div>
            </CardContent>
          </Card>

          {/* Badges Collection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="w-5 h-5" />
                <span>Badge Collection</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {userStats.badges.map((badge, index) => (
                  <div key={index} className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                    {badge}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Titles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="w-5 h-5" />
                <span>Earned Titles</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {userStats.titles.map((title, index) => (
                  <Badge 
                    key={index} 
                    variant={title === userStats.currentTitle ? 'default' : 'outline'}
                    className="cursor-pointer"
                  >
                    {title === userStats.currentTitle && <Crown className="w-3 h-3 mr-1" />}
                    {title}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Tabs */}
        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getAchievementsByCategory(category.id).map(achievement => renderAchievementCard(achievement))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}