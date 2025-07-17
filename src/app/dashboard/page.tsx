'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import EnhancedRoadmapView from '@/components/roadmap/EnhancedRoadmapView';
import { ProgressStats } from '@/components/dashboard/ProgressStats';
import { TodaysTasks } from '@/components/dashboard/TodaysTasks';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AchievementsBanner } from '@/components/dashboard/AchievementsBanner';
import { UsageWidget } from '@/components/dashboard/UsageWidget';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { OnboardingGuide } from '@/components/dashboard/OnboardingGuide';
import { DraggableContentCalendar } from '@/components/calendar/DraggableContentCalendar';
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget';
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
  const { 
    selectedPlatform, 
    selectedNiche, 
    progress
  } = useAppStore();

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

        {/* Achievement Banner */}
        <AchievementsBanner />

        {/* Overview Stats */}
        <ProgressStats />

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          {/* Today's Tasks */}
          <div className="lg:col-span-2" data-today-tasks>
            <TodaysTasks />
          </div>
          
          {/* Quick Actions & Usage Sidebar */}
          <div className="space-y-6">
            <QuickActions />
            <UsageWidget />
            <AIInsights />
          </div>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Roadmap</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center space-x-2" data-calendar-tab>
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
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
      
      {/* AI Assistant Widget */}
      <AIAssistantWidget />
    </div>
  );
}