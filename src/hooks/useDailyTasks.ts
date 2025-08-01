import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { dataSync } from '@/services/dataSync';
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

interface TasksResponse {
  tasks: EnhancedTask[];
  todaysTasks: EnhancedTask[];
  upcomingTasks: EnhancedTask[];
  progress: {
    total: number;
    completed: number;
    percentage: number;
    currentPhase: number;
    currentWeek: number;
    currentDay: number;
  };
  filters: {
    platform?: string;
    niche?: string;
    phase?: number;
    week?: number;
  };
}

export function useDailyTasks() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TasksResponse | null>(null);
  const { selectedPlatform, selectedNiche } = useAppStore();
  const fetchInProgressRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  useEffect(() => {
    if (selectedPlatform && selectedNiche) {
      fetchTasks();
    }
  }, [selectedPlatform, selectedNiche]);

  const fetchTasks = async () => {
    if (!selectedPlatform || !selectedNiche) return;

    // Prevent duplicate fetches
    if (fetchInProgressRef.current) return;
    
    // Debounce fetches (minimum 1 second between fetches)
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) return;

    fetchInProgressRef.current = true;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        platform: selectedPlatform.id,
        niche: selectedNiche.id
      });

      const response = await fetch(`/api/tasks/daily?${params}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');

      const data = await response.json();
      setData(data);
      lastFetchTimeRef.current = now;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const completeTask = async (taskId: string, completionData?: any) => {
    try {
      // Queue sync update
      dataSync.queueUpdate('task:completed', {
        taskId,
        ...completionData,
        completedAt: new Date().toISOString()
      });

      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, ...completionData })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to complete task');
      }

      const result = await response.json();
      
      // Show achievement celebrations only if not already completed
      if (!result.alreadyCompleted && result.milestoneAchievements?.length > 0) {
        for (const achievement of result.milestoneAchievements) {
          toast.success(achievement.milestone.name, {
            description: achievement.milestone.celebration.message
          });
        }
      }

      // Refresh tasks after a short delay to allow for server processing
      setTimeout(() => {
        fetchTasks();
      }, 100);
      
      if (!result.alreadyCompleted) {
        toast.success('Task completed!', {
          description: `+${result.points} points earned`
        });
      }

      return result;
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete task');
      throw error;
    }
  };

  return {
    loading,
    tasks: data?.tasks || [],
    todaysTasks: data?.todaysTasks || [],
    upcomingTasks: data?.upcomingTasks || [],
    progress: data?.progress || null,
    completeTask,
    refresh: fetchTasks
  };
}