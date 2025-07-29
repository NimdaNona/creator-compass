'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Clock,
  ChevronRight,
  RefreshCw,
  Brain,
  Zap,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DynamicTask {
  id: string;
  title: string;
  description: string;
  category: 'content' | 'engagement' | 'optimization' | 'growth';
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string;
  impact: 'high' | 'medium' | 'low';
  reason: string;
  actionUrl?: string;
  prerequisites?: string[];
}

interface TaskRecommendation {
  tasks: DynamicTask[];
  focusArea: string;
  reasoning: string;
}

export function DynamicTaskRecommendations() {
  const [recommendations, setRecommendations] = useState<TaskRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/ai/recommendations/tasks');
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Error fetching task recommendations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecommendations();
    toast.success('Recommendations refreshed!');
  };

  const handleTaskAction = async (task: DynamicTask) => {
    // Track task interaction
    await fetch('/api/ai/journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start_recommended_task',
        data: { taskId: task.id, taskTitle: task.title }
      })
    });

    if (task.actionUrl) {
      window.location.href = task.actionUrl;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'content':
        return <Target className="h-4 w-4" />;
      case 'engagement':
        return <TrendingUp className="h-4 w-4" />;
      case 'optimization':
        return <Zap className="h-4 w-4" />;
      case 'growth':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'content':
        return 'bg-blue-100 text-blue-700';
      case 'engagement':
        return 'bg-green-100 text-green-700';
      case 'optimization':
        return 'bg-purple-100 text-purple-700';
      case 'growth':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'hard':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700">High Impact</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-700">Medium Impact</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-700">Quick Win</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            <CardTitle>AI Task Recommendations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <CardTitle>AI-Recommended Tasks</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </div>
        <CardDescription>
          {recommendations.focusArea}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* AI Reasoning */}
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-purple-600 mt-0.5" />
            <p className="text-sm text-purple-700 dark:text-purple-300">
              {recommendations.reasoning}
            </p>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3">
          <AnimatePresence>
            {recommendations.tasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "border rounded-lg p-4 cursor-pointer transition-all",
                  selectedTask === task.id 
                    ? "border-purple-500 shadow-md bg-purple-50/50 dark:bg-purple-950/20" 
                    : "hover:border-gray-300"
                )}
                onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-1.5 rounded", getCategoryColor(task.category))}>
                    {getCategoryIcon(task.category)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <div className="flex items-center gap-2">
                        {getImpactBadge(task.impact)}
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {task.estimatedTime}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                      {task.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs">
                      <span className={cn("font-medium", getDifficultyColor(task.difficulty))}>
                        {task.difficulty.charAt(0).toUpperCase() + task.difficulty.slice(1)} difficulty
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {task.category}
                      </Badge>
                    </div>

                    <AnimatePresence>
                      {selectedTask === task.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 space-y-3"
                        >
                          {/* Why this task */}
                          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <p className="text-xs font-medium mb-1">Why this task?</p>
                            <p className="text-xs text-muted-foreground">
                              {task.reason}
                            </p>
                          </div>

                          {/* Prerequisites */}
                          {task.prerequisites && task.prerequisites.length > 0 && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                              <p className="text-xs font-medium mb-1">Prerequisites:</p>
                              <ul className="text-xs text-muted-foreground list-disc list-inside">
                                {task.prerequisites.map((prereq, i) => (
                                  <li key={i}>{prereq}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Action Button */}
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskAction(task);
                            }}
                          >
                            Start This Task
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}