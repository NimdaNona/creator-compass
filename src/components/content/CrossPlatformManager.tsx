'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  ArrowRight,
  Copy,
  Share2,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Youtube,
  Hash,
  Twitch,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContentAdaptation, CrossPlatformStrategy } from '@/lib/cross-platform-sync';

interface CrossPlatformManagerProps {
  contentId?: string;
  contentType?: string;
  platform?: string;
  onSync?: (platforms: string[]) => void;
}

const platformIcons = {
  youtube: Youtube,
  tiktok: Hash,
  twitch: Twitch
};

const platformColors = {
  youtube: 'text-red-600',
  tiktok: 'text-black',
  twitch: 'text-purple-600'
};

export default function CrossPlatformManager({
  contentId,
  contentType,
  platform,
  onSync
}: CrossPlatformManagerProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [adaptation, setAdaptation] = useState<ContentAdaptation | null>(null);
  const [strategy, setStrategy] = useState<CrossPlatformStrategy | null>(null);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('adapt');

  useEffect(() => {
    if (contentId && contentType) {
      fetchStrategy();
    }
    fetchSyncStatus();
  }, [contentId, contentType]);

  const fetchStrategy = async () => {
    if (!contentId || !contentType) return;

    try {
      const response = await fetch('/api/content/cross-platform/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, contentType })
      });

      if (!response.ok) throw new Error('Failed to fetch strategy');

      const data = await response.json();
      setStrategy(data);
    } catch (error) {
      console.error('Error fetching strategy:', error);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/content/cross-platform/sync');
      if (!response.ok) throw new Error('Failed to fetch sync status');

      const data = await response.json();
      setSyncStatus(data);
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  const handleAdaptContent = async (targetPlatform: string) => {
    if (!contentId || !platform) return;

    setLoading(true);
    try {
      const response = await fetch('/api/content/cross-platform/adapt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceContent: {
            id: contentId,
            platform,
            title: 'Sample Content', // In real app, fetch actual content
            description: 'Sample description',
            format: contentType || 'general',
            tags: []
          },
          targetPlatform
        })
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.upgradeRequired) {
          toast.error('Upgrade required to adapt content across platforms');
          return;
        }
        throw new Error(error.error || 'Failed to adapt content');
      }

      const data = await response.json();
      setAdaptation(data);
      toast.success('Content adapted successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to adapt content');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncContent = async () => {
    if (!contentId || selectedPlatforms.length === 0) return;

    setSyncing(true);
    try {
      const response = await fetch('/api/content/cross-platform/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceContentId: contentId,
          targetPlatforms: selectedPlatforms
        })
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.upgradeRequired) {
          toast.error(error.error || 'Upgrade required');
          return;
        }
        throw new Error(error.error || 'Failed to sync content');
      }

      const data = await response.json();
      
      // Show results
      const successful = data.synced.filter((s: any) => s.success).length;
      const failed = data.synced.filter((s: any) => !s.success).length;
      
      if (successful > 0) {
        toast.success(`Successfully synced to ${successful} platform${successful > 1 ? 's' : ''}`);
      }
      if (failed > 0) {
        toast.error(`Failed to sync to ${failed} platform${failed > 1 ? 's' : ''}`);
      }

      // Reset and callback
      setSelectedPlatforms([]);
      fetchSyncStatus();
      if (onSync) onSync(selectedPlatforms);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sync content');
    } finally {
      setSyncing(false);
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  if (!contentId && !syncStatus) {
    return <CrossPlatformManagerSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="adapt">Adapt Content</TabsTrigger>
          <TabsTrigger value="strategy">Platform Strategy</TabsTrigger>
          <TabsTrigger value="status">Sync Status</TabsTrigger>
        </TabsList>

        <TabsContent value="adapt" className="space-y-4">
          {adaptation && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Content adapted for {adaptation.targetPlatform}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Adapt Content for Other Platforms</CardTitle>
              <CardDescription>
                Transform your content to work perfectly on different platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {['youtube', 'tiktok', 'twitch'].map((targetPlatform) => {
                  if (targetPlatform === platform) return null;

                  const Icon = platformIcons[targetPlatform as keyof typeof platformIcons];
                  const color = platformColors[targetPlatform as keyof typeof platformColors];

                  return (
                    <Card key={targetPlatform} className="relative overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-5 w-5", color)} />
                            <span className="font-medium capitalize">{targetPlatform}</span>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>

                        {adaptation?.targetPlatform === targetPlatform && (
                          <div className="space-y-2 mb-3">
                            {adaptation.adaptations.title && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Title: </span>
                                <span className="font-medium">{adaptation.adaptations.title}</span>
                              </div>
                            )}
                            {adaptation.adaptations.format && (
                              <Badge variant="secondary">
                                {adaptation.adaptations.format}
                              </Badge>
                            )}
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleAdaptContent(targetPlatform)}
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Adapt Content'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {adaptation && adaptation.adaptations.suggestions && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Adaptation Tips:</h4>
                  <ul className="space-y-1">
                    {adaptation.adaptations.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategy" className="space-y-4">
          {strategy ? (
            <div className="grid gap-4">
              {strategy.strategies.map((platformStrategy) => {
                const Icon = platformIcons[platformStrategy.platform as keyof typeof platformIcons];
                const color = platformColors[platformStrategy.platform as keyof typeof platformColors];

                return (
                  <Card key={platformStrategy.platform}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-5 w-5", color)} />
                          <CardTitle className="text-lg capitalize">
                            {platformStrategy.platform} Strategy
                          </CardTitle>
                        </div>
                        <Badge
                          variant={
                            platformStrategy.estimatedEffort === 'low' ? 'default' :
                            platformStrategy.estimatedEffort === 'medium' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {platformStrategy.estimatedEffort} effort
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Approach</h4>
                        <p className="text-sm text-muted-foreground">
                          {platformStrategy.approach}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Required Modifications</h4>
                        <ul className="space-y-1">
                          {platformStrategy.modifications.map((mod, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{mod}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Pro Tips</h4>
                        <ul className="space-y-1">
                          {platformStrategy.tips.map((tip, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <Zap className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Checkbox
                          checked={selectedPlatforms.includes(platformStrategy.platform)}
                          onCheckedChange={() => togglePlatform(platformStrategy.platform)}
                        />
                        <label className="text-sm">
                          Select for bulk sync
                        </label>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {selectedPlatforms.length > 0 && (
                <Button
                  onClick={handleSyncContent}
                  disabled={syncing}
                  className="w-full"
                >
                  {syncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing to {selectedPlatforms.length} platforms...
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Sync to {selectedPlatforms.length} Platform{selectedPlatforms.length > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>No strategy available. Select content to see platform strategies.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          {syncStatus && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {syncStatus.platforms.map((platform: any) => {
                  const Icon = platformIcons[platform.platform as keyof typeof platformIcons];
                  const color = platformColors[platform.platform as keyof typeof platformColors];

                  return (
                    <Card key={platform.platform}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className={cn("h-5 w-5", color)} />
                            <span className="font-medium capitalize">{platform.platform}</span>
                          </div>
                          {platform.syncEnabled && (
                            <Badge variant="default" className="text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl font-bold">{platform.contentCount}</p>
                          <p className="text-xs text-muted-foreground">
                            content items
                          </p>
                          {platform.lastSync && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last sync: {new Date(platform.lastSync).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {syncStatus.suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sync Opportunities</CardTitle>
                    <CardDescription>
                      Expand your reach by syncing content to other platforms
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {syncStatus.suggestions.map((suggestion: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {React.createElement(
                                platformIcons[suggestion.source as keyof typeof platformIcons],
                                { className: cn("h-4 w-4", platformColors[suggestion.source as keyof typeof platformColors]) }
                              )}
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              {React.createElement(
                                platformIcons[suggestion.target as keyof typeof platformIcons],
                                { className: cn("h-4 w-4", platformColors[suggestion.target as keyof typeof platformColors]) }
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {suggestion.potentialContent} content items
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Potential reach: {suggestion.estimatedReach}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPlatforms([suggestion.target]);
                              setActiveTab('strategy');
                            }}
                          >
                            <TrendingUp className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CrossPlatformManagerSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    </div>
  );
}