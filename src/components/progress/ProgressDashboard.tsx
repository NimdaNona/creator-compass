'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Calendar,
  BarChart3,
  Trophy,
  Zap,
  AlertCircle
} from 'lucide-react';
import { progressAnalytics, type ProgressAnalytics } from '@/lib/progress-analytics';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function ProgressDashboard() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      fetchAnalytics();
    }
  }, [session]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/progress/analytics');
      
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load progress analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ProgressDashboardSkeleton />;
  }

  if (error || !analytics) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>{error || 'No analytics data available'}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
              <p className="text-2xl font-bold">{analytics.overview.totalTasksCompleted}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.overview.averageTasksPerDay.toFixed(1)} per day
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Target className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <p className="text-2xl font-bold">{analytics.overview.currentStreak} days</p>
              <p className="text-xs text-muted-foreground mt-1">
                Best: {analytics.overview.longestStreak} days
              </p>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <Zap className="h-6 w-6 text-orange-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Time Invested</p>
              <p className="text-2xl font-bold">
                {Math.floor(analytics.overview.totalTimeSpent / 60)}h
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.overview.totalTimeSpent % 60}m total
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Clock className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Quality Score</p>
              <p className="text-2xl font-bold">
                {analytics.overview.averageQualityScore.toFixed(1)}/5
              </p>
              <QualityTrend trend={analytics.qualityMetrics.qualityTrend} />
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Trophy className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weekly">Weekly Progress</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Completion Rate */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Completion Rate</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{analytics.overview.completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={analytics.overview.completionRate} className="h-2" />
            </div>
          </Card>

          {/* Platform Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Platform Progress</h3>
            <div className="space-y-4">
              {analytics.platformStats.map((platform) => (
                <div key={platform.platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{platform.platform}</Badge>
                      <span className="text-sm">
                        {platform.tasksCompleted} tasks
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {platform.milestonesAchieved} milestones
                    </span>
                  </div>
                  {platform.nextMilestone && (
                    <p className="text-xs text-muted-foreground">
                      Next: {platform.nextMilestone}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Time Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Time Patterns</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Most Productive Time
                </p>
                <p className="text-lg font-medium">
                  {analytics.timeAnalysis.mostProductiveHour}:00 - 
                  {analytics.timeAnalysis.mostProductiveHour + 1}:00
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Most Productive Day
                </p>
                <p className="text-lg font-medium">
                  {analytics.timeAnalysis.mostProductiveDay}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Average Session
                </p>
                <p className="text-lg font-medium">
                  {analytics.timeAnalysis.averageSessionLength} minutes
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Days Active
                </p>
                <p className="text-lg font-medium">
                  {analytics.timeAnalysis.totalDaysActive} days
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Weekly Progress</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.weeklyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="week" 
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tasksCompleted"
                    stroke="#8b5cf6"
                    name="Tasks Completed"
                  />
                  <Line
                    type="monotone"
                    dataKey="qualityScore"
                    stroke="#10b981"
                    name="Quality Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Task Categories</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {analytics.categoryBreakdown.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="capitalize">{category.category}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {category.count} tasks • {category.averageTime}m avg
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Progress Predictions</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Current Pace</p>
                  <p className="text-sm text-muted-foreground">
                    Based on your activity patterns
                  </p>
                </div>
                <Badge
                  variant={
                    analytics.predictions.currentPace === 'ahead' ? 'default' :
                    analytics.predictions.currentPace === 'on-track' ? 'secondary' :
                    'destructive'
                  }
                  className="capitalize"
                >
                  {analytics.predictions.currentPace}
                </Badge>
              </div>

              {analytics.predictions.estimatedCompletionDate && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">
                    Estimated Completion Date
                  </p>
                  <p className="text-lg font-medium">
                    {format(new Date(analytics.predictions.estimatedCompletionDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              )}

              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">
                  Recommended Daily Tasks
                </p>
                <p className="text-lg font-medium">
                  {analytics.predictions.recommendedDailyTasks} tasks per day
                </p>
              </div>

              {analytics.predictions.projectedMilestones.length > 0 && (
                <div>
                  <p className="font-medium mb-3">Projected Milestones</p>
                  <div className="space-y-2">
                    {analytics.predictions.projectedMilestones.map((milestone) => (
                      <div
                        key={milestone.milestone}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <span className="text-sm">{milestone.milestone}</span>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(milestone.estimatedDate), 'MMM d')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QualityTrend({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  return (
    <div className={cn(
      "flex items-center gap-1 text-xs mt-1",
      trend === 'improving' && "text-green-600",
      trend === 'stable' && "text-muted-foreground",
      trend === 'declining' && "text-red-600"
    )}>
      {trend === 'improving' && <TrendingUp className="h-3 w-3" />}
      {trend === 'declining' && <TrendingDown className="h-3 w-3" />}
      <span className="capitalize">{trend}</span>
    </div>
  );
}

function ProgressDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-20" />
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <Skeleton className="h-64" />
      </Card>
    </div>
  );
}