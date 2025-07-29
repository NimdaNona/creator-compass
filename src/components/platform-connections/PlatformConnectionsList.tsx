'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PlatformConnectionCard } from './PlatformConnectionCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Zap } from 'lucide-react';
import type { PlatformConnection } from '@/types/platform-integrations';

interface PlatformConnectionsListProps {
  onUpgrade?: () => void;
}

export function PlatformConnectionsList({ onUpgrade }: PlatformConnectionsListProps) {
  const { data: session } = useSession();
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch connections
  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/platform-connections');
      if (!response.ok) throw new Error('Failed to fetch connections');
      const data = await response.json();
      setConnections(data);
    } catch (error) {
      console.error('Error fetching connections:', error);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (platform: string) => {
    if (!session?.user) {
      setError('Please sign in to connect platforms');
      return;
    }

    // Check connection limits for free tier
    const isPremium = session.user.subscriptionStatus === 'active';
    if (!isPremium && connections.length >= 2) {
      onUpgrade?.();
      return;
    }

    setConnectingPlatform(platform);
    setError(null);

    try {
      // Initialize OAuth flow
      const response = await fetch('/api/platform-connections/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      });

      if (!response.ok) throw new Error('Failed to initialize connection');
      
      const { authUrl } = await response.json();
      
      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting platform:', error);
      setError(`Failed to connect ${platform}`);
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/platform-connections/${connectionId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to disconnect');
      
      // Remove from local state
      setConnections(connections.filter(c => c.id !== connectionId));
    } catch (error) {
      console.error('Error disconnecting:', error);
      setError('Failed to disconnect platform');
    }
  };

  const handleToggleActive = async (connectionId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/platform-connections/${connectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: active })
      });

      if (!response.ok) throw new Error('Failed to update connection');
      
      // Update local state
      setConnections(connections.map(c => 
        c.id === connectionId ? { ...c, isActive: active } : c
      ));
    } catch (error) {
      console.error('Error updating connection:', error);
      setError('Failed to update connection status');
    }
  };

  const handleRefreshToken = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/platform-connections/${connectionId}/refresh`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to refresh token');
      
      const updatedConnection = await response.json();
      
      // Update local state
      setConnections(connections.map(c => 
        c.id === connectionId ? updatedConnection : c
      ));
    } catch (error) {
      console.error('Error refreshing token:', error);
      setError('Failed to refresh connection');
    }
  };

  const platforms = ['youtube', 'tiktok', 'instagram', 'twitter'] as const;
  const connectedPlatforms = connections.map(c => c.platform);
  const availablePlatforms = platforms.filter(p => !connectedPlatforms.includes(p));

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Connection limit warning for free tier */}
      {session?.user?.subscriptionStatus !== 'active' && connections.length >= 2 && (
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You've reached the free tier limit of 2 platform connections.</span>
            <Button size="sm" variant="default" onClick={onUpgrade}>
              Upgrade to Pro
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="connected" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connected">
            Connected ({connections.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            Available ({availablePlatforms.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="space-y-4">
          {connections.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {connections.map((connection) => (
                <PlatformConnectionCard
                  key={connection.id}
                  platform={connection.platform}
                  connection={connection}
                  onConnect={() => handleConnect(connection.platform)}
                  onDisconnect={handleDisconnect}
                  onToggleActive={handleToggleActive}
                  onRefreshToken={handleRefreshToken}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No platforms connected yet. Connect your social media accounts to get started.
              </p>
              <Button onClick={() => document.querySelector('[data-value="available"]')?.click()}>
                Browse Available Platforms
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          {availablePlatforms.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {availablePlatforms.map((platform) => (
                <PlatformConnectionCard
                  key={platform}
                  platform={platform}
                  onConnect={() => handleConnect(platform)}
                  onDisconnect={handleDisconnect}
                  onToggleActive={handleToggleActive}
                  onRefreshToken={handleRefreshToken}
                  loading={connectingPlatform === platform}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                All available platforms are already connected. Great job! 🎉
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}