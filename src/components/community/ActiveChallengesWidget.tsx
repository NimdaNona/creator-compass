'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  ArrowRight,
  Clock,
  Users,
  Star,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react';
import Link from 'next/link';

export function ActiveChallengesWidget() {
  // Mock data for preview
  const challenges = [
    {
      id: '1',
      title: '30-Day Content Marathon',
      description: 'Post daily for 30 days and win exclusive rewards',
      type: 'consistency',
      difficulty: 'medium',
      participants: 234,
      daysLeft: 12,
      progress: 65,
      myRank: 15,
      totalRanks: 234,
      prizes: ['1000 XP', 'Marathon Badge', 'Pro Month'],
      isJoined: true
    },
    {
      id: '2',
      title: 'Viral Video Challenge',
      description: 'Create content that reaches 10k+ views',
      type: 'performance',
      difficulty: 'hard',
      participants: 156,
      daysLeft: 5,
      progress: 0,
      myRank: null,
      totalRanks: 156,
      prizes: ['2000 XP', 'Viral Creator Badge', '$100 Credit'],
      isJoined: false
    }
  ];

  const topPerformers = [
    { id: '1', name: 'Alex R.', score: 2450, avatar: null },
    { id: '2', name: 'Sarah M.', score: 2380, avatar: null },
    { id: '3', name: 'Mike T.', score: 2290, avatar: null }
  ];

  const difficultyColors = {
    easy: 'green',
    medium: 'yellow',
    hard: 'red'
  };

  const typeIcons = {
    consistency: Clock,
    performance: TrendingUp,
    creativity: Star,
    collaboration: Users
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Active Challenges
          </CardTitle>
          <CardDescription>
            Compete and grow together
          </CardDescription>
        </div>
        <Button size="sm" asChild>
          <Link href="/community?tab=challenges">
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Challenges */}
        <div className="space-y-3">
          {challenges.map((challenge, index) => {
            const TypeIcon = typeIcons[challenge.type];
            
            return (
              <motion.div
                key={challenge.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium">{challenge.title}</h5>
                      <Badge 
                        variant={difficultyColors[challenge.difficulty] as any}
                        className="text-xs"
                      >
                        {challenge.difficulty}
                      </Badge>
                      {challenge.isJoined && (
                        <Badge variant="secondary" className="text-xs">
                          Joined
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {challenge.description}
                    </p>
                  </div>
                  <TypeIcon className="h-5 w-5 text-muted-foreground" />
                </div>

                {challenge.isJoined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Your Progress</span>
                      <span className="font-medium">{challenge.progress}%</span>
                    </div>
                    <Progress value={challenge.progress} className="h-2" />
                    {challenge.myRank && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Rank #{challenge.myRank} of {challenge.totalRanks}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          <Award className="h-3 w-3 mr-1" />
                          Top {Math.round((challenge.myRank / challenge.totalRanks) * 100)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{challenge.participants} participants</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{challenge.daysLeft} days left</span>
                    </div>
                  </div>
                  {!challenge.isJoined && (
                    <Button size="sm" variant="ghost">
                      <Zap className="h-4 w-4 mr-1" />
                      Join
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Leaderboard Preview */}
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Top Performers
          </h4>
          <div className="space-y-2">
            {topPerformers.map((performer, index) => (
              <div key={performer.id} className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground w-4">
                  {index + 1}
                </span>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={performer.avatar} />
                  <AvatarFallback className="text-xs">{performer.name[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm flex-1">{performer.name}</span>
                <span className="text-sm font-medium">{performer.score}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}