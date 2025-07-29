'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  MessageSquare,
  DollarSign,
  Activity,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { AnalyticsData } from '@/types/analytics';

interface Props {
  data: AnalyticsData | null;
}

export function AnalyticsOverview({ data }: Props) {
  if (!data) return null;

  const metrics = [
    {
      title: 'Total Views',
      value: '2.5M',
      change: '+12.5%',
      trend: 'up' as const,
      icon: Eye,
      color: 'text-blue-500'
    },
    {
      title: 'Total Followers',
      value: '65K',
      change: '+8.5%',
      trend: 'up' as const,
      icon: Users,
      color: 'text-green-500'
    },
    {
      title: 'Engagement Rate',
      value: '5.8%',
      change: '-0.2%',
      trend: 'down' as const,
      icon: MessageSquare,
      color: 'text-purple-500'
    },
    {
      title: 'Revenue',
      value: '$3,500',
      change: '+25%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'text-yellow-500'
    }
  ];

  const recommendations = data.recommendations.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === 'up' ? ArrowUp : metric.trend === 'down' ? ArrowDown : Minus;
          const trendColor = metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-gray-500';

          return (
            <motion.div
              key={metric.title}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <div className={`flex items-center text-xs ${trendColor}`}>
                    <TrendIcon className="h-3 w-3 mr-1" />
                    {metric.change} from last period
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Your overall performance across all platforms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Content Quality Score</span>
              <span className="text-sm text-muted-foreground">{data.metrics.contentQualityScore}/100</span>
            </div>
            <Progress value={data.metrics.contentQualityScore} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Published Content</p>
              <p className="text-2xl font-bold">{data.metrics.publishedContent}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scheduled Content</p>
              <p className="text-2xl font-bold">{data.metrics.scheduledContent}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Recommendations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top Recommendations</CardTitle>
            <CardDescription>
              Actions to improve your performance
            </CardDescription>
          </div>
          <Activity className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start gap-4 p-3 rounded-lg border"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{rec.title}</h4>
                  <Badge variant={rec.impact === 'high' ? 'destructive' : rec.impact === 'medium' ? 'default' : 'secondary'}>
                    {rec.impact} impact
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rec.description}</p>
                {rec.expectedResults.length > 0 && (
                  <p className="text-sm text-green-600">
                    Expected: {rec.expectedResults[0].metric} +{Math.round(((rec.expectedResults[0].expectedValue - rec.expectedResults[0].currentValue) / rec.expectedResults[0].currentValue) * 100)}%
                  </p>
                )}
              </div>
              <div className="text-right">
                <Badge variant="outline">Priority {rec.priority}/10</Badge>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Platform Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Content by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.metrics.contentByPlatform).map(([platform, count]) => {
                const total = Object.values(data.metrics.contentByPlatform).reduce((a, b) => a + b, 0);
                const percentage = (count / total) * 100;
                
                return (
                  <div key={platform} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{platform}</span>
                      <span className="text-muted-foreground">{count} posts</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.metrics.contentByType).map(([type, count]) => {
                const total = Object.values(data.metrics.contentByType).reduce((a, b) => a + b, 0);
                const percentage = (count / total) * 100;
                
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize">{type}</span>
                      <span className="text-muted-foreground">{count} items</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}