'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { 
  UserCheck, 
  ArrowRight,
  Star,
  Calendar,
  MessageSquare,
  TrendingUp,
  Award
} from 'lucide-react';
import Link from 'next/link';

export function MentorshipMatches() {
  // Mock data for preview
  const matches = [
    {
      id: '1',
      mentor: {
        name: 'Sarah Pro Creator',
        avatar: null,
        expertise: ['YouTube Growth', 'Content Strategy', 'Monetization'],
        rating: 4.9,
        sessions: 142,
        level: 45
      },
      matchScore: 95,
      status: 'available',
      nextAvailable: 'Today'
    },
    {
      id: '2',
      mentor: {
        name: 'Mike StreamMaster',
        avatar: null,
        expertise: ['Twitch Streaming', 'Community Building', 'Gaming'],
        rating: 4.8,
        sessions: 89,
        level: 38
      },
      matchScore: 88,
      status: 'busy',
      nextAvailable: 'Tomorrow'
    }
  ];

  const myMentorshipProfile = {
    isMentor: false,
    sessionsCompleted: 3,
    nextSession: '2 days',
    progress: 45
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Mentorship Program
          </CardTitle>
          <CardDescription>
            Learn from experienced creators
          </CardDescription>
        </div>
        <Button size="sm" asChild>
          <Link href="/community/mentorship">
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* My Progress */}
        {!myMentorshipProfile.isMentor && (
          <div className="p-3 rounded-lg bg-accent/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Your Mentorship Journey</span>
              <Badge variant="secondary">Mentee</Badge>
            </div>
            <Progress value={myMentorshipProfile.progress} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{myMentorshipProfile.sessionsCompleted} sessions completed</span>
              <span>Next: {myMentorshipProfile.nextSession}</span>
            </div>
          </div>
        )}

        {/* Top Matches */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Recommended Mentors</h4>
          {matches.map((match, index) => (
            <motion.div
              key={match.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-all"
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={match.mentor.avatar} />
                  <AvatarFallback>{match.mentor.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{match.mentor.name}</h5>
                        <div className="flex items-center gap-1">
                          <Award className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-muted-foreground">
                            Level {match.mentor.level}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs font-medium">{match.mentor.rating}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          • {match.mentor.sessions} sessions
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">{match.matchScore}%</span>
                      </div>
                      <Badge 
                        variant={match.status === 'available' ? 'default' : 'secondary'}
                        className="text-xs mt-1"
                      >
                        {match.nextAvailable}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {match.mentor.expertise.map(skill => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/community/mentorship/find">
              <Calendar className="h-4 w-4 mr-2" />
              Book Session
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/community/mentorship/become">
              <MessageSquare className="h-4 w-4 mr-2" />
              Become Mentor
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}