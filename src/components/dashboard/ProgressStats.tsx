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
      value: `${currentDay}`,
      subtitle: isFreeTier ? `of ${maxProgressDays} days (Free)` : 'of 90 days',
      icon: Calendar,
      progress: isFreeTier ? (currentDay / maxProgressDays) * 100 : (currentDay / 90) * 100,
      color: isLocked ? 'bg-red-500' : 'bg-green-500',
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
    <>
      {/* Free tier warning banner */}
      {isFreeTier && currentDay >= maxProgressDays - 5 && !isLoading && (
        <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                  {isLocked ? (
                    <>Free tier limit reached! Your progress tracking has been locked.</>  
                  ) : (
                    <>Only {daysRemaining} days remaining on your free plan!</>
                  )}
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  Free users can track progress for {maxProgressDays} days. Upgrade to continue your 90-day journey.
                </p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              className="border-orange-300 hover:bg-orange-100"
              onClick={() => setShowPaywall(true)}
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade
            </Button>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
        
        const statIsLocked = (isLocked && index === 0) || (stat.title === 'Days Active' && isLocked);
        
        return (
          <Card 
            key={index} 
            className={`relative overflow-hidden ${
              statIsLocked ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            onClick={() => statIsLocked && setShowPaywall(true)}
          >
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
              {statIsLocked && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                  <Lock className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
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
    
    {/* Paywall Modal */}
    <PaywallModal
      isOpen={showPaywall}
      onClose={() => setShowPaywall(false)}
      feature="Extended Progress Tracking"
      title="Continue Your Creator Journey"
      description="You've reached the 30-day limit for free users. Upgrade to Premium to continue tracking your progress for the full 90-day roadmap and unlock all features."
      benefits={[
        'Track progress for the full 90-day journey',
        'Unlock advanced analytics and insights',
        'Export your progress reports',
        'Access all premium templates',
        'Get priority support and updates'
      ]}
    />
  </>
  );
}