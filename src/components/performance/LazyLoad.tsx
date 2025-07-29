'use client';

import React, { Suspense, lazy, ComponentType, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface LazyLoadOptions {
  fallback?: ReactNode;
  preload?: boolean;
  delay?: number;
}

interface LazyComponentProps {
  fallback?: ReactNode;
  children: ReactNode;
}

export function LazyComponent({ fallback, children }: LazyComponentProps) {
  return (
    <Suspense fallback={fallback || <DefaultLoadingFallback />}>
      {children}
    </Suspense>
  );
}

// Default loading fallback
export function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// Skeleton loading fallback for cards
export function CardSkeletonFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// Skeleton loading fallback for lists
export function ListSkeletonFallback({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton loading fallback for grids
export function GridSkeletonFallback({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

// Helper function to create lazy loaded components with options
export function createLazyComponent<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: LazyLoadOptions = {}
): ComponentType<P> {
  const LazyComponent = lazy(importFn);
  
  if (options.preload) {
    // Preload the component
    importFn();
  }

  return (props: P) => (
    <Suspense fallback={options.fallback || <DefaultLoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Export commonly lazy-loaded components
export const LazyAnalyticsDashboard = createLazyComponent(
  () => import('@/components/analytics/AnalyticsDashboard').then(mod => ({ default: mod.AnalyticsDashboard })),
  { fallback: <CardSkeletonFallback /> }
);

export const LazyTemplateGenerator = createLazyComponent(
  () => import('@/components/templates/TemplateGenerator').then(mod => ({ default: mod.TemplateGenerator })),
  { fallback: <GridSkeletonFallback count={3} /> }
);

export const LazyResourceGrid = createLazyComponent(
  () => import('@/components/resources/ResourceGrid').then(mod => ({ default: mod.ResourceGrid })),
  { fallback: <GridSkeletonFallback /> }
);

export const LazyAchievementsList = createLazyComponent(
  () => import('@/components/achievements/AchievementsList').then(mod => ({ default: mod.AchievementsList })),
  { fallback: <ListSkeletonFallback count={5} /> }
);

export const LazyPlatformConnectionsList = createLazyComponent(
  () => import('@/components/platform-connections/PlatformConnectionsList').then(mod => ({ default: mod.default })),
  { fallback: <GridSkeletonFallback count={4} /> }
);

export const LazyScheduledPostsList = createLazyComponent(
  () => import('@/components/scheduling/ScheduledPostsList').then(mod => ({ default: mod.ScheduledPostsList })),
  { fallback: <ListSkeletonFallback count={5} /> }
);

// Intersection Observer based lazy loading
export function LazyIntersection({ 
  children, 
  rootMargin = '100px',
  threshold = 0.1,
  fallback = <DefaultLoadingFallback />
}: {
  children: ReactNode;
  rootMargin?: string;
  threshold?: number;
  fallback?: ReactNode;
}) {
  const [isInView, setIsInView] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [rootMargin, threshold]);

  return (
    <div ref={ref}>
      {isInView ? children : fallback}
    </div>
  );
}