'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { getAllPlatforms, getPlatformById } from '@/lib/data';
import type { Platform } from '@/types';
import { PlayCircle, Zap, Users, CheckCircle, Lock, AlertCircle } from 'lucide-react';
import { usePlatformAccess } from '@/hooks/useSubscription';
import { PaywallModal } from '@/components/paywall/PaywallModal';

interface PlatformSelectionProps {
  onNext: () => void;
}

const platformIcons = {
  youtube: PlayCircle,
  tiktok: Zap,
  twitch: Users,
};

export function PlatformSelection({ onNext }: PlatformSelectionProps) {
  const searchParams = useSearchParams();
  const { selectedPlatform, setSelectedPlatform } = useAppStore();
  const platforms = getAllPlatforms();
  const { canAccessPlatform, maxPlatforms, subscription, isLoading } = usePlatformAccess();
  const [showPaywall, setShowPaywall] = useState(false);
  const [attemptedPlatform, setAttemptedPlatform] = useState<Platform | null>(null);
  
  // Count current platforms (in real app, this would come from the database)
  const currentPlatformCount = selectedPlatform ? 1 : 0;
  const canSelectMore = canAccessPlatform(currentPlatformCount);
  const isFreeTier = subscription?.plan === 'free' || !subscription;

  // Auto-select platform if specified in URL
  useEffect(() => {
    const platformParam = searchParams.get('platform');
    if (platformParam) {
      const platform = getPlatformById(platformParam);
      if (platform) {
        setSelectedPlatform(platform);
        // Auto-advance to next step
        setTimeout(onNext, 500);
      }
    }
  }, [searchParams, setSelectedPlatform, onNext]);

  const handlePlatformSelect = (platform: Platform) => {
    // If switching platforms and on free tier, check if allowed
    if (selectedPlatform && selectedPlatform.id !== platform.id && isFreeTier) {
      setAttemptedPlatform(platform);
      setShowPaywall(true);
      return;
    }
    
    setSelectedPlatform(platform);
    // Auto-advance after selection
    setTimeout(onNext, 300);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Free tier limit indicator */}
      {isFreeTier && !isLoading && (
        <div className="mb-8 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center justify-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <span className="font-semibold">Free Plan Limitation:</span> You can only select {maxPlatforms} platform.
              {selectedPlatform && (
                <span className="ml-1">
                  To switch platforms, <a href="/pricing" className="underline font-semibold">upgrade to Premium</a>.
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Header with Gen Z Appeal */}
      <div className="text-center mb-12 space-y-6">
        <div className="relative">
          <h3 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
              Choose Your Platform
            </span>
            <span className="ml-3 text-3xl emoji-bounce inline-block">🚀</span>
          </h3>
          
          {/* Floating background elements */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-purple-500/20 rounded-full blur-sm animate-pulse" />
          <div className="absolute -top-2 -right-6 w-6 h-6 bg-pink-500/20 rounded-full blur-sm animate-pulse delay-1000" />
        </div>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Select the platform where you want to grow your audience. 
          <span className="font-semibold text-purple-600"> Each platform has unique strategies</span> and requirements.
        </p>
        
        {/* Trending badge */}
        <Badge variant="secondary" className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-300/50 text-purple-700 dark:text-purple-300">
          <Zap className="w-4 h-4 mr-2" />
          Most Popular Creator Platforms
        </Badge>
      </div>

      {/* Enhanced Platform Cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {platforms.map((platform, index) => {
          const Icon = platformIcons[platform.id as keyof typeof platformIcons];
          const isSelected = selectedPlatform?.id === platform.id;
          
          const platformStyles = {
            youtube: {
              gradient: 'from-red-500 to-red-600',
              glow: 'hover:neon-glow-pink',
              icon: '🎬'
            },
            tiktok: {
              gradient: 'from-black via-gray-800 to-black',
              glow: 'hover:neon-glow-purple',
              icon: '📱'
            },
            twitch: {
              gradient: 'from-purple-600 to-purple-700',
              glow: 'hover:neon-glow-blue',
              icon: '🎮'
            }
          };
          
          const style = platformStyles[platform.id as keyof typeof platformStyles];
          
          const isLocked = selectedPlatform && selectedPlatform.id !== platform.id && isFreeTier;
          
          return (
            <Card 
              key={platform.id}
              className={`modern-card gen-z-card cursor-pointer transition-all duration-500 hover:scale-105 ${style.glow} ${
                isSelected 
                  ? 'ring-2 ring-purple-500 shadow-2xl neon-glow-purple scale-105' 
                  : isLocked
                  ? 'opacity-75 hover:opacity-100'
                  : 'hover:shadow-2xl'
              }`}
              onClick={() => handlePlatformSelect(platform)}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardHeader className="text-center relative overflow-hidden">
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/20 pointer-events-none" />
                
                <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br ${style.gradient} flex items-center justify-center mb-4 shadow-lg relative overflow-hidden group`}>
                  <Icon className="w-10 h-10 text-white relative z-10" />
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </div>
                
                <div className="flex items-center justify-center space-x-2">
                  <CardTitle className="text-2xl font-bold">{platform.displayName}</CardTitle>
                  <span className="text-xl">{style.icon}</span>
                  {isSelected && (
                    <div className="relative">
                      <CheckCircle className="w-6 h-6 text-green-500 animate-bounce" />
                      <div className="absolute inset-0 w-6 h-6 bg-green-500/30 rounded-full animate-ping" />
                    </div>
                  )}
                  {isLocked && (
                    <div className="relative">
                      <Lock className="w-5 h-5 text-orange-500" />
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-center leading-relaxed">
                  {platform.description}
                </p>
                
                <div className="space-y-3 p-3 bg-muted/30 rounded-xl">
                  <h4 className="font-semibold text-sm flex items-center">
                    <Zap className="w-4 h-4 mr-2 text-purple-500" />
                    Key Features:
                  </h4>
                  <ul className="space-y-2">
                    {platform.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {platform.niches.slice(0, 3).map((niche) => (
                    <Badge key={niche.id} variant="secondary" className="text-xs social-button bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50">
                      {niche.name}
                    </Badge>
                  ))}
                  {platform.niches.length > 3 && (
                    <Badge variant="outline" className="text-xs holographic">
                      +{platform.niches.length - 3} more
                    </Badge>
                  )}
                </div>
                
                <div className="pt-3 border-t border-gradient-to-r from-transparent via-purple-200 to-transparent">
                  <div className="text-sm text-center">
                    <span className="font-semibold text-purple-600">💰 Monetization:</span>
                    <span className="ml-2">{Object.keys(platform.requirements.monetization)[0]}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enhanced Additional Info */}
      <div className="mt-16 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="relative mb-8">
            <h4 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Not sure which platform to choose? 🤔
            </h4>
            <p className="text-muted-foreground">Here's what makes each platform unique:</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="modern-card gen-z-card p-6 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200/50">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">🎬</span>
                </div>
              </div>
              <h5 className="font-bold text-red-600 text-lg mb-3">YouTube</h5>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Best for <span className="font-semibold text-red-500">long-form content</span>, tutorials, and building authority in your niche.
                Perfect for creators who love storytelling and detailed content.
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs">
                <Badge variant="outline" className="bg-red-100 text-red-600 border-red-200">Long-form</Badge>
                <Badge variant="outline" className="bg-red-100 text-red-600 border-red-200">Educational</Badge>
              </div>
            </div>
            
            <div className="modern-card gen-z-card p-6 bg-gradient-to-br from-gray-50 to-black/5 dark:from-gray-950/50 dark:to-black/20 border-gray-200/50">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-black to-gray-800 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">📱</span>
                </div>
              </div>
              <h5 className="font-bold text-black dark:text-white text-lg mb-3">TikTok</h5>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Perfect for <span className="font-semibold text-pink-500">viral short content</span>, trending challenges, and rapid growth.
                Ideal for creative, trend-savvy creators.
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs">
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Viral</Badge>
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Trending</Badge>
              </div>
            </div>
            
            <div className="modern-card gen-z-card p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200/50">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl">🎮</span>
                </div>
              </div>
              <h5 className="font-bold text-purple-600 text-lg mb-3">Twitch</h5>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Ideal for <span className="font-semibold text-purple-500">live streaming</span>, real-time interaction, and gaming content.
                Great for building communities and direct engagement.
              </p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs">
                <Badge variant="outline" className="bg-purple-100 text-purple-600 border-purple-200">Live</Badge>
                <Badge variant="outline" className="bg-purple-100 text-purple-600 border-purple-200">Interactive</Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-gradient-to-r from-purple-100/50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200/50">
            <p className="text-sm text-muted-foreground">
              💡 <span className="font-semibold">Pro tip:</span> You can always switch platforms later or create content for multiple platforms using our cross-platform strategies!
            </p>
          </div>
        </div>
      </div>
      
      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="Multiple Platforms"
        title="Unlock Multiple Platforms"
        description="Free users can only select one platform. Upgrade to Premium to switch between platforms and access cross-platform strategies."
        benefits={[
          'Switch between YouTube, TikTok, and Twitch anytime',
          'Access cross-platform content strategies',
          'Track progress across all platforms',
          'Get platform-specific analytics',
          'Export multi-platform reports'
        ]}
      />
    </div>
  );
}