'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  UserPlus,
  UserMinus,
  Target,
  Zap,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { GrowthMetrics as GrowthMetricsType } from '@/types/analytics';

interface Props {
  data: GrowthMetricsType | undefined;
}

export function GrowthMetrics({ data }: Props) {
  if (!data) return null;

  const growthRateColor = data.followerGrowthRate >= 0 ? 'text-green-500' : 'text-red-500';
  const growthIcon = data.followerGrowthRate >= 0 ? TrendingUp : TrendingDown;
  const GrowthIcon = growthIcon;

  // Calculate projected milestone date
  const daysToMilestone = data.projectedMilestones[0]?.estimatedDaysToReach || 0;
  const milestoneDate = new Date();
  milestoneDate.setDate(milestoneDate.getDate() + daysToMilestone);

  return (
    <div className="space-y-6">
      {/* Growth Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follower Growth</CardTitle>
            <GrowthIcon className={`h-4 w-4 ${growthRateColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.followerGrowthRate > 0 ? '+' : ''}{data.followerGrowthRate}%
            </div>
            <div className="text-xs text-muted-foreground">
              {data.newFollowers > 0 ? '+' : ''}{(data.newFollowers / 1000).toFixed(1)}K this period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.churnRate}%</div>
            <div className="text-xs text-muted-foreground">
              {data.lostFollowers} unfollows
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Growth</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              +{((data.newFollowers - data.lostFollowers) / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-muted-foreground">
              net followers gained
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Virality Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.viralityCoefficient}</div>
            <div className="text-xs text-muted-foreground">
              viral coefficient
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Historical Growth</CardTitle>
          <CardDescription>Your follower growth over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.historicalGrowth}>
                <defs>
                  <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="followers" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorFollowers)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Growth by Platform */}
      <Card>
        <CardHeader>
          <CardTitle>Growth by Platform</CardTitle>
          <CardDescription>Where your audience is growing fastest</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.growthByPlatform).map(([platform, metrics]) => {
              const isPositive = metrics.newFollowers > metrics.lostFollowers;
              const netGrowth = metrics.newFollowers - metrics.lostFollowers;
              const growthRate = metrics.growthRate;
              
              return (
                <div key={platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{platform}</span>
                      <Badge variant={isPositive ? 'default' : 'destructive'}>
                        {isPositive ? '+' : ''}{growthRate}%
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {isPositive ? '+' : ''}{(netGrowth / 1000).toFixed(1)}K
                      </div>
                      <div className="text-xs text-muted-foreground">
                        +{metrics.newFollowers} / -{metrics.lostFollowers}
                      </div>
                    </div>
                  </div>
                  <Progress value={Math.min(Math.abs(growthRate), 100)} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Projected Milestones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Projected Milestones
          </CardTitle>
          <CardDescription>When you'll reach your follower goals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.projectedMilestones.map((milestone) => {
              const estimatedDate = new Date();
              estimatedDate.setDate(estimatedDate.getDate() + milestone.estimatedDaysToReach);
              
              return (
                <div key={milestone.milestone} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {(milestone.milestone / 1000).toFixed(0)}K Followers
                      </h4>
                      <Badge variant="outline">
                        {milestone.platform === 'all' ? 'All Platforms' : milestone.platform}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Current: {(milestone.currentFollowers / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {milestone.estimatedDaysToReach} days
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {estimatedDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Acquisition Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Acquisition Sources</CardTitle>
          <CardDescription>Where your new followers come from</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(data.acquisitionSources).map(([source, count]) => {
              const percentage = (count / data.newFollowers) * 100;
              
              return (
                <div key={source} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{source.replace('_', ' ')}</span>
                    <span className="text-muted-foreground">
                      {(count / 1000).toFixed(1)}K ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}