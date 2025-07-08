'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { getAllTasksForRoadmap, calculateProgress } from '@/lib/data';
import { 
  Target, 
  TrendingUp, 
  CheckCircle, 
  Flame,
  Calendar,
  Trophy,
  Zap
} from 'lucide-react';

export function ProgressStats() {
  const { selectedPlatform, selectedNiche, progress } = useAppStore();

  if (!selectedPlatform || !selectedNiche || !progress) {
    return null;
  }

  const allTasks = getAllTasksForRoadmap(selectedPlatform.id, selectedNiche.id);
  const overallProgress = calculateProgress(progress.completedTasks, allTasks.length);
  const daysElapsed = Math.floor((Date.now() - progress.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const expectedProgress = Math.min(100, (daysElapsed / 90) * 100);

  const stats = [
    {
      title: 'Overall Progress',
      value: `${Math.round(overallProgress)}%`,
      subtitle: `${progress.completedTasks.length} of ${allTasks.length} tasks`,
      icon: Target,
      progress: overallProgress,
      color: 'bg-blue-500',
      trend: overallProgress > expectedProgress ? 'ahead' : overallProgress < expectedProgress ? 'behind' : 'ontrack'
    },
    {
      title: 'Current Streak',
      value: `${progress.streakDays}`,
      subtitle: progress.streakDays === 1 ? 'day' : 'days',
      icon: Flame,
      color: 'bg-orange-500',
      trend: progress.streakDays >= 7 ? 'excellent' : progress.streakDays >= 3 ? 'good' : 'start'
    },
    {
      title: 'Total Points',
      value: progress.totalPoints.toLocaleString(),
      subtitle: 'XP earned',
      icon: Trophy,
      color: 'bg-yellow-500',
      trend: 'neutral'
    },
    {
      title: 'Days Active',
      value: `${daysElapsed + 1}`,
      subtitle: 'of 90 days',
      icon: Calendar,
      progress: ((daysElapsed + 1) / 90) * 100,
      color: 'bg-green-500',
      trend: 'neutral'
    }
  ];

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'ahead':
      case 'excellent':
        return 'text-green-500';
      case 'behind':
      case 'start':
        return 'text-red-500';
      case 'good':
      case 'ontrack':
        return 'text-yellow-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'ahead':
      case 'excellent':
        return <TrendingUp className="w-3 h-3" />;
      case 'behind':
      case 'start':
        return <TrendingUp className="w-3 h-3 rotate-180" />;
      case 'good':
      case 'ontrack':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.color} text-white`}>
                  <Icon className="w-4 h-4" />
                </div>
                {stat.trend !== 'neutral' && (
                  <div className={`flex items-center space-x-1 ${getTrendColor(stat.trend)}`}>
                    {getTrendIcon(stat.trend)}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.subtitle}</div>
                <div className="text-xs font-medium text-muted-foreground">{stat.title}</div>
                
                {stat.progress !== undefined && (
                  <div className="pt-2">
                    <Progress value={stat.progress} className="h-1" />
                  </div>
                )}
              </div>
            </CardContent>
            
            {/* Subtle background decoration */}
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
          </Card>
        );
      })}
    </div>
  );
}