'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trophy, Lock, CheckCircle2, Share2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface Milestone {
  id: string;
  name: string;
  description: string;
  requirement: {
    type: 'task_completion' | 'metric_achievement' | 'time_based';
    value: number | string;
  };
  reward: {
    type: 'badge' | 'feature_unlock' | 'template_access';
    value: string;
  };
  celebration: {
    type: 'modal' | 'confetti' | 'notification';
    message: string;
    sharePrompt?: string;
  };
  platform?: string;
  niche?: string;
  orderIndex: number;
}

interface MilestoneAchievement {
  id: string;
  milestoneId: string;
  achievedAt: string;
  shared: boolean;
  milestone: Milestone;
}

export default function MilestoneTracker() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [achievements, setAchievements] = useState<MilestoneAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebratingMilestone, setCelebratingMilestone] = useState<Milestone | null>(null);
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    fetchMilestones();
    fetchUserStats();
  }, []);

  const fetchMilestones = async () => {
    try {
      const response = await fetch('/api/milestones');
      if (!response.ok) throw new Error('Failed to fetch milestones');
      
      const data = await response.json();
      setMilestones(data.milestones);
      setAchievements(data.achievements);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast.error('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      if (!response.ok) throw new Error('Failed to fetch user stats');
      
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const getProgress = (milestone: Milestone): number => {
    if (!userStats) return 0;

    switch (milestone.requirement.type) {
      case 'task_completion':
        const requiredTasks = parseInt(milestone.requirement.value as string);
        return Math.min((userStats.totalTasksCompleted / requiredTasks) * 100, 100);
      
      case 'metric_achievement':
        const value = milestone.requirement.value as string;
        if (value.includes('_subscribers')) {
          const required = parseInt(value);
          return Math.min((userStats.subscribers / required) * 100, 100);
        }
        if (value === '7_day_streak') {
          return Math.min((userStats.streakDays / 7) * 100, 100);
        }
        return 0;
      
      case 'time_based':
        const requiredDays = parseInt(milestone.requirement.value as string);
        const daysSinceStart = userStats.daysSinceStart || 0;
        return Math.min((daysSinceStart / requiredDays) * 100, 100);
      
      default:
        return 0;
    }
  };

  const handleShare = async (achievement: MilestoneAchievement) => {
    try {
      // Share to social media or copy link
      await navigator.clipboard.writeText(
        `I just unlocked "${achievement.milestone.name}" on CreatorCompass! 🎉`
      );
      toast.success('Achievement copied to clipboard!');
      
      // Update shared status
      await fetch(`/api/milestones/${achievement.id}/share`, {
        method: 'POST'
      });
    } catch (error) {
      toast.error('Failed to share achievement');
    }
  };

  const celebrateMilestone = (milestone: Milestone) => {
    setCelebratingMilestone(milestone);
    
    if (milestone.celebration.type === 'confetti') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const achievedMilestoneIds = new Set(achievements.map(a => a.milestoneId));

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="space-y-3">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Milestones
            </h3>
            <Badge variant="secondary">
              {achievements.length} / {milestones.length} unlocked
            </Badge>
          </div>

          <div className="space-y-3">
            {milestones.map(milestone => {
              const isAchieved = achievedMilestoneIds.has(milestone.id);
              const progress = getProgress(milestone);
              const achievement = achievements.find(a => a.milestoneId === milestone.id);

              return (
                <div
                  key={milestone.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    isAchieved ? "bg-muted/50 border-green-500/50" : "bg-background"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {isAchieved ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        ) : progress === 100 ? (
                          <Sparkles className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5 animate-pulse" />
                        ) : (
                          <Lock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <h4 className="font-medium">{milestone.name}</h4>
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                          {milestone.reward.type === 'badge' && (
                            <Badge variant="outline" className="text-xs">
                              🏅 {milestone.reward.value}
                            </Badge>
                          )}
                          {milestone.reward.type === 'feature_unlock' && (
                            <Badge variant="outline" className="text-xs">
                              🔓 Unlocks: {milestone.reward.value}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isAchieved && achievement && !achievement.shared && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleShare(achievement)}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {!isAchieved && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                        {progress === 100 && (
                          <p className="text-xs text-green-600 font-medium animate-pulse">
                            Ready to unlock! Complete one more task to claim.
                          </p>
                        )}
                      </div>
                    )}

                    {isAchieved && achievement && (
                      <p className="text-xs text-muted-foreground">
                        Achieved on {new Date(achievement.achievedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Celebration Dialog */}
      <Dialog open={!!celebratingMilestone} onOpenChange={() => setCelebratingMilestone(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              🎉 Milestone Unlocked!
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              <div className="space-y-4">
                <Trophy className="h-16 w-16 text-yellow-500 mx-auto animate-bounce" />
                <h3 className="text-xl font-semibold text-foreground">
                  {celebratingMilestone?.name}
                </h3>
                <p>{celebratingMilestone?.celebration.message}</p>
                {celebratingMilestone?.reward.type === 'badge' && (
                  <Badge className="mx-auto" variant="default">
                    🏅 New Badge: {celebratingMilestone.reward.value}
                  </Badge>
                )}
                {celebratingMilestone?.reward.type === 'feature_unlock' && (
                  <Badge className="mx-auto" variant="default">
                    🔓 Unlocked: {celebratingMilestone.reward.value}
                  </Badge>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setCelebratingMilestone(null)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                if (celebratingMilestone) {
                  const achievement = achievements.find(
                    a => a.milestoneId === celebratingMilestone.id
                  );
                  if (achievement) handleShare(achievement);
                }
                setCelebratingMilestone(null);
              }}
            >
              Share Achievement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}