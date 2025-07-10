'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, Target, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressPredictionProps {
  completedTasks: number;
  totalTasks: number;
  currentStreak: number;
}

export default function ProgressPrediction({ 
  completedTasks, 
  totalTasks, 
  currentStreak 
}: ProgressPredictionProps) {
  // Calculate predictions
  const averageTasksPerDay = completedTasks > 0 ? completedTasks / Math.max(currentStreak, 1) : 0;
  const remainingTasks = totalTasks - completedTasks;
  const daysToComplete = averageTasksPerDay > 0 ? Math.ceil(remainingTasks / averageTasksPerDay) : 90;
  const estimatedCompletionDate = new Date();
  estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + daysToComplete);

  // Calculate recommended pace
  const idealDaysRemaining = 90 - (completedTasks / totalTasks) * 90;
  const recommendedTasksPerDay = remainingTasks / Math.max(idealDaysRemaining, 1);
  
  let paceRecommendation: 'increase' | 'maintain' | 'decrease' = 'maintain';
  let paceMessage = '';
  
  if (averageTasksPerDay < recommendedTasksPerDay * 0.8) {
    paceRecommendation = 'increase';
    paceMessage = 'Pick up the pace to stay on track!';
  } else if (averageTasksPerDay > recommendedTasksPerDay * 1.2) {
    paceRecommendation = 'decrease';
    paceMessage = 'Great pace! You can slow down a bit.';
  } else {
    paceMessage = 'Perfect pace! Keep it up!';
  }

  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progress Prediction
          </h3>
          <Badge variant={paceRecommendation === 'increase' ? 'destructive' : 'default'}>
            {paceRecommendation === 'increase' && <Zap className="mr-1 h-3 w-3" />}
            {paceMessage}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current Progress</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{Math.round(progressPercentage)}%</span>
              <span className="text-sm text-muted-foreground">
                ({completedTasks}/{totalTasks} tasks)
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Average Daily Tasks</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{averageTasksPerDay.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">tasks/day</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: {recommendedTasksPerDay.toFixed(1)} tasks/day
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Estimated Completion</p>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {estimatedCompletionDate.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {daysToComplete} days remaining
            </p>
          </div>
        </div>

        {/* Visual Timeline */}
        <div className="pt-4 border-t">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed" />
            </div>
            <div className="relative flex justify-between">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-4 h-4 rounded-full bg-green-500",
                  "ring-4 ring-background"
                )} />
                <span className="text-xs mt-1">Start</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-4 h-4 rounded-full",
                  progressPercentage >= 50 ? "bg-green-500" : "bg-muted",
                  "ring-4 ring-background"
                )} />
                <span className="text-xs mt-1">50%</span>
              </div>

              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-4 h-4 rounded-full",
                  progressPercentage >= 100 ? "bg-green-500" : "bg-muted",
                  "ring-4 ring-background"
                )} />
                <span className="text-xs mt-1">
                  <Target className="h-3 w-3 inline" /> Goal
                </span>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div 
              className="absolute top-2 h-0.5 bg-green-500 transition-all duration-500"
              style={{ 
                width: `${Math.min(progressPercentage, 100)}%`,
                left: 0
              }}
            />
          </div>
        </div>

        {/* Motivational Message */}
        <div className={cn(
          "p-3 rounded-lg text-sm",
          paceRecommendation === 'increase' ? "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400" :
          paceRecommendation === 'decrease' ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400" :
          "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
        )}>
          {progressPercentage < 25 && (
            <p>🚀 Great start! Every journey begins with a single step. Keep building momentum!</p>
          )}
          {progressPercentage >= 25 && progressPercentage < 50 && (
            <p>💪 Quarter way there! You're building great habits. Stay consistent!</p>
          )}
          {progressPercentage >= 50 && progressPercentage < 75 && (
            <p>🎯 Halfway to your goal! Your dedication is paying off. Push through!</p>
          )}
          {progressPercentage >= 75 && progressPercentage < 100 && (
            <p>🔥 Final stretch! You're so close to achieving your goal. Finish strong!</p>
          )}
          {progressPercentage >= 100 && (
            <p>🎉 Incredible! You've completed your roadmap! Time to celebrate and plan your next adventure!</p>
          )}
        </div>
      </div>
    </Card>
  );
}