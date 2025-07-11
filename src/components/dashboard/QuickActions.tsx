'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { 
  Sparkles, 
  FileText, 
  TrendingUp, 
  Users,
  Calendar,
  BookOpen,
  Zap,
  Target,
  Crown,
  ArrowRight
} from 'lucide-react';

export function QuickActions() {
  const { selectedPlatform, subscription } = useAppStore();

  const quickActions = [
    {
      title: 'Content Templates',
      description: 'Ready-to-use bio templates, captions, and content ideas',
      icon: FileText,
      href: '/templates',
      color: 'bg-blue-500',
      free: true
    },
    {
      title: 'Analytics Dashboard',
      description: 'Track your growth and optimize your strategy',
      icon: TrendingUp,
      href: '/analytics',
      color: 'bg-green-500',
      free: false
    },
    {
      title: 'Resource Library',
      description: 'Equipment guides, best practices, and tutorials',
      icon: BookOpen,
      href: '/resources',
      color: 'bg-purple-500',
      free: true
    },
    {
      title: 'Content Calendar',
      description: 'Plan and schedule your content in advance',
      icon: Calendar,
      href: '/calendar',
      color: 'bg-orange-500',
      free: true // Basic calendar view is free, full features are premium
    }
  ];

  const platformSpecificActions = {
    youtube: [
      {
        title: 'Thumbnail Generator',
        description: 'Create eye-catching thumbnails',
        icon: Zap,
        href: '/tools/thumbnails',
        premium: true
      },
      {
        title: 'SEO Optimizer',
        description: 'Optimize titles and descriptions',
        icon: Target,
        href: '/tools/seo',
        premium: false
      }
    ],
    tiktok: [
      {
        title: 'Trending Sounds',
        description: 'Find viral audio clips',
        icon: Zap,
        href: '/tools/trending-sounds',
        premium: true
      },
      {
        title: 'Hashtag Generator',
        description: 'Get optimal hashtag mixes',
        icon: Target,
        href: '/tools/hashtags',
        premium: false
      }
    ],
    twitch: [
      {
        title: 'Stream Setup Guide',
        description: 'Optimize your streaming setup',
        icon: Zap,
        href: '/tools/stream-setup',
        premium: false
      },
      {
        title: 'Community Tools',
        description: 'Manage your streaming community',
        icon: Users,
        href: '/tools/community',
        premium: true
      }
    ]
  };

  const platformActions = selectedPlatform ? platformSpecificActions[selectedPlatform.id as keyof typeof platformSpecificActions] || [] : [];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const isPremium = !action.free && subscription === 'free';
            
            return (
              <div key={index} className="relative">
                <Link href={action.href}>
                  <div className="p-3 rounded-lg border hover:border-purple-200 transition-colors group cursor-pointer">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-sm">{action.title}</h4>
                          {isPremium && <Crown className="w-3 h-3 text-yellow-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                </Link>
                
                {isPremium && (
                  <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center">
                    <Badge variant="secondary" className="text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Platform-Specific Tools */}
      {platformActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>{selectedPlatform?.displayName} Tools</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {platformActions.map((action, index) => {
              const Icon = action.icon;
              const isPremium = action.premium && subscription === 'free';
              
              return (
                <div key={index} className="relative">
                  <Link href={action.href}>
                    <div className="p-3 rounded-lg border hover:border-purple-200 transition-colors group cursor-pointer">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${
                          selectedPlatform?.id === 'youtube' ? 'bg-red-500' :
                          selectedPlatform?.id === 'tiktok' ? 'bg-black' :
                          'bg-purple-500'
                        } text-white group-hover:scale-110 transition-transform`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-sm">{action.title}</h4>
                            {isPremium && <Crown className="w-3 h-3 text-yellow-500" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  </Link>
                  
                  {isPremium && (
                    <div className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center">
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Upgrade CTA */}
      {subscription === 'free' && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold">Unlock Premium Features</h3>
              <p className="text-sm text-muted-foreground">
                Get access to advanced analytics, unlimited templates, and priority support.
              </p>
              <Button className="w-full" asChild>
                <Link href="/pricing">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}