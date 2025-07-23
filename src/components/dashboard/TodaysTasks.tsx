'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { useTaskCompletion } from '@/hooks/useTaskCompletion';
import { 
  CheckCircle, 
  Clock, 
  Target,
  Sparkles,
  PlayCircle,
  ArrowRight,
  AlertCircle,
  Zap
} from 'lucide-react';

export function TodaysTasks() {
  const { loading, todaysTasks } = useDailyTasks();
  const { completeTask, isTaskCelebrating, isProcessing } = useTaskCompletion();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const completedCount = todaysTasks.filter(task => task.completed).length;

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    if (completed) {
      await completeTask(taskId);
    } else {
      // For now, we don't support uncompleting tasks via API
      // This would need a separate endpoint
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50 dark:bg-red-950/20';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20';
      case 'low':
        return 'border-green-200 bg-green-50 dark:bg-green-950/20';
      default:
        return '';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content':
        return PlayCircle;
      case 'optimization':
        return Target;
      case 'engagement':
        return Sparkles;
      case 'setup':
        return Zap;
      default:
        return Clock;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Today's Tasks</span>
            <Badge variant="secondary">
              {completedCount}/{todaysTasks.length}
            </Badge>
          </CardTitle>
          
          {completedCount === todaysTasks.length && todaysTasks.length > 0 && (
            <Badge className="bg-green-500 achievement-pulse">
              <CheckCircle className="w-3 h-3 mr-1" />
              All Done! 🎉
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {todaysTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground mb-4">
              You've completed all tasks for today. Great work! 🎉
            </p>
            <Button variant="outline">
              <ArrowRight className="w-4 h-4 mr-2" />
              View Tomorrow's Tasks
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {todaysTasks.map((task) => {
              const isCompleted = task.completed;
              const isCelebrating = isTaskCelebrating(task.id);
              const CategoryIcon = getCategoryIcon(task.category);
              
              if (task.locked) {
                return (
                  <div key={task.id} className="p-4 rounded-lg border opacity-75">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium line-through">{task.title}</h4>
                          <p className="text-sm text-muted-foreground">Upgrade to unlock this task</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Upgrade
                      </Button>
                    </div>
                  </div>
                );
              }
              
              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-50 dark:bg-green-950/20 border-green-200' 
                      : 'hover:border-gray-300'
                  } ${isCelebrating ? 'celebrate' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={(checked) => handleTaskToggle(task.id, checked as boolean)}
                      className="mt-1"
                      disabled={isCompleted || isProcessing}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </h4>
                        
                        <div className="flex items-center space-x-2 ml-2">
                          <Badge variant="outline" className="text-xs">
                            <CategoryIcon className="w-3 h-3 mr-1" />
                            {task.category}
                          </Badge>
                          
                          <Badge variant={task.difficulty === 'beginner' ? 'secondary' : task.difficulty === 'intermediate' ? 'outline' : 'default'} className="text-xs">
                            {task.difficulty}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className={`text-sm mb-3 ${isCompleted ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                        {task.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{task.timeEstimate} min</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Target className="w-3 h-3" />
                            <span>{task.dayRange}</span>
                          </div>
                        </div>
                        
                        {!isCompleted && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleTaskToggle(task.id, true)}
                            disabled={isProcessing}
                          >
                            Mark Complete
                          </Button>
                        )}
                      </div>
                      
                      {task.metadata && (
                        <div className="mt-3 p-2 bg-muted/50 rounded text-xs">
                          <div className="font-medium mb-1">💡 Pro Tips:</div>
                          {task.metadata.tips && (
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              {task.metadata.tips.slice(0, 2).map((tip: string, index: number) => (
                                <li key={index}>{tip}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Daily Motivation */}
            {completedCount === todaysTasks.length && todaysTasks.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Excellent work today! 🎉</h4>
                    <p className="text-sm text-muted-foreground">
                      You've completed all daily tasks. Keep this momentum going!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}