'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Target, Trophy, ChevronRight, Lock } from 'lucide-react';
import DailyTaskCard from './DailyTaskCard';
import MilestoneTracker from './MilestoneTracker';
import ProgressPrediction from './ProgressPrediction';
import { AIRoadmapAssistant } from './AIRoadmapAssistant';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';

interface EnhancedTask {
  id: string;
  roadmapId: string;
  platform: string;
  niche: string;
  phase: number;
  week: number;
  dayRange: string;
  title: string;
  description: string;
  instructions: string[];
  timeEstimate: number;
  difficulty: string;
  category: string;
  platformSpecific: {
    tips: string[];
    bestPractices: string[];
    commonMistakes: string[];
  };
  successMetrics: {
    metric: string;
    target: string | number;
    howToMeasure: string;
  }[];
  resources: {
    type: string;
    title: string;
    url?: string;
    content?: string;
  }[];
  completed: boolean;
  completion?: {
    completedAt: string;
    quality?: number;
    timeSpent?: number;
  };
  locked: boolean;
}

interface RoadmapProgress {
  total: number;
  completed: number;
  percentage: number;
  currentPhase: number;
  currentWeek: number;
  currentDay: number;
}

export default function EnhancedRoadmapView() {
  const [tasks, setTasks] = useState<EnhancedTask[]>([]);
  const [todaysTasks, setTodaysTasks] = useState<EnhancedTask[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<EnhancedTask[]>([]);
  const [progress, setProgress] = useState<RoadmapProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhase, setSelectedPhase] = useState<number>(1);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  const { selectedPlatform, selectedNiche } = useAppStore();

  useEffect(() => {
    fetchTasks();
  }, [selectedPlatform, selectedNiche, selectedPhase, selectedWeek]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(selectedPlatform && { platform: selectedPlatform }),
        ...(selectedNiche && { niche: selectedNiche }),
        phase: selectedPhase.toString(),
        week: selectedWeek.toString()
      });

      const response = await fetch(`/api/tasks/daily?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');

      const data = await response.json();
      setTasks(data.tasks);
      setTodaysTasks(data.todaysTasks);
      setUpcomingTasks(data.upcomingTasks);
      setProgress(data.progress);

      // Update selected phase/week to current if different
      if (data.progress) {
        if (data.progress.currentPhase !== selectedPhase) {
          setSelectedPhase(data.progress.currentPhase);
        }
        if (data.progress.currentWeek !== selectedWeek) {
          setSelectedWeek(data.progress.currentWeek);
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (taskId: string, data: any) => {
    try {
      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, ...data })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete task');
      }

      const result = await response.json();
      
      // Show achievement celebrations
      if (result.milestoneAchievements?.length > 0) {
        for (const achievement of result.milestoneAchievements) {
          toast.success(achievement.milestone.name, {
            description: achievement.milestone.celebration.message
          });
        }
      }

      // Refresh tasks
      fetchTasks();
      
      toast.success('Task completed!', {
        description: `+${result.points} points earned`
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete task');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      {progress && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Your Progress</h2>
                <p className="text-muted-foreground">
                  Phase {progress.currentPhase}, Week {progress.currentWeek}, Day {progress.currentDay}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{progress.percentage}%</div>
                <p className="text-sm text-muted-foreground">
                  {progress.completed} of {progress.total} tasks
                </p>
              </div>
            </div>
            <Progress value={progress.percentage} className="h-3" />
          </div>
        </Card>
      )}

      {/* AI Roadmap Assistant */}
      <AIRoadmapAssistant 
        roadmapData={{
          phases: [
            { id: 1, name: 'Foundation', tasks: 30 },
            { id: 2, name: 'Growth', tasks: 30 },
            { id: 3, name: 'Scale', tasks: 30 },
          ],
          currentTasks: todaysTasks.map(t => t.title),
        }}
        userProgress={progress}
      />

      {/* Today's Tasks */}
      {todaysTasks.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Today's Tasks
              </h3>
              <Badge variant="secondary">
                {todaysTasks.filter(t => !t.completed).length} remaining
              </Badge>
            </div>
            <div className="space-y-3">
              {todaysTasks.map(task => (
                <DailyTaskCard
                  key={task.id}
                  task={task}
                  onComplete={handleTaskComplete}
                  compact
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Milestone Tracker */}
      <MilestoneTracker />

      {/* Phase/Week Navigation */}
      <Card className="p-6">
        <Tabs value={`phase-${selectedPhase}`} onValueChange={(v) => {
          const phase = parseInt(v.replace('phase-', ''));
          setSelectedPhase(phase);
          setSelectedWeek(1);
        }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="phase-1">Phase 1</TabsTrigger>
            <TabsTrigger value="phase-2" disabled={progress && progress.currentPhase < 2}>
              Phase 2 {progress && progress.currentPhase < 2 && <Lock className="ml-2 h-3 w-3" />}
            </TabsTrigger>
            <TabsTrigger value="phase-3" disabled={progress && progress.currentPhase < 3}>
              Phase 3 {progress && progress.currentPhase < 3 && <Lock className="ml-2 h-3 w-3" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={`phase-${selectedPhase}`} className="mt-6">
            {/* Week Selection */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[1, 2, 3, 4].map(week => (
                <Button
                  key={week}
                  variant={selectedWeek === week ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedWeek(week)}
                  disabled={progress && (
                    selectedPhase > progress.currentPhase || 
                    (selectedPhase === progress.currentPhase && week > progress.currentWeek)
                  )}
                >
                  Week {week}
                  {progress && selectedPhase === progress.currentPhase && week === progress.currentWeek && (
                    <Badge variant="secondary" className="ml-2">Current</Badge>
                  )}
                </Button>
              ))}
            </div>

            {/* Tasks for Selected Week */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">
                Phase {selectedPhase}, Week {selectedWeek} Tasks
              </h4>
              <div className="space-y-3">
                {tasks
                  .filter(task => task.phase === selectedPhase && task.week === selectedWeek)
                  .map(task => (
                    <DailyTaskCard
                      key={task.id}
                      task={task}
                      onComplete={handleTaskComplete}
                    />
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Progress Prediction */}
      <ProgressPrediction 
        completedTasks={progress?.completed || 0}
        totalTasks={progress?.total || 0}
        currentStreak={0} // Will be fetched from user stats
      />

      {/* Upcoming Tasks Preview */}
      {upcomingTasks.length > 0 && (
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Target className="h-5 w-5" />
              Coming Up Next
            </h3>
            <div className="space-y-2">
              {upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <p className="font-medium">{task.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Phase {task.phase}, Week {task.week} • {task.dayRange}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}