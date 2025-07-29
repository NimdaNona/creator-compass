'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, PlayCircle, CheckCircle, Lock, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { motion } from 'framer-motion';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'video' | 'article' | 'interactive';
  completed: boolean;
  locked: boolean;
  progress: number;
}

export default function LearningPath() {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const { selectedPlatform, selectedNiche, progress } = useAppStore();

  useEffect(() => {
    loadLearningModules();
  }, [selectedPlatform, selectedNiche]);

  const loadLearningModules = () => {
    // Mock data - in production, this would come from an API
    const platformModules: LearningModule[] = [
      {
        id: '1',
        title: `${selectedPlatform?.displayName} Basics`,
        description: 'Master the fundamentals of creating content',
        duration: '15 min',
        type: 'video',
        completed: progress?.stats?.totalTasksCompleted > 0,
        locked: false,
        progress: progress?.stats?.totalTasksCompleted > 0 ? 100 : 0
      },
      {
        id: '2',
        title: 'Finding Your Voice',
        description: 'Develop your unique creator personality',
        duration: '20 min',
        type: 'interactive',
        completed: progress?.stats?.totalTasksCompleted > 5,
        locked: progress?.stats?.totalTasksCompleted < 3,
        progress: Math.min((progress?.stats?.totalTasksCompleted || 0) * 20, 100)
      },
      {
        id: '3',
        title: `${selectedNiche?.name} Content Strategy`,
        description: 'Learn what works in your niche',
        duration: '25 min',
        type: 'article',
        completed: false,
        locked: progress?.stats?.totalTasksCompleted < 8,
        progress: 0
      },
      {
        id: '4',
        title: 'Growing Your First 100 Followers',
        description: 'Proven strategies for early growth',
        duration: '30 min',
        type: 'video',
        completed: false,
        locked: progress?.stats?.totalTasksCompleted < 15,
        progress: 0
      }
    ];

    setModules(platformModules);
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayCircle className="h-4 w-4" />;
      case 'interactive':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const completedCount = modules.filter(m => m.completed).length;
  const overallProgress = (completedCount / modules.length) * 100;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Learning Path
          </span>
          <Badge variant="outline" className="text-xs">
            {completedCount}/{modules.length} Complete
          </Badge>
        </CardTitle>
        
        <div className="mt-3">
          <Progress value={overallProgress} className="h-2" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {modules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className={cn(
                "group relative p-4 rounded-lg border transition-all cursor-pointer",
                module.completed && "bg-green-50 border-green-200 dark:bg-green-950/20",
                module.locked && "opacity-60 cursor-not-allowed",
                !module.completed && !module.locked && "hover:border-primary hover:shadow-sm"
              )}
              onClick={() => {
                if (!module.locked) {
                  window.location.href = `/learn/${module.id}`;
                }
              }}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-full transition-colors",
                  module.completed ? "bg-green-100 text-green-600" : "bg-muted"
                )}>
                  {module.completed ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : module.locked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    getModuleIcon(module.type)
                  )}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{module.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {module.description}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {module.duration}
                    </span>
                    {module.progress > 0 && module.progress < 100 && (
                      <div className="flex-1">
                        <Progress value={module.progress} className="h-1" />
                      </div>
                    )}
                  </div>
                </div>
                
                {!module.locked && !module.completed && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
            </div>
          </motion.div>
        ))}
        
        <div className="pt-4 border-t">
          <Button className="w-full" variant="outline" asChild>
            <a href="/resources">
              Explore All Resources
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | undefined | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}