import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { getUserSubscriptionStatus } from '@/lib/stripe';
import { AnalyticsSyncService } from '@/lib/services/analytics-sync-service';
import AnalyticsClient from './AnalyticsClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | CreatorCompass',
  description: 'Track your performance and growth across all platforms with advanced analytics and insights.',
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect('/auth/signin?callbackUrl=/analytics');
  }

  // Check if user has premium subscription
  const subscriptionStatus = await getUserSubscriptionStatus(session.user.id);
  
  if (!subscriptionStatus.isPro && !subscriptionStatus.isStudio) {
    // Show upgrade page for free users
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold">Advanced Analytics</h1>
            <p className="text-xl text-muted-foreground">
              Unlock powerful insights to grow your creator business
            </p>
            
            <div className="bg-card rounded-lg p-8 border">
              <h2 className="text-2xl font-semibold mb-4">Analytics Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-8">
                <div>
                  <h3 className="font-medium mb-2">📊 Performance Metrics</h3>
                  <p className="text-sm text-muted-foreground">
                    Track views, engagement, and growth across all platforms
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">👥 Audience Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Understand your audience demographics and behavior
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">🎯 Competitor Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Compare your performance with competitors
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">📈 Growth Predictions</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-powered forecasts and recommendations
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Analytics is available with Pro and Studio plans
                </p>
                <a 
                  href="/pricing" 
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  Upgrade to Pro
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get cross-platform analytics
  const analyticsSyncService = new AnalyticsSyncService();
  let crossPlatformAnalytics = await analyticsSyncService.getCachedAnalytics(session.user.id);
  
  // If no cached data or it's older than 1 hour, sync fresh data
  if (!crossPlatformAnalytics || 
      !crossPlatformAnalytics.lastSyncedAt || 
      new Date(crossPlatformAnalytics.lastSyncedAt).getTime() < Date.now() - 60 * 60 * 1000) {
    try {
      crossPlatformAnalytics = await analyticsSyncService.syncAllPlatforms(session.user.id);
    } catch (error) {
      console.error('Failed to sync analytics:', error);
      // If sync fails, use cached data if available
      if (!crossPlatformAnalytics) {
        crossPlatformAnalytics = {
          totalViews: 0,
          totalFollowers: 0,
          totalEngagement: 0,
          totalPosts: 0,
          platforms: {},
          growthTrends: {
            followers: { daily: 0, weekly: 0, monthly: 0 },
            views: { daily: 0, weekly: 0, monthly: 0 },
          },
          topContent: [],
          lastSyncedAt: new Date(),
        };
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="platform" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="platform">Platform Analytics</TabsTrigger>
          <TabsTrigger value="creator">Creator Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="platform">
          <AnalyticsClient initialAnalytics={crossPlatformAnalytics} userId={session.user.id} />
        </TabsContent>
        
        <TabsContent value="creator">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}