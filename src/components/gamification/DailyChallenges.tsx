'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target,
  CheckCircle2,
  Clock,
  Trophy,
  Zap,
  ChevronRight,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  requirements: Array<{
    type: string;
    target: string;
    count: number;
    description: string;
  }>;
  rewards: Array<{
    type: string;
    value: string | number;
    description: string;
  }>;
  expiresAt: Date;
  metadata?: {
    progress: number;
    status: string;
    completedAt?: Date;
    claimedAt?: Date;
  };
}

const DIFFICULTY_CONFIG = {
  easy: { color: 'text-green-600 bg-green-50 dark:bg-green-900/20', icon: '⭐' },
  medium: { color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20', icon: '⭐⭐' },
  hard: { color: 'text-red-600 bg-red-50 dark:bg-red-900/20', icon: '⭐⭐⭐' }
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  content: Target,
  engagement: Zap,
  learning: Star,
  community: Trophy
};

export function DailyChallenges({ className }: { className?: string }) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);

  useEffect(() => {
    fetchChallenges();
    const interval = setInterval(fetchChallenges, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/gamification/challenges/active');
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges);
      }
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/gamification/challenges/${challengeId}/claim`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchChallenges(); // Refresh to show updated state
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
    }
  };

  const getTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const hours = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60)) % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Daily Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Daily Challenges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No active challenges</p>
            <p className="text-sm text-muted-foreground mt-2">Check back tomorrow!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Daily Challenges
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            Resets in {getTimeRemaining(challenges[0].expiresAt)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence mode="sync">
          {challenges.map((challenge, index) => {
            const Icon = CATEGORY_ICONS[challenge.category] || Target;
            const isCompleted = challenge.metadata?.status === 'completed';
            const isClaimed = challenge.metadata?.claimedAt;
            const isExpanded = expandedChallenge === challenge.id;

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "relative overflow-hidden transition-all cursor-pointer",
                    "hover:shadow-md",
                    isCompleted && "bg-muted/50"
                  )}
                  onClick={() => setExpandedChallenge(isExpanded ? null : challenge.id)}
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        isCompleted ? "bg-green-50 dark:bg-green-900/20" : "bg-muted"
                      )}>
                        <Icon className={cn(
                          "h-4 w-4",
                          isCompleted ? "text-green-600" : "text-muted-foreground"
                        )} />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-sm">{challenge.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {challenge.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", DIFFICULTY_CONFIG[challenge.difficulty].color)}
                            >
                              {DIFFICULTY_CONFIG[challenge.difficulty].icon}
                            </Badge>
                            <ChevronRight className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isExpanded && "rotate-90"
                            )} />
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="mt-2">
                          <Progress 
                            value={challenge.metadata?.progress || 0} 
                            className="h-1.5"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {challenge.metadata?.progress || 0}% complete
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t space-y-3"
                        >
                          {/* Requirements */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Requirements</p>
                            <div className="space-y-1">
                              {challenge.requirements.map((req, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs">
                                  <CheckCircle2 className={cn(
                                    "h-3 w-3",
                                    challenge.metadata?.progress === 100 
                                      ? "text-green-600" 
                                      : "text-muted-foreground"
                                  )} />
                                  <span>{req.description}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Rewards */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">Rewards</p>
                            <div className="flex flex-wrap gap-1.5">
                              {challenge.rewards.map((reward, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {reward.description}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Action button */}
                          {isCompleted && !isClaimed && (
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                claimReward(challenge.id);
                              }}
                            >
                              Claim Rewards
                            </Button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Completed overlay */}
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2"
                    >
                      <div className="bg-green-500 text-white rounded-full p-1">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <Link href="/achievements/challenges">
          <Button variant="ghost" size="sm" className="w-full mt-2">
            View All Challenges
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}