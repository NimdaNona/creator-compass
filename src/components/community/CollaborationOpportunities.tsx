'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { 
  Users, 
  ArrowRight,
  Clock,
  Target,
  Sparkles,
  UserPlus,
  Youtube,
  Twitch,
  Instagram
} from 'lucide-react';
import Link from 'next/link';

export function CollaborationOpportunities() {
  // Mock data for preview
  const opportunities = [
    {
      id: '1',
      title: 'Gaming Content Collaboration',
      creator: {
        name: 'Alex Gaming',
        avatar: null,
        platform: 'youtube',
        followers: '15.2k'
      },
      type: 'content_exchange',
      description: 'Looking for fellow gaming creators to do monthly collab videos',
      requirements: ['10k+ subs', 'FPS games', 'Weekly uploads'],
      matchScore: 92,
      isNew: true,
      deadline: '2 days'
    },
    {
      id: '2',
      title: 'Podcast Guest Exchange',
      creator: {
        name: 'TechTalks',
        avatar: null,
        platform: 'twitch',
        followers: '8.5k'
      },
      type: 'cross_promotion',
      description: 'Tech podcast seeking guest exchanges with similar creators',
      requirements: ['Tech niche', 'Podcast experience', 'English speaker'],
      matchScore: 85,
      isNew: false,
      deadline: '1 week'
    },
    {
      id: '3',
      title: 'Instagram Reel Duets',
      creator: {
        name: 'FitnessFlow',
        avatar: null,
        platform: 'instagram',
        followers: '25k'
      },
      type: 'joint_content',
      description: 'Fitness creator seeking partners for motivation reel series',
      requirements: ['Fitness niche', 'Active on IG', 'Creative ideas'],
      matchScore: 78,
      isNew: false,
      deadline: '3 days'
    }
  ];

  const platformIcons = {
    youtube: Youtube,
    twitch: Twitch,
    instagram: Instagram
  };

  const typeColors = {
    content_exchange: 'blue',
    cross_promotion: 'green',
    joint_content: 'purple'
  };

  const typeLabels = {
    content_exchange: 'Content Exchange',
    cross_promotion: 'Cross Promotion',
    joint_content: 'Joint Content'
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaboration Opportunities
          </CardTitle>
          <CardDescription>
            Find creators to grow with
          </CardDescription>
        </div>
        <Button size="sm" asChild>
          <Link href="/community?tab=collaborations">
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {opportunities.map((opp, index) => {
          const PlatformIcon = platformIcons[opp.creator.platform];
          
          return (
            <motion.div
              key={opp.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-lg border hover:bg-accent/50 cursor-pointer transition-all hover:shadow-sm"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={opp.creator.avatar} />
                      <AvatarFallback>{opp.creator.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{opp.title}</h4>
                        {opp.isNew && (
                          <Badge variant="secondary" className="text-xs">New</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <PlatformIcon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {opp.creator.name} • {opp.creator.followers} followers
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-green-600">
                      <Target className="h-4 w-4" />
                      <span className="text-sm font-medium">{opp.matchScore}%</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {opp.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={typeColors[opp.type] as any}>
                      {typeLabels[opp.type]}
                    </Badge>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">{opp.deadline} left</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Apply
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* CTA */}
        <div className="pt-2">
          <Button size="sm" variant="outline" className="w-full" asChild>
            <Link href="/community?tab=collaborations">
              <Sparkles className="h-4 w-4 mr-2" />
              Create Your Own Collaboration
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}