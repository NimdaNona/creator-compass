'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { ResponsiveRoadmapView } from '@/components/dashboard/ResponsiveRoadmapView';
import { ProgressStats } from '@/components/dashboard/ProgressStats';
import { TodaysTasks } from '@/components/dashboard/TodaysTasks';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AchievementsBanner } from '@/components/dashboard/AchievementsBanner';
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
    progress, 
    onboardingComplete 
  } = useAppStore();

  useEffect(() => {
    // Redirect to onboarding if not completed
    if (!onboardingComplete || !selectedPlatform || !selectedNiche) {
      router.push('/onboarding');
      return;
    }
  }, [onboardingComplete, selectedPlatform, selectedNiche, router]);

  // Loading state
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
                  Day {Math.floor((Date.now() - progress.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} of 90
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
          <div className="lg:col-span-2">
            <TodaysTasks />
          </div>
          
          {/* Quick Actions Sidebar */}
          <div>
            <QuickActions />
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
            <TabsTrigger value="calendar" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Calendar</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-6">
            <ResponsiveRoadmapView />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Content Calendar</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground mb-4">
                    A visual content calendar to plan your posts and track your publishing schedule.
                  </p>
                  <Button variant="outline">
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Get Notified
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}