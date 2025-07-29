import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ContentSchedulerService } from '@/lib/services/content-scheduler';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarPlus, BarChart3, Calendar, Settings } from 'lucide-react';
import { ScheduledPostsList } from '@/components/scheduling/ScheduledPostsList';
import SchedulingClient from './SchedulingClient';

export default async function SchedulingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Get user's platform connections
  const connections = await prisma.platformConnection.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
    },
  });

  // Get scheduled posts
  const schedulerService = new ContentSchedulerService();
  const scheduledPosts = await schedulerService.getScheduledPosts(session.user.id, {
    limit: 50,
  });

  // Get analytics
  const analytics = await schedulerService.getSchedulingAnalytics(session.user.id);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Scheduling</h1>
        <p className="text-muted-foreground">
          Schedule and manage your content across all connected platforms
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.publishedPosts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analytics.failedPosts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.successRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {connections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Platform Connections</h3>
            <p className="text-muted-foreground mb-4">
              Connect your social media accounts to start scheduling content
            </p>
            <Button onClick={() => window.location.href = '/integrations'}>
              Connect Platforms
            </Button>
          </CardContent>
        </Card>
      ) : (
        <SchedulingClient
          connections={connections}
          scheduledPosts={scheduledPosts}
        />
      )}
    </div>
  );
}