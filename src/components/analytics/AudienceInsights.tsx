'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  UserPlus,
  Target,
  Heart
} from 'lucide-react';
import type { AudienceMetrics } from '@/types/analytics';

interface Props {
  data: AudienceMetrics | undefined;
}

export function AudienceInsights({ data }: Props) {
  if (!data) return null;

  const deviceIcons = {
    mobile: Smartphone,
    desktop: Monitor,
    tablet: Tablet
  };

  return (
    <div className="space-y-6">
      {/* Audience Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audience</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(data.totalAudience / 1000).toFixed(1)}K</div>
            <div className="text-xs text-green-500 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{(data.audienceGrowth / 1000).toFixed(1)}K this period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.audienceGrowthRate}%</div>
            <div className="text-xs text-muted-foreground">monthly growth</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.engagementRate}%</div>
            <div className="text-xs text-muted-foreground">active audience</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.audienceRetention}%</div>
            <div className="text-xs text-muted-foreground">30-day retention</div>
          </CardContent>
        </Card>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Age Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.demographics.age).map(([range, percentage]) => (
              <div key={range} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{range}</span>
                  <span className="text-muted-foreground">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.demographics.gender).map(([gender, percentage]) => (
              <div key={gender} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{gender}</span>
                  <span className="text-muted-foreground">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Location & Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Locations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Top Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.demographics.location)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([location, percentage]) => (
                <div key={location} className="flex items-center justify-between">
                  <span className="text-sm">{location}</span>
                  <Badge variant="secondary">{percentage}%</Badge>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Device Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Device Usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.demographics.devices).map(([device, percentage]) => {
              const Icon = deviceIcons[device as keyof typeof deviceIcons] || Monitor;
              
              return (
                <div key={device} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm capitalize">{device}</span>
                  </div>
                  <Badge variant="secondary">{percentage}%</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Top Fans */}
      {data.topFans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Fans</CardTitle>
            <CardDescription>Your most engaged followers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topFans.map((fan) => (
                <div key={fan.id} className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={`https://avatar.vercel.sh/${fan.username}`} />
                    <AvatarFallback>{fan.username[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{fan.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {fan.totalInteractions} interactions • {fan.platform}
                    </p>
                  </div>
                  {fan.isPremiumSupporter && (
                    <Badge variant="default">Premium</Badge>
                  )}
                  <Badge variant="outline">Score: {fan.engagementScore}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}