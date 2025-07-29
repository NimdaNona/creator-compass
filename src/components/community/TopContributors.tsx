'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, Medal, Award } from 'lucide-react';
import Link from 'next/link';

interface Contributor {
  id: string;
  name: string;
  image?: string;
  posts: number;
  replies: number;
  likes: number;
  level: number;
  badges: string[];
}

interface TopContributorsProps {
  contributors: Contributor[];
}

export function TopContributors({ contributors }: TopContributorsProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 1:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 2:
        return <Trophy className="h-4 w-4 text-orange-600" />;
      default:
        return <Award className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getContributionScore = (contributor: Contributor) => {
    return contributor.posts * 3 + contributor.replies * 2 + contributor.likes;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top Contributors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contributors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Be the first contributor!
          </p>
        ) : (
          contributors.slice(0, 5).map((contributor, index) => (
            <Link
              key={contributor.id}
              href={`/profile/${contributor.id}`}
              className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={contributor.image} />
                  <AvatarFallback>
                    {contributor.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1">
                  {getRankIcon(index)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm truncate">
                    {contributor.name}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Lvl {contributor.level}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {getContributionScore(contributor)} contribution points
                </p>
              </div>
            </Link>
          ))
        )}

        {contributors.length > 5 && (
          <Link
            href="/community/leaderboard"
            className="block text-center text-sm text-primary hover:underline pt-2"
          >
            View full leaderboard
          </Link>
        )}
      </CardContent>
    </Card>
  );
}