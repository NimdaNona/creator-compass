'use client';

import { useAppStore } from '@/store/useAppStore';
import { YouTubeFeatures } from './YouTubeFeatures';
import { TikTokFeatures } from './TikTokFeatures';
import { TwitchFeatures } from './TwitchFeatures';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Youtube,
  Music,
  Radio,
  ArrowRight,
  Sparkles,
  Target,
  Crown
} from 'lucide-react';

export function PlatformFeatures() {
  const { selectedPlatform, selectedNiche, subscription } = useAppStore();

  // If no platform selected, show platform selection prompt
  if (!selectedPlatform) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select Your Platform</h3>
          <p className="text-muted-foreground mb-6">
            Choose a platform to access specialized creator tools and features
          </p>
          <Button asChild>
            <Link href="/onboarding">
              <ArrowRight className="w-4 h-4 mr-2" />
              Complete Setup
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getPlatformIcon = () => {
    switch (selectedPlatform.id) {
      case 'youtube':
        return Youtube;
      case 'tiktok':
        return Music;
      case 'twitch':
        return Radio;
      default:
        return Target;
    }
  };

  const getPlatformColor = () => {
    switch (selectedPlatform.id) {
      case 'youtube':
        return 'text-red-500';
      case 'tiktok':
        return 'text-pink-500';
      case 'twitch':
        return 'text-purple-500';
      default:
        return 'text-blue-500';
    }
  };

  const renderPlatformFeatures = () => {
    switch (selectedPlatform.id) {
      case 'youtube':
        return <YouTubeFeatures />;
      case 'tiktok':
        return <TikTokFeatures />;
      case 'twitch':
        return <TwitchFeatures />;
      default:
        return (
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">Platform Not Supported Yet</h3>
              <p className="text-muted-foreground">
                We're still building features for this platform. Check back soon!
              </p>
            </CardContent>
          </Card>
        );
    }
  };

  const PlatformIcon = getPlatformIcon();

  return (
    <div className="space-y-6">
      {/* Platform Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${getPlatformColor()}`}>
              <PlatformIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{selectedPlatform.name} Tools</h1>
              <div className="flex items-center space-x-2">
                <p className="text-muted-foreground">
                  Specialized features for {selectedNiche?.name || 'creators'}
                </p>
                {subscription === 'premium' && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <Crown className="w-3 h-3" />
                    <span>Premium</span>
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-2">
            <Button variant="outline" asChild>
              <Link href="/templates">
                <Sparkles className="w-4 h-4 mr-2" />
                Templates
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <Target className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Platform-specific info banner */}
        <Card className="bg-gradient-to-r from-muted/50 to-muted/25">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <PlatformIcon className={`w-6 h-6 mt-1 ${getPlatformColor()}`} />
              <div>
                <h3 className="font-semibold mb-1">Platform-Specific Tools</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedPlatform.id === 'youtube' && 
                    "Access YouTube-specific features like thumbnail designer, SEO optimizer, and trend analyzer to maximize your channel growth."
                  }
                  {selectedPlatform.id === 'tiktok' && 
                    "Discover viral sounds, hashtag strategies, content templates, and optimal posting times to boost your TikTok presence."
                  }
                  {selectedPlatform.id === 'twitch' && 
                    "Set up professional stream overlays, chat commands, schedules, and goals to build an engaged streaming community."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Features */}
      {renderPlatformFeatures()}
    </div>
  );
}