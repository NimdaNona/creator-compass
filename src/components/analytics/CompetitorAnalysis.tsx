'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  TrendingUp,
  BarChart3,
  Target,
  Plus,
  Trash2,
  Eye,
  MessageSquare,
  Heart,
  ArrowUp,
  ArrowDown,
  Minus,
  AlertCircle
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import { useToast } from '@/components/ui/use-toast';
import type { CompetitorAnalysis as CompetitorAnalysisType, CompetitorData } from '@/types/analytics';

interface Props {
  data: CompetitorAnalysisType | undefined;
}

export function CompetitorAnalysis({ data }: Props) {
  const [newCompetitor, setNewCompetitor] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!data) return null;

  const handleAddCompetitor = async () => {
    if (!newCompetitor.trim()) return;

    try {
      setLoading(true);
      const response = await fetch('/api/analytics/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newCompetitor })
      });

      if (!response.ok) throw new Error('Failed to add competitor');

      toast({
        title: 'Competitor Added',
        description: `Successfully added ${newCompetitor} to your competitor list`
      });
      setNewCompetitor('');
      // Refresh analytics data
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add competitor',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCompetitor = async (competitorId: string) => {
    try {
      const response = await fetch(`/api/analytics/competitors/${competitorId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to remove competitor');

      toast({
        title: 'Competitor Removed',
        description: 'Successfully removed competitor from your list'
      });
      // Refresh analytics data
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove competitor',
        variant: 'destructive'
      });
    }
  };

  const getPositionIcon = (position: number) => {
    if (position > 0) return { icon: ArrowUp, color: 'text-green-500' };
    if (position < 0) return { icon: ArrowDown, color: 'text-red-500' };
    return { icon: Minus, color: 'text-gray-500' };
  };

  // Prepare radar chart data
  const radarData = [
    { metric: 'Followers', value: data.marketPosition.relativeSize * 100, fullMark: 100 },
    { metric: 'Engagement', value: data.averagePerformance.engagementRate * 10, fullMark: 100 },
    { metric: 'Growth', value: Math.min(data.averagePerformance.growthRate * 5, 100), fullMark: 100 },
    { metric: 'Content', value: data.averagePerformance.postingFrequency * 10, fullMark: 100 },
    { metric: 'Quality', value: data.averagePerformance.contentQuality, fullMark: 100 }
  ];

  return (
    <div className="space-y-6">
      {/* Market Position */}
      <Card>
        <CardHeader>
          <CardTitle>Market Position</CardTitle>
          <CardDescription>Your standing among competitors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Market Rank</p>
              <p className="text-4xl font-bold">#{data.marketPosition.rank}</p>
              <p className="text-xs text-muted-foreground">out of {data.competitors.length + 1}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Relative Size</p>
              <p className="text-4xl font-bold">{(data.marketPosition.relativeSize * 100).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">of leader's audience</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Growth Rank</p>
              <p className="text-4xl font-bold">#{data.marketPosition.growthRank}</p>
              <p className="text-xs text-muted-foreground">by growth rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitor Management */}
      <Card>
        <CardHeader>
          <CardTitle>Tracked Competitors</CardTitle>
          <CardDescription>Monitor your competition</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add competitor username"
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
              />
              <Button onClick={handleAddCompetitor} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>

            <div className="space-y-3">
              {data.competitors.map((competitor) => {
                const positionData = getPositionIcon(competitor.relativePosition);
                const PositionIcon = positionData.icon;

                return (
                  <div key={competitor.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://avatar.vercel.sh/${competitor.username}`} />
                        <AvatarFallback>{competitor.username[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{competitor.username}</h4>
                          <Badge variant="outline" className="text-xs">
                            {competitor.platform}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {(competitor.followers / 1000).toFixed(1)}K
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {competitor.growthRate}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            {competitor.engagementRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 ${positionData.color}`}>
                        <PositionIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {Math.abs(competitor.relativePosition)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveCompetitor(competitor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>How you compare across key metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar 
                    name="Your Performance" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.6} 
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Average Performance</CardTitle>
            <CardDescription>Industry benchmarks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Follower Count</span>
                <span>{(data.averagePerformance.followers / 1000).toFixed(1)}K avg</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Engagement Rate</span>
                <span>{data.averagePerformance.engagementRate}% avg</span>
              </div>
              <Progress value={data.averagePerformance.engagementRate * 10} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Growth Rate</span>
                <span>{data.averagePerformance.growthRate}% monthly</span>
              </div>
              <Progress value={data.averagePerformance.growthRate * 5} className="h-2" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Posting Frequency</span>
                <span>{data.averagePerformance.postingFrequency}/week</span>
              </div>
              <Progress value={data.averagePerformance.postingFrequency * 10} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitive Advantages */}
      <Card>
        <CardHeader>
          <CardTitle>Competitive Analysis</CardTitle>
          <CardDescription>Your strengths and opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                Your Strengths
              </h4>
              <div className="space-y-2">
                {data.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5" />
                    <p className="text-sm">{strength}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Opportunities */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Opportunities
              </h4>
              <div className="space-y-2">
                {data.opportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5" />
                    <p className="text-sm">{opportunity}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}