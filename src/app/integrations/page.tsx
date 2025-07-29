import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PlatformConnectionsList } from '@/components/platform-connections/PlatformConnectionsList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Rocket, Zap, Shield, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Integrations | CreatorCompass',
  description: 'Connect your social media accounts to manage content across platforms',
};

export default async function IntegrationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const isPremium = session.user.subscriptionStatus === 'active';

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Platform Integrations</h1>
        <p className="text-muted-foreground">
          Connect your social media accounts to publish content, sync analytics, and grow your audience across platforms.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <Rocket className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-base">Cross-Platform Publishing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Publish content to multiple platforms with one click
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <BarChart3 className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-base">Unified Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track performance across all platforms in one dashboard
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Zap className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-base">Smart Scheduling</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Schedule posts for optimal engagement times
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <Shield className="h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-base">Secure OAuth</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Industry-standard security for your accounts
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="connections" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connections">My Connections</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-6">
          {/* Free tier limit notice */}
          {!isPremium && (
            <Alert>
              <AlertDescription>
                <strong>Free Tier:</strong> Connect up to 2 platforms. Upgrade to Pro for unlimited connections and advanced features.
              </AlertDescription>
            </Alert>
          )}

          {/* Connections list */}
          <PlatformConnectionsList 
            onUpgrade={() => window.location.href = '/pricing'}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Integration Settings</CardTitle>
              <CardDescription>
                Configure how your platforms work together
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Default Privacy Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Choose default visibility for new posts across platforms
                </p>
                {/* Add privacy settings controls here */}
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Auto-sync Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically sync analytics data every 24 hours
                </p>
                {/* Add auto-sync toggle here */}
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Cross-posting Rules</h3>
                <p className="text-sm text-muted-foreground">
                  Set rules for adapting content between platforms
                </p>
                {/* Add cross-posting rules here */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}