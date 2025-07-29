'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  MessageSquare,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

export function AnalyticsPreview() {
  const metrics = [
    {
      title: 'Total Views',
      value: '2.5M',
      change: '+12.5%',
      icon: Eye,
      color: 'text-blue-500'
    },
    {
      title: 'Followers',
      value: '65K',
      change: '+8.5%',
      icon: Users,
      color: 'text-green-500'
    },
    {
      title: 'Engagement',
      value: '5.8%',
      change: '+0.3%',
      icon: MessageSquare,
      color: 'text-purple-500'
    }
  ];

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Overview
          </CardTitle>
          <CardDescription>
            Your performance across all platforms
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/analytics" className="flex items-center gap-1">
            View Details
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            
            return (
              <div key={metric.title} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <Badge variant={metric.change.startsWith('+') ? 'default' : 'secondary'} className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {metric.change}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Performance Score: <span className="font-medium text-foreground">85/100</span>
            </p>
            <p className="text-muted-foreground">
              Updated <span className="font-medium text-foreground">5 mins ago</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}