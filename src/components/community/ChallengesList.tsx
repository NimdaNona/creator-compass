'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy,
  Target,
  Clock,
  Users,
  Star,
  Award,
  Zap,
  TrendingUp,
  Calendar,
  DollarSign,
  Gift,
  Medal,
  Crown,
  Sparkles,
  CheckCircle,
  Upload
} from 'lucide-react';
import { CommunityChallenge, ChallengeType, ChallengeStatus } from '@/types/community';
import { format, formatDistanceToNow, differenceInDays, isPast } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ChallengesListProps {
  challenges: CommunityChallenge[];
  loading: boolean;
  onRefresh?: () => void;
}

export function ChallengesList({ challenges, loading, onRefresh }: ChallengesListProps) {
  const [participatingChallenges, setParticipatingChallenges] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('active');

  const handleParticipate = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/community/challenges/${challengeId}/participate`, {
        method: 'POST'
      });

      if (response.ok) {
        setParticipatingChallenges(prev => new Set(prev).add(challengeId));
        onRefresh?.();
      }
    } catch (error) {
      console.error('Failed to participate in challenge:', error);
    }
  };

  const getChallengeTypeIcon = (type: ChallengeType) => {
    switch (type) {
      case ChallengeType.CONTENT:
        return <Zap className="h-4 w-4" />;
      case ChallengeType.GROWTH:
        return <TrendingUp className="h-4 w-4" />;
      case ChallengeType.CREATIVITY:
        return <Sparkles className="h-4 w-4" />;
      case ChallengeType.ENGAGEMENT:
        return <Users className="h-4 w-4" />;
      case ChallengeType.TECHNICAL:
        return <Target className="h-4 w-4" />;
      case ChallengeType.EDUCATIONAL:
        return <Award className="h-4 w-4" />;
      default:
        return <Trophy className="h-4 w-4" />;
    }
  };

  const getChallengeTypeColor = (type: ChallengeType) => {
    const colors: Record<ChallengeType, string> = {
      [ChallengeType.CONTENT]: 'bg-blue-500/10 text-blue-500',
      [ChallengeType.GROWTH]: 'bg-green-500/10 text-green-500',
      [ChallengeType.CREATIVITY]: 'bg-purple-500/10 text-purple-500',
      [ChallengeType.ENGAGEMENT]: 'bg-orange-500/10 text-orange-500',
      [ChallengeType.TECHNICAL]: 'bg-red-500/10 text-red-500',
      [ChallengeType.EDUCATIONAL]: 'bg-indigo-500/10 text-indigo-500',
      [ChallengeType.COMMUNITY]: 'bg-pink-500/10 text-pink-500',
      [ChallengeType.OTHER]: 'bg-gray-500/10 text-gray-500'
    };
    return colors[type] || 'bg-gray-500/10 text-gray-500';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-500/10 text-green-500';
      case 'intermediate':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'advanced':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getPrizeIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <DollarSign className="h-3 w-3" />;
      case 'product':
        return <Gift className="h-3 w-3" />;
      case 'service':
        return <Star className="h-3 w-3" />;
      case 'recognition':
        return <Award className="h-3 w-3" />;
      default:
        return <Trophy className="h-3 w-3" />;
    }
  };

  const getTimeRemaining = (endDate: Date) => {
    const days = differenceInDays(endDate, new Date());
    if (days > 7) return `${Math.floor(days / 7)} weeks`;
    if (days > 0) return `${days} days`;
    const hours = Math.floor((endDate.getTime() - Date.now()) / (1000 * 60 * 60));
    if (hours > 0) return `${hours} hours`;
    return 'Ending soon';
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 w-3/4 bg-muted animate-pulse mb-2" />
              <div className="h-4 w-1/2 bg-muted animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-20 w-full bg-muted animate-pulse mb-4" />
              <div className="h-8 w-full bg-muted animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No challenges available</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to create a challenge for the community!
          </p>
          <Button>
            <Trophy className="h-4 w-4 mr-2" />
            Create Challenge
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Filter challenges by status
  const activeChallenges = challenges.filter(
    c => c.status === ChallengeStatus.ACTIVE || c.status === ChallengeStatus.UPCOMING
  );
  const completedChallenges = challenges.filter(
    c => c.status === ChallengeStatus.COMPLETED || c.status === ChallengeStatus.JUDGING
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="gap-2">
            <Zap className="h-4 w-4" />
            Active Challenges ({activeChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedChallenges.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {activeChallenges.map((challenge) => {
                const isParticipating = participatingChallenges.has(challenge.id);
                const daysRemaining = differenceInDays(new Date(challenge.endDate), new Date());
                const progress = challenge.participants
                  ? (challenge.participants.length / 100) * 100
                  : 0;

                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg line-clamp-1">
                              {challenge.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={challenge.creator.image} />
                                <AvatarFallback className="text-xs">
                                  {challenge.creator.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-muted-foreground">
                                by {challenge.creator.name}
                              </span>
                            </div>
                          </div>
                          {challenge.isFeatured && (
                            <Star className="h-5 w-5 text-yellow-500 fill-current" />
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {challenge.description}
                        </p>

                        <div className="flex flex-wrap gap-2">
                          <Badge className={getChallengeTypeColor(challenge.type)}>
                            {getChallengeTypeIcon(challenge.type)}
                            <span className="ml-1">{challenge.type}</span>
                          </Badge>
                          <Badge className={getDifficultyColor(challenge.difficulty)}>
                            {challenge.difficulty}
                          </Badge>
                        </div>

                        {/* Prize Preview */}
                        {challenge.prizes && challenge.prizes.length > 0 && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs font-medium mb-2">Top Prize:</p>
                            <div className="flex items-center gap-2">
                              {challenge.prizes[0].place === 1 && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                              <div className="flex items-center gap-1 text-sm">
                                {getPrizeIcon(challenge.prizes[0].type)}
                                <span className="font-medium">{challenge.prizes[0].title}</span>
                              </div>
                            </div>
                            {challenge.prizes.length > 1 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                +{challenge.prizes.length - 1} more prizes
                              </p>
                            )}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{challenge.participants?.length || 0} joined</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{getTimeRemaining(new Date(challenge.endDate))}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {challenge.status === ChallengeStatus.ACTIVE && (
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Participation</span>
                              <span>{challenge.participants?.length || 0} creators</span>
                            </div>
                            <Progress value={Math.min(progress, 100)} className="h-2" />
                          </div>
                        )}
                      </CardContent>

                      <CardFooter className="border-t pt-4">
                        <div className="flex items-center justify-between w-full">
                          <Link href={`/community/challenges/${challenge.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                          {challenge.status === ChallengeStatus.ACTIVE && (
                            <Button
                              size="sm"
                              onClick={() => handleParticipate(challenge.id)}
                              disabled={isParticipating}
                            >
                              {isParticipating ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Joined
                                </>
                              ) : (
                                <>
                                  <Zap className="h-4 w-4 mr-1" />
                                  Join
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedChallenges.map((challenge) => (
              <Card key={challenge.id} className="opacity-75">
                <CardHeader>
                  <h3 className="font-semibold line-clamp-1">{challenge.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span>Ended {formatDistanceToNow(new Date(challenge.endDate), { addSuffix: true })}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Winners */}
                    {challenge.winners && challenge.winners.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Winners:</p>
                        {challenge.winners.slice(0, 3).map((winner, index) => (
                          <div key={winner.userId} className="flex items-center gap-2">
                            {index === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                            {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                            {index === 2 && <Medal className="h-4 w-4 text-orange-600" />}
                            <span className="text-sm">
                              #{winner.rank} - {winner.score} points
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="pt-2">
                      <Link href={`/community/challenges/${challenge.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Results
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Challenge CTA */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="text-center py-8">
          <Trophy className="h-12 w-12 mx-auto text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Host Your Own Challenge</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Create engaging challenges to inspire the community and help creators grow together
          </p>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Create Challenge
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}