'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Eye, 
  Heart,
  MessageSquare,
  Share2,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import type { ContentMetrics } from '@/types/analytics';

interface Props {
  data: ContentMetrics | undefined;
}

export function ContentPerformance({ data }: Props) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Content Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalContent}</div>
            <div className="text-xs text-muted-foreground">
              {data.publishedContent} published, {data.scheduledContent} scheduled
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publishing Frequency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.publishingFrequency}</div>
            <div className="text-xs text-muted-foreground">posts per week</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Quality</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.contentQualityScore}/100</div>
            <div className="text-xs text-muted-foreground">overall score</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Content */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Content</CardTitle>
          <CardDescription>Your best content from this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topPerformingContent.map((content, index) => (
              <div
                key={content.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium line-clamp-1">{content.title}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {content.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {content.platform}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {(content.views / 1000).toFixed(1)}K views
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {(content.engagement / 1000).toFixed(1)}K
                    </span>
                    <span className="flex items-center gap-1">
                      <Share2 className="h-3 w-3" />
                      {content.shares}
                    </span>
                    {content.revenue && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        ${content.revenue.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{content.performanceScore}</div>
                  <div className="text-xs text-muted-foreground">score</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Underperforming Content */}
      {data.underperformingContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Underperforming Content</CardTitle>
            <CardDescription>Content that needs improvement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.underperformingContent.map((content) => (
                <div
                  key={content.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex-1 space-y-1">
                    <h4 className="font-medium line-clamp-1">{content.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {content.views} views
                      </span>
                      <span className="flex items-center gap-1 text-red-500">
                        <ArrowDownRight className="h-3 w-3" />
                        Below average
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Analyze
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}