'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
import { useDataSync } from '@/hooks/useDataSync';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import EnhancedRoadmapView from '@/components/roadmap/EnhancedRoadmapView';
import { OnboardingGuide } from '@/components/dashboard/OnboardingGuide';
import { DraggableContentCalendar } from '@/components/calendar/DraggableContentCalendar';
import { PersistentAIAssistant } from '@/components/ai/PersistentAIAssistant';
import { ProactiveSuggestions } from '@/components/ai/ProactiveSuggestions';
import { SyncStatus } from '@/components/dashboard/SyncStatus';
import { WelcomeTour } from '@/components/dashboard/WelcomeTour';
import { ContextualHelpTooltips } from '@/components/dashboard/ContextualHelpTooltips';
import { AdaptiveDashboardLayout } from '@/components/dashboard/AdaptiveDashboardLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  CheckCircle,
  Compass,
  ArrowRight,
  PlayCircle,
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { 
    selectedPlatform, 
    selectedNiche, 
    progress
  } = useAppStore();
  
  // Enable data synchronization
  useDataSync({
    enableAutoSync: true,
    syncOnMount: true,
    syncOnFocus: true
  });

  // Loading state or redirect to onboarding
  useEffect(() => {
    if (!selectedPlatform || !selectedNiche) {
      router.push('/onboarding');
    }
  }, [selectedPlatform, selectedNiche, router]);

  if (!selectedPlatform || !selectedNiche || !progress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Compass className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading your dashboard...</h2>
          <p className="text-muted-foreground">Setting up your personalized creator roadmap</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Onboarding Guide for New Users */}
        <OnboardingGuide />
        
        {/* Welcome Tour for First Dashboard Visit */}
        <WelcomeTour />
        
        {/* Proactive AI Suggestions */}
        <ProactiveSuggestions className="mb-6" />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back! 👋
              </h1>
              <div className="flex items-center space-x-2">
                <Badge className={
                  selectedPlatform.id === 'youtube' ? 'bg-red-500' :
                  selectedPlatform.id === 'tiktok' ? 'bg-black' :
                  'bg-purple-500'
                }>
                  {selectedPlatform.displayName}
                </Badge>
                <Badge variant="outline">{selectedNiche.name}</Badge>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  Day {Math.floor((Date.now() - new Date(progress.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} of 90
                </span>
                <span className="text-muted-foreground">•</span>
                <SyncStatus />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" asChild>
                <a href="/templates">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Templates
                </a>
              </Button>
              <Button asChild>
                <a href="/roadmap">
                  <Target className="w-4 h-4 mr-2" />
                  View Full Roadmap
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Adaptive Dashboard Layout */}
        <div className="mb-8">
          {session?.user?.id ? (
            <AdaptiveDashboardLayout userId={session.user.id} />
          ) : (
            <div className="text-center py-12">
              <Compass className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your personalized dashboard...</p>
            </div>
          )}
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center justify-center space-x-1 sm:space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="flex items-center justify-center space-x-1 sm:space-x-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Roadmap</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center justify-center space-x-1 sm:space-x-2" data-calendar-tab>
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-6">
            <EnhancedRoadmapView />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <DraggableContentCalendar />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Persistent AI Assistant */}
      <PersistentAIAssistant defaultMinimized={false} />
      
      {/* Contextual Help Tooltips */}
      <ContextualHelpTooltips />
    </div>
  );
}