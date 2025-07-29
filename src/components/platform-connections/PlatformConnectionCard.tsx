'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Check, X, ExternalLink, RefreshCw, Settings, Trash2 } from 'lucide-react';
import type { PlatformConnection } from '@/types/platform-integrations';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PlatformConnectionCardProps {
  platform: 'youtube' | 'tiktok' | 'instagram' | 'twitter';
  connection?: PlatformConnection;
  onConnect: () => void;
  onDisconnect: (connectionId: string) => void;
  onToggleActive: (connectionId: string, active: boolean) => void;
  onRefreshToken: (connectionId: string) => void;
  loading?: boolean;
}

const platformConfig = {
  youtube: {
    name: 'YouTube',
    icon: '🎥',
    color: 'bg-red-500',
    description: 'Connect your YouTube channel to manage videos and analytics',
    features: ['Video upload', 'Analytics sync', 'Content scheduling', 'Thumbnail optimization']
  },
  tiktok: {
    name: 'TikTok',
    icon: '🎵',
    color: 'bg-black',
    description: 'Connect your TikTok account to publish videos and track performance',
    features: ['Video publishing', 'Trend analysis', 'Hashtag optimization', 'Analytics']
  },
  instagram: {
    name: 'Instagram',
    icon: '📸',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    description: 'Connect your Instagram business account for posts and insights',
    features: ['Image & video posts', 'Stories', 'Reels', 'Audience insights']
  },
  twitter: {
    name: 'Twitter/X',
    icon: '𝕏',
    color: 'bg-black',
    description: 'Connect your Twitter account to schedule tweets and track engagement',
    features: ['Tweet scheduling', 'Thread creation', 'Analytics', 'Audience growth']
  }
};

export function PlatformConnectionCard({
  platform,
  connection,
  onConnect,
  onDisconnect,
  onToggleActive,
  onRefreshToken,
  loading = false
}: PlatformConnectionCardProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const config = platformConfig[platform];

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect(connection!.id);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isExpiringSoon = connection?.tokenExpiry && 
    new Date(connection.tokenExpiry) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Card className="relative overflow-hidden">
      {/* Platform color accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${config.color}`} />
      
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{config.icon}</div>
            <div>
              <CardTitle className="text-xl">{config.name}</CardTitle>
              {connection ? (
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant={connection.isActive ? 'default' : 'secondary'} className="text-xs">
                    {connection.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    @{connection.accountName}
                  </span>
                </CardDescription>
              ) : (
                <CardDescription>{config.description}</CardDescription>
              )}
            </div>
          </div>

          {connection && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Connection Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onRefreshToken(connection.id)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Token
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => window.open(`https://${platform}.com/${connection.accountName}`, '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Disconnect
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Disconnect {config.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove your {config.name} connection. You'll need to reconnect 
                        to use {config.name} features again.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDisconnect}
                        className="bg-destructive text-destructive-foreground"
                      >
                        {isDisconnecting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Disconnect
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {connection ? (
          <>
            {/* Connection info */}
            <div className="space-y-3">
              {connection.accountImage && (
                <img 
                  src={connection.accountImage} 
                  alt={connection.accountName}
                  className="w-16 h-16 rounded-full"
                />
              )}
              
              {/* Metadata display */}
              {connection.metadata && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {connection.metadata.followersCount !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Followers:</span>
                      <span className="ml-2 font-medium">
                        {connection.metadata.followersCount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {connection.metadata.subscriberCount !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Subscribers:</span>
                      <span className="ml-2 font-medium">
                        {connection.metadata.subscriberCount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {connection.metadata.videoCount !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Videos:</span>
                      <span className="ml-2 font-medium">
                        {connection.metadata.videoCount.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {connection.metadata.mediaCount !== undefined && (
                    <div>
                      <span className="text-muted-foreground">Posts:</span>
                      <span className="ml-2 font-medium">
                        {connection.metadata.mediaCount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Token expiry warning */}
              {isExpiringSoon && (
                <div className="flex items-center gap-2 p-2 bg-yellow-500/10 rounded-md">
                  <span className="text-sm text-yellow-600 dark:text-yellow-400">
                    Token expires soon. Please refresh to maintain connection.
                  </span>
                </div>
              )}

              {/* Last sync info */}
              {connection.lastSync && (
                <div className="text-sm text-muted-foreground">
                  Last synced: {new Date(connection.lastSync).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <Label htmlFor={`active-${connection.id}`} className="cursor-pointer">
                Enable automatic posting
              </Label>
              <Switch
                id={`active-${connection.id}`}
                checked={connection.isActive}
                onCheckedChange={(checked) => onToggleActive(connection.id, checked)}
              />
            </div>
          </>
        ) : (
          <>
            {/* Features list */}
            <div className="space-y-2">
              {config.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Connect button */}
            <Button 
              onClick={onConnect} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  Connect {config.name}
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}