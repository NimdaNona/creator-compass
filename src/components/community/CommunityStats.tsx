'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Award,
  Zap,
  Heart
} from 'lucide-react';

interface CommunityStatsProps {
  stats: {
    totalMembers: number;
    totalPosts: number;
    totalReplies: number;
    activeDiscussions: number;
    weeklyGrowth: number;
    topContributors: any[];
  };
}

export function CommunityStats({ stats }: CommunityStatsProps) {
  const statCards = [
    {
      label: 'Community Members',
      value: stats.totalMembers.toLocaleString(),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      change: `+${stats.weeklyGrowth}% this week`
    },
    {
      label: 'Total Posts',
      value: stats.totalPosts.toLocaleString(),
      icon: MessageSquare,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      label: 'Active Discussions',
      value: stats.activeDiscussions.toLocaleString(),
      icon: Zap,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      label: 'Total Engagement',
      value: (stats.totalPosts + stats.totalReplies).toLocaleString(),
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  {stat.change && (
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-500">{stat.change}</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}