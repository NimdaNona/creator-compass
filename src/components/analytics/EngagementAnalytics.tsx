'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark,
  MousePointerClick,
  TrendingUp,
  Clock,
  Calendar,
  Smile,
  Frown,
  Meh
} from 'lucide-react';
import type { EngagementMetrics } from '@/types/analytics';

interface Props {
  data: EngagementMetrics | undefined;
}

export function EngagementAnalytics({ data }: Props) {
  if (!data) return null;

  const engagementIcons = {
    likes: Heart,
    comments: MessageSquare,
    shares: Share2,
    saves: Bookmark,
    clicks: MousePointerClick
  };

  const sentimentIcons = {
    positive: Smile,
    neutral: Meh,
    negative: Frown
  };

  const sentimentColors = {
    positive: 'text-green-500',
    neutral: 'text-yellow-500',
    negative: 'text-red-500'
  };

  return (
    <div className="space-y-6">
      {/* Engagement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagements</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.totalEngagements / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-muted-foreground">
              across all platforms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.engagementRate}%</div>
            <div className="text-xs text-muted-foreground">
              of audience engaged
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Post</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.averageEngagementPerPost / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-muted-foreground">
              engagements per post
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Breakdown</CardTitle>
          <CardDescription>Distribution of engagement types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.engagementByType).map(([type, count]) => {
              const Icon = engagementIcons[type as keyof typeof engagementIcons] || Heart;
              const percentage = (count / data.totalEngagements) * 100;
              
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium capitalize">{type}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        {(count / 1000).toFixed(1)}K
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Engagement by Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Best Times */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Best Times to Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.engagementByTime
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
                .map((time) => (
                  <div key={time.hour} className="flex items-center justify-between">
                    <span className="text-sm">
                      {time.hour}:00 - {time.hour + 1}:00
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress value={time.percentage} className="w-20 h-2" />
                      <Badge variant="secondary" className="text-xs">
                        {time.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Best Days */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Best Days to Post
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.engagementByDay
                .sort((a, b) => b.value - a.value)
                .map((day) => (
                  <div key={day.day} className="flex items-center justify-between">
                    <span className="text-sm">{day.day}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={day.percentage} className="w-20 h-2" />
                      <Badge variant="secondary" className="text-xs">
                        {day.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sentiment Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Audience Sentiment</CardTitle>
          <CardDescription>Analysis of audience reactions and comments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.sentimentAnalysis).map(([sentiment, percentage]) => {
              const Icon = sentimentIcons[sentiment as keyof typeof sentimentIcons];
              const color = sentimentColors[sentiment as keyof typeof sentimentColors];
              
              return (
                <div key={sentiment} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="text-sm font-medium capitalize">{sentiment}</span>
                    </div>
                    <span className="text-sm font-medium">{percentage}%</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              {data.sentimentAnalysis.positive > 70 
                ? "Your audience sentiment is very positive! Keep up the great work."
                : data.sentimentAnalysis.negative > 20
                ? "Consider addressing negative feedback to improve audience sentiment."
                : "Your audience sentiment is balanced. Focus on increasing positive interactions."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}