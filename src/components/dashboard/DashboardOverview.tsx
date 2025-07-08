'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { getRoadmap, getAllTasksForRoadmap, calculatePhaseProgress } from '@/lib/data';
import { 
  TrendingUp, 
  Calendar, 
  Target,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  BarChart3,
  Users,
  Zap
} from 'lucide-react';

export function DashboardOverview() {
  const { selectedPlatform, selectedNiche, progress } = useAppStore();

  if (!selectedPlatform || !selectedNiche || !progress) {
    return null;
  }

  const roadmap = getRoadmap(selectedPlatform.id, selectedNiche.id);
  const allTasks = getAllTasksForRoadmap(selectedPlatform.id, selectedNiche.id);
  const daysElapsed = Math.floor((Date.now() - progress.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 90 - daysElapsed);

  // Calculate phase progress
  const phaseProgress = roadmap?.phases.map(phase => ({
    ...phase,
    progress: calculatePhaseProgress(selectedPlatform.id, selectedNiche.id, phase.phase, progress.completedTasks)
  })) || [];

  const overallProgress = (progress.completedTasks.length / allTasks.length) * 100;

  // Weekly goal tracking
  const weeklyGoal = 7; // 7 tasks per week target
  const thisWeekTasks = progress.completedTasks.filter(taskId => {
    // Simple approximation - in real app, you'd track completion dates
    return true; // For demo, assume all recent tasks are this week
  }).length;

  const weeklyProgress = Math.min((thisWeekTasks / weeklyGoal) * 100, 100);

  // Insights and recommendations
  const insights = [
    {
      title: 'Great Progress!',
      description: `You're ${Math.round(overallProgress)}% through your 90-day journey`,
      icon: TrendingUp,
      type: 'success'
    },
    {
      title: 'Stay Consistent',
      description: `${daysRemaining} days remaining to reach your goals`,
      icon: Calendar,
      type: 'info'
    },
    {
      title: 'Weekly Target',
      description: `${thisWeekTasks}/${weeklyGoal} tasks completed this week`,
      icon: Target,
      type: weeklyProgress >= 100 ? 'success' : 'warning'
    }
  ];

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:bg-green-950/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:bg-blue-950/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Overview Cards with Gen Z Styling */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="modern-card gen-z-card hover:neon-glow-blue transition-all duration-500 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                Overall Progress
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {Math.round(overallProgress)}%
                </span>
                <Badge variant="secondary" className="social-button bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-200">
                  {progress.completedTasks.length}/{allTasks.length}
                </Badge>
              </div>
              <div className="progress-glow">
                <Progress value={overallProgress} className="h-3 bg-blue-100 dark:bg-blue-900/30" />
              </div>
              <p className="text-sm text-muted-foreground flex items-center">
                <span className="mr-2">🎯</span>
                {progress.completedTasks.length} tasks completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card gen-z-card hover:neon-glow-purple transition-all duration-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">
                Time Remaining
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {daysRemaining}
                </span>
                <span className="text-lg emoji-bounce">⏰</span>
              </div>
              <div className="text-sm text-muted-foreground">days left to success!</div>
              <Progress value={((90 - daysRemaining) / 90) * 100} className="h-3 bg-purple-100 dark:bg-purple-900/30" />
              <p className="text-sm text-muted-foreground flex items-center">
                <span className="mr-2">📅</span>
                Day {daysElapsed + 1} of 90
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card gen-z-card hover:neon-glow-pink transition-all duration-500 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent font-semibold">
                Weekly Goal
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {thisWeekTasks}
                  </span>
                  <span className="text-lg">{weeklyProgress >= 100 ? '🔥' : '💪'}</span>
                </div>
                <Badge variant={weeklyProgress >= 100 ? "default" : "secondary"} 
                       className={weeklyProgress >= 100 ? "notification-badge text-white" : "social-button bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200"}>
                  {weeklyGoal} target
                </Badge>
              </div>
              <Progress value={weeklyProgress} className="h-3 bg-green-100 dark:bg-green-900/30" />
              <p className="text-sm text-muted-foreground flex items-center">
                <span className="mr-2">📊</span>
                tasks completed this week
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Phase Progress */}
      <Card className="modern-card gen-z-card bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/10 dark:to-pink-950/10 border-purple-200/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-bold">
              Phase Progress
            </span>
            <span className="text-lg emoji-bounce">⚡</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {phaseProgress.map((phase, index) => (
              <div key={phase.id} className="space-y-3 p-4 rounded-xl bg-white/50 dark:bg-black/20 border border-purple-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold relative overflow-hidden ${
                      phase.progress >= 100 ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white celebrate' :
                      phase.progress > 0 ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white' :
                      'bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 text-gray-600 dark:text-gray-300'
                    }`}>
                      {phase.progress >= 100 ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <span className="text-lg font-bold">{phase.phase}</span>
                      )}
                      {phase.progress >= 100 && (
                        <div className="absolute inset-0 bg-white/20 animate-ping rounded-full" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{phase.title}</h4>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {phase.timeframe}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {Math.round(phase.progress)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {phase.progress >= 100 ? 'Complete! 🎉' : 'In Progress'}
                    </div>
                  </div>
                </div>
                <div className="progress-glow">
                  <Progress value={phase.progress} className="h-4 bg-purple-100 dark:bg-purple-900/30" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Insights & Recommendations */}
      <Card className="modern-card gen-z-card bg-gradient-to-br from-yellow-50/50 to-orange-50/50 dark:from-yellow-950/10 dark:to-orange-950/10 border-yellow-200/30">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent font-bold">
              AI Insights & Recommendations
            </span>
            <span className="text-lg emoji-bounce">🧠</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              
              const typeStyles = {
                success: {
                  gradient: 'from-green-500 to-emerald-500',
                  bg: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
                  border: 'border-green-200/50',
                  emoji: '🎉'
                },
                warning: {
                  gradient: 'from-yellow-500 to-orange-500',
                  bg: 'from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20',
                  border: 'border-yellow-200/50',
                  emoji: '⚠️'
                },
                info: {
                  gradient: 'from-blue-500 to-cyan-500',
                  bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
                  border: 'border-blue-200/50',
                  emoji: 'ℹ️'
                }
              };
              
              const style = typeStyles[insight.type as keyof typeof typeStyles] || typeStyles.info;
              
              return (
                <div key={index} className={`modern-card p-6 rounded-xl border bg-gradient-to-br ${style.bg} ${style.border} hover:scale-105 transition-all duration-300`}>
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-full bg-gradient-to-br ${style.gradient} text-white shadow-lg`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-bold text-lg">{insight.title}</h4>
                        <span className="text-lg">{style.emoji}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Quick Stats */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="modern-card gen-z-card bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/10 dark:to-purple-950/10 border-indigo-200/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
                Platform Stats
              </span>
              <span className="text-lg">📊</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-black/20">
                <span className="text-sm text-muted-foreground flex items-center">
                  <span className="mr-2">🚀</span>
                  Platform:
                </span>
                <Badge className={`social-button ${
                  selectedPlatform.id === 'youtube' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  selectedPlatform.id === 'tiktok' ? 'bg-gradient-to-r from-black to-gray-800' :
                  'bg-gradient-to-r from-purple-500 to-purple-600'
                } text-white border-0`}>
                  {selectedPlatform.displayName}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-black/20">
                <span className="text-sm text-muted-foreground flex items-center">
                  <span className="mr-2">🎯</span>
                  Niche:
                </span>
                <span className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {selectedNiche.name}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-black/20">
                <span className="text-sm text-muted-foreground flex items-center">
                  <span className="mr-2">⚡</span>
                  Difficulty:
                </span>
                <Badge variant={
                  selectedNiche.difficulty === 'Easy' ? 'default' :
                  selectedNiche.difficulty === 'Medium' ? 'secondary' :
                  'destructive'
                } className="social-button">
                  {selectedNiche.difficulty}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-black/20">
                <span className="text-sm text-muted-foreground flex items-center">
                  <span className="mr-2">💰</span>
                  Est. Monetization:
                </span>
                <span className="text-sm font-semibold text-green-600">
                  {selectedNiche.avgTimeToMonetization}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card gen-z-card bg-gradient-to-br from-pink-50/50 to-rose-50/50 dark:from-pink-950/10 dark:to-rose-950/10 border-pink-200/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent font-bold">
                Your Goals
              </span>
              <span className="text-lg">🎯</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progress.goals && progress.goals.length > 0 ? (
              <div className="space-y-3">
                {progress.goals.slice(0, 3).map((goal, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-xl bg-white/50 dark:bg-black/20">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                      <Target className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium">{goal}</span>
                  </div>
                ))}
                {progress.goals.length > 3 && (
                  <div className="text-center text-xs text-muted-foreground p-2 bg-pink-100/50 dark:bg-pink-900/20 rounded-lg">
                    <span className="mr-1">✨</span>
                    +{progress.goals.length - 3} more goals to achieve!
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-lg font-semibold mb-2">No goals set yet! 🎯</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set your creator goals to stay motivated and track your progress.
                  </p>
                </div>
                <Button size="sm" className="social-button bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0">
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Set Your Goals
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}