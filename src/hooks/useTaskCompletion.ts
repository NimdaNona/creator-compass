import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useDailyTasks } from '@/hooks/useDailyTasks';
import { toast } from 'sonner';

interface TaskCompletionOptions {
  timeSpent?: number;
  notes?: string;
  quality?: number;
  skipped?: boolean;
}

interface QueuedTask {
  taskId: string;
  options?: TaskCompletionOptions;
  resolve: (value: void) => void;
  reject: (error: any) => void;
}

export function useTaskCompletion() {
  const { updateStreak } = useAppStore();
  const { completeTask: completeDailyTask } = useDailyTasks();
  const [isProcessing, setIsProcessing] = useState(false);
  const [celebratingTasks, setCelebratingTasks] = useState<Set<string>>(new Set());
  const taskQueueRef = useRef<QueuedTask[]>([]);
  const processingRef = useRef(false);
  const lastCompletionTimeRef = useRef<number>(0);

  // Debounce interval in milliseconds
  const DEBOUNCE_INTERVAL = 300;
  const CELEBRATION_DURATION = 2000;

  const processQueue = useCallback(async () => {
    if (processingRef.current || taskQueueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    while (taskQueueRef.current.length > 0) {
      const task = taskQueueRef.current.shift();
      if (!task) continue;

      try {
        // Check debounce
        const now = Date.now();
        const timeSinceLastCompletion = now - lastCompletionTimeRef.current;
        if (timeSinceLastCompletion < DEBOUNCE_INTERVAL) {
          await new Promise(resolve => 
            setTimeout(resolve, DEBOUNCE_INTERVAL - timeSinceLastCompletion)
          );
        }

        // Start celebration
        setCelebratingTasks(prev => new Set([...prev, task.taskId]));

        // Complete the task
        await completeDailyTask(task.taskId, task.options);
        
        // Update streak
        updateStreak();
        
        // Update last completion time
        lastCompletionTimeRef.current = Date.now();

        // Clear celebration after duration
        setTimeout(() => {
          setCelebratingTasks(prev => {
            const newSet = new Set(prev);
            newSet.delete(task.taskId);
            return newSet;
          });
        }, CELEBRATION_DURATION);

        task.resolve();
      } catch (error) {
        console.error('Error completing task:', error);
        toast.error('Failed to complete task. Please try again.');
        
        // Clear celebration on error
        setCelebratingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(task.taskId);
          return newSet;
        });
        
        task.reject(error);
      }

      // Small delay between tasks to prevent overwhelming the server
      if (taskQueueRef.current.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    processingRef.current = false;
    setIsProcessing(false);
  }, [completeDailyTask, updateStreak]);

  const completeTask = useCallback(async (
    taskId: string, 
    options?: TaskCompletionOptions
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Add to queue
      taskQueueRef.current.push({
        taskId,
        options,
        resolve,
        reject
      });

      // Process queue
      processQueue();
    });
  }, [processQueue]);

  const isTaskCelebrating = useCallback((taskId: string): boolean => {
    return celebratingTasks.has(taskId);
  }, [celebratingTasks]);

  const clearQueue = useCallback(() => {
    // Reject all pending tasks
    taskQueueRef.current.forEach(task => {
      task.reject(new Error('Queue cleared'));
    });
    taskQueueRef.current = [];
    setCelebratingTasks(new Set());
  }, []);

  return {
    completeTask,
    isProcessing,
    isTaskCelebrating,
    clearQueue,
    queueLength: taskQueueRef.current.length
  };
}