'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { 
  Trophy, 
  Star, 
  Target, 
  Flame,
  CheckCircle,
  X,
  Sparkles,
  Crown,
  Zap
} from 'lucide-react';

export function AchievementsBanner() {
  const { progress } = useAppStore();
  const [dismissedAchievements, setDismissedAchievements] = useState<string[]>([]);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);

  useEffect(() => {
    if (!progress) return;

    // Calculate potential achievements
    const achievements = [];

    // Streak achievements
    if (progress.streakDays >= 7 && !dismissedAchievements.includes('week-streak')) {
      achievements.push({
        id: 'week-streak',
        title: '🔥 Week Warrior',
        description: '7-day streak achieved!',
        type: 'streak',
        icon: Flame,
        color: 'bg-orange-500',
        rarity: 'common'
      });
    }

    if (progress.streakDays >= 30 && !dismissedAchievements.includes('month-streak')) {
      achievements.push({
        id: 'month-streak',
        title: '🏆 Consistency Champion',
        description: '30-day streak achieved!',
        type: 'streak',
        icon: Trophy,
        color: 'bg-yellow-500',
        rarity: 'rare'
      });
    }

    // Task completion achievements
    if (progress.completedTasks.length >= 10 && !dismissedAchievements.includes('first-10-tasks')) {
      achievements.push({
        id: 'first-10-tasks',
        title: '✅ Getting Started',
        description: 'Completed your first 10 tasks!',
        type: 'tasks',
        icon: CheckCircle,
        color: 'bg-green-500',
        rarity: 'common'
      });
    }

    if (progress.completedTasks.length >= 50 && !dismissedAchievements.includes('task-master')) {
      achievements.push({
        id: 'task-master',
        title: '🎯 Task Master',
        description: 'Completed 50 tasks! You\'re on fire!',
        type: 'tasks',
        icon: Target,
        color: 'bg-blue-500',
        rarity: 'epic'
      });
    }

    // Points achievements
    if (progress.totalPoints >= 100 && !dismissedAchievements.includes('first-100-points')) {
      achievements.push({
        id: 'first-100-points',
        title: '⭐ Rising Star',
        description: 'Earned your first 100 XP!',
        type: 'points',
        icon: Star,
        color: 'bg-purple-500',
        rarity: 'common'
      });
    }

    if (progress.totalPoints >= 1000 && !dismissedAchievements.includes('xp-legend')) {
      achievements.push({
        id: 'xp-legend',
        title: '👑 XP Legend',
        description: '1,000 XP earned! Incredible dedication!',
        type: 'points',
        icon: Crown,
        color: 'bg-indigo-500',
        rarity: 'legendary'
      });
    }

    setNewAchievements(achievements);
  }, [progress, dismissedAchievements]);

  const dismissAchievement = (achievementId: string) => {
    setDismissedAchievements(prev => [...prev, achievementId]);
    setNewAchievements(prev => prev.filter(a => a.id !== achievementId));
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-200 bg-gray-50 dark:bg-gray-950/20';
      case 'rare':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20';
      case 'epic':
        return 'border-purple-200 bg-purple-50 dark:bg-purple-950/20';
      case 'legendary':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getRarityBadge = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return <Badge variant="secondary">Common</Badge>;
      case 'rare':
        return <Badge className="bg-blue-500">Rare</Badge>;
      case 'epic':
        return <Badge className="bg-purple-500">Epic</Badge>;
      case 'legendary':
        return <Badge className="bg-yellow-500">Legendary</Badge>;
      default:
        return null;
    }
  };

  if (newAchievements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 mb-8">
      {newAchievements.map((achievement) => {
        const Icon = achievement.icon;
        
        return (
          <Card 
            key={achievement.id} 
            className={`relative overflow-hidden ${getRarityColor(achievement.rarity)} achievement-pulse`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${achievement.color} text-white animate-bounce`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-lg font-bold">{achievement.title}</h3>
                      {getRarityBadge(achievement.rarity)}
                    </div>
                    <p className="text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => dismissAchievement(achievement.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Animated background effect */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <Sparkles className="w-full h-full animate-pulse" />
              </div>
              
              {/* Floating particles effect for legendary achievements */}
              {achievement.rarity === 'legendary' && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                  <div className="absolute top-8 right-8 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute bottom-4 right-4 w-1 h-1 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}