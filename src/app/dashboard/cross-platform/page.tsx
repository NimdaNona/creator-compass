'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CrossPlatformManager from '@/components/content/CrossPlatformManager';
import { FeaturePreview } from '@/components/upgrade/FeaturePreview';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

export default function CrossPlatformPage() {
  const { data: session } = useSession();
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'studio'>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      checkSubscription();
    }
  }, [session]);

  const checkSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionTier(data.tier || 'free');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (subscriptionTier === 'free') {
    return (
      <div className="container max-w-6xl mx-auto p-6 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Cross-Platform Content Sync</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Expand your reach by adapting and syncing content across YouTube, TikTok, and Twitch
          </p>
        </div>

        <FeaturePreview
          feature="Cross-Platform Content Management"
          description="Adapt your content for different platforms with AI-powered suggestions and one-click sync"
          upgradeMessage="Upgrade to Pro to unlock cross-platform content features"
          variant="card"
        />

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent" />
            <CardHeader>
              <CardTitle>Smart Adaptation</CardTitle>
              <CardDescription>
                Automatically adapt content format, duration, and style for each platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• YouTube to TikTok series</li>
                <li>• TikTok compilations for YouTube</li>
                <li>• Stream highlights for all platforms</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent" />
            <CardHeader>
              <CardTitle>Platform Strategies</CardTitle>
              <CardDescription>
                Get tailored strategies for repurposing content across platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Effort estimation</li>
                <li>• Required modifications</li>
                <li>• Pro tips for each platform</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent" />
            <CardHeader>
              <CardTitle>Bulk Sync</CardTitle>
              <CardDescription>
                Sync content to multiple platforms with a single click
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• One-click distribution</li>
                <li>• Track sync status</li>
                <li>• Reach estimation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl font-bold">Cross-Platform Content Sync</h1>
          {subscriptionTier === 'studio' && (
            <Sparkles className="h-6 w-6 text-yellow-500" />
          )}
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Maximize your content's potential by adapting and distributing it across all major platforms
        </p>
      </div>

      {subscriptionTier === 'pro' && (
        <Alert>
          <AlertDescription>
            You have 10 cross-platform adaptations per month with your Pro plan. 
            Upgrade to Studio for unlimited adaptations.
          </AlertDescription>
        </Alert>
      )}

      <CrossPlatformManager />
    </div>
  );
}