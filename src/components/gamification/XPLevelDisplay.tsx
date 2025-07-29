'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy,
  TrendingUp,
  Star,
  Zap,
  Target,
  Award
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface XPLevelData {
  level: number;
  title: string;
  currentXP: number;
  requiredXP: number;
  nextLevelXP: number;
  progress: number;
  badge: string;
  todayXP: number;
  availableActions: Array<{
    id: string;
    name: string;
    xpReward: number;
    remaining?: number;
  }>;
}

export function XPLevelDisplay({ className }: { className?: string }) {
  const [levelData, setLevelData] = useState<XPLevelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    fetchLevelData();
  }, []);

  const fetchLevelData = async () => {
    try {
      const response = await fetch('/api/gamification/xp/level');
      if (response.ok) {
        const data = await response.json();
        setLevelData(data);
      }
    } catch (error) {
      console.error('Failed to fetch level data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !levelData) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-8 bg-muted rounded" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      </Card>
    );
  }

  const xpToNextLevel = levelData.nextLevelXP - levelData.currentXP;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10" />
      
      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{levelData.badge}</span>
              <div>
                <h3 className="font-semibold">Level {levelData.level}</h3>
                <p className="text-sm text-muted-foreground">{levelData.title}</p>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">{levelData.currentXP.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total XP</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to Level {levelData.level + 1}</span>
            <span className="font-medium">{xpToNextLevel.toLocaleString()} XP needed</span>
          </div>
          <Progress value={levelData.progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{levelData.currentXP.toLocaleString()} XP</span>
            <span>{levelData.nextLevelXP.toLocaleString()} XP</span>
          </div>
        </div>

        {/* Today's progress */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm">Today's XP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">+{levelData.todayXP}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="h-7 text-xs"
            >
              {showActions ? 'Hide' : 'View'} Actions
            </Button>
          </div>
        </div>

        {/* Available XP Actions */}
        {showActions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 pt-2 border-t"
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">Available XP Actions</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {levelData.availableActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                >
                  <span className="flex-1">{action.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      +{action.xpReward} XP
                    </Badge>
                    {action.remaining !== undefined && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">
                              {action.remaining} left
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Daily limit remaining</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Level up animation placeholder */}
      {levelData.progress > 95 && (
        <motion.div
          className="absolute top-2 right-2"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Star className="h-5 w-5 text-yellow-500" />
        </motion.div>
      )}
    </Card>
  );
}