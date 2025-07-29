'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { layoutOrchestrator, DashboardComponent, DashboardLayout } from '@/lib/dashboard/layout-orchestrator';
import { journeyOrchestrator } from '@/lib/ai/journey-orchestrator';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Lazy load dashboard components
const componentMap = {
  AIJourneyGuide: lazy(() => import('@/components/dashboard/AIJourneyGuide').then(m => ({ default: m.AIJourneyGuide }))),
  WelcomeBanner: lazy(() => import('@/components/dashboard/WelcomeBanner')),
  AchievementsBanner: lazy(() => import('@/components/dashboard/AchievementsBanner').then(m => ({ default: m.AchievementsBanner }))),
  ProgressStats: lazy(() => import('@/components/dashboard/ProgressStats').then(m => ({ default: m.ProgressStats }))),
  TodaysTasks: lazy(() => import('@/components/dashboard/TodaysTasks').then(m => ({ default: m.TodaysTasks }))),
  DynamicTaskRecommendations: lazy(() => import('@/components/dashboard/DynamicTaskRecommendations').then(m => ({ default: m.DynamicTaskRecommendations }))),
  QuickActions: lazy(() => import('@/components/dashboard/QuickActions').then(m => ({ default: m.QuickActions }))),
  UsageWidget: lazy(() => import('@/components/dashboard/UsageWidget').then(m => ({ default: m.UsageWidget }))),
  AIInsights: lazy(() => import('@/components/dashboard/AIInsights').then(m => ({ default: m.AIInsights }))),
  CalendarPreview: lazy(() => import('@/components/dashboard/CalendarPreview')),
  AnalyticsPreview: lazy(() => import('@/components/dashboard/AnalyticsPreview')),
  CommunityFeed: lazy(() => import('@/components/dashboard/CommunityFeed')),
  LearningPath: lazy(() => import('@/components/dashboard/LearningPath')),
  // Gamification components
  XPLevelDisplay: lazy(() => import('@/components/gamification/XPLevelDisplay').then(m => ({ default: m.XPLevelDisplay }))),
  DailyChallenges: lazy(() => import('@/components/gamification/DailyChallenges').then(m => ({ default: m.DailyChallenges }))),
  // AI Features
  ContentIdeaGenerator: lazy(() => import('@/components/ai/ContentIdeaGenerator').then(m => ({ default: m.ContentIdeaGenerator }))),
  ScriptWriter: lazy(() => import('@/components/ai/ScriptWriter').then(m => ({ default: m.ScriptWriter }))),
  ThumbnailAnalyzer: lazy(() => import('@/components/ai/ThumbnailAnalyzer').then(m => ({ default: m.ThumbnailAnalyzer }))),
  PerformancePredictor: lazy(() => import('@/components/ai/PerformancePredictor').then(m => ({ default: m.PerformancePredictor }))),
  ABTestingAdvisor: lazy(() => import('@/components/ai/ABTestingAdvisor').then(m => ({ default: m.ABTestingAdvisor }))),
};

interface AdaptiveDashboardLayoutProps {
  userId: string;
}

export function AdaptiveDashboardLayout({ userId }: AdaptiveDashboardLayoutProps) {
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const { selectedPlatform, selectedNiche, progress } = useAppStore();

  useEffect(() => {
    loadAdaptiveLayout();
  }, [userId, selectedPlatform, selectedNiche]);

  const loadAdaptiveLayout = async () => {
    try {
      setLoading(true);

      // Get user context and journey state
      const [contextResponse, interactionsResponse] = await Promise.all([
        fetch('/api/ai/journey'),
        fetch(`/api/ai/interactions?userId=${userId}&limit=50`)
      ]);

      if (!contextResponse.ok || !interactionsResponse.ok) {
        throw new Error('Failed to load layout data');
      }

      const { journey, context } = await contextResponse.json();
      const { interactions } = await interactionsResponse.json();

      // Generate adaptive layout
      const adaptiveLayout = layoutOrchestrator.generateDashboardLayout(
        context,
        journey.currentStage,
        interactions
      );

      setLayout(adaptiveLayout);
    } catch (error) {
      console.error('Error loading adaptive layout:', error);
      // Fall back to default layout
      setLayout({
        components: [],
        emphasis: 'onboarding',
        columns: 3
      });
    } finally {
      setLoading(false);
    }
  };

  const renderComponent = (component: DashboardComponent) => {
    const Component = componentMap[component.component as keyof typeof componentMap];
    
    if (!Component) {
      console.warn(`Component ${component.component} not found`);
      return null;
    }

    return (
      <Suspense
        key={component.id}
        fallback={
          <div className={cn(
            "h-full min-h-[200px]",
            layoutOrchestrator.getComponentGridClass(component, layout?.columns || 3)
          )}>
            <Skeleton className="h-full w-full" />
          </div>
        }
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "h-full",
            layoutOrchestrator.getComponentGridClass(component, layout?.columns || 3)
          )}
          data-component-id={component.id}
        >
          <Component />
        </motion.div>
      </Suspense>
    );
  };

  if (loading || !layout) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const getLayoutEmphasisClass = () => {
    switch (layout.emphasis) {
      case 'onboarding':
        return 'dashboard-emphasis-onboarding';
      case 'growth':
        return 'dashboard-emphasis-growth';
      case 'optimization':
        return 'dashboard-emphasis-optimization';
      case 'mastery':
        return 'dashboard-emphasis-mastery';
      default:
        return '';
    }
  };

  return (
    <div className={cn("adaptive-dashboard-layout", getLayoutEmphasisClass())}>
      {/* Dynamic grid based on column count */}
      <div className={cn(
        "grid gap-6",
        layout.columns === 1 && "grid-cols-1",
        layout.columns === 2 && "grid-cols-1 md:grid-cols-2",
        layout.columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        <AnimatePresence mode="popLayout">
          {layout.components.map(component => renderComponent(component))}
        </AnimatePresence>
      </div>
    </div>
  );
}