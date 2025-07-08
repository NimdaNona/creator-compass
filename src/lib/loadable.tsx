'use client';

import { lazy, Suspense, ComponentType, ReactNode } from 'react';

interface LoadableOptions {
  fallback?: ReactNode;
  delay?: number;
  timeout?: number;
}

interface LoadableComponent<P = {}> extends ComponentType<P> {
  preload?: () => Promise<void>;
}

/**
 * Creates a loadable component with code splitting
 */
export function loadable<P = {}>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options: LoadableOptions = {}
): LoadableComponent<P> {
  const {
    fallback = <div className="flex items-center justify-center p-4">Loading...</div>,
    delay = 200,
    timeout = 10000,
  } = options;

  // Create the lazy component
  const LazyComponent = lazy(() => {
    const startTime = Date.now();
    
    return Promise.race([
      importFunc().then(module => {
        const loadTime = Date.now() - startTime;
        
        // Log performance in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Loadable] Component loaded in ${loadTime}ms`);
        }
        
        return module;
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Component load timeout')), timeout);
      }),
    ]);
  });

  // Wrapper component with suspense
  const LoadableWrapper = (props: P) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );

  // Add preload method
  LoadableWrapper.preload = async () => {
    try {
      await importFunc();
    } catch (error) {
      console.error('[Loadable] Preload failed:', error);
    }
  };

  return LoadableWrapper as LoadableComponent<P>;
}

/**
 * Loading fallback components
 */
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
  </div>
);

export const LoadingSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse ${className}`}>
    <div className="bg-gray-200 rounded h-4 w-3/4 mb-2"></div>
    <div className="bg-gray-200 rounded h-4 w-1/2 mb-2"></div>
    <div className="bg-gray-200 rounded h-4 w-5/6"></div>
  </div>
);

export const LoadingCard = () => (
  <div className="animate-pulse">
    <div className="bg-gray-200 rounded-lg p-6">
      <div className="bg-gray-300 h-6 w-1/3 rounded mb-4"></div>
      <div className="space-y-2">
        <div className="bg-gray-300 h-4 w-full rounded"></div>
        <div className="bg-gray-300 h-4 w-4/5 rounded"></div>
        <div className="bg-gray-300 h-4 w-2/3 rounded"></div>
      </div>
    </div>
  </div>
);

/**
 * Higher-order component for route-level code splitting
 */
export function withLoadable<P = {}>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  options?: LoadableOptions
) {
  return loadable(importFunc, options);
}

/**
 * Preload components on hover/focus for better UX
 */
export function usePreloadOnHover(preloadFunc: () => void) {
  const handleMouseEnter = () => {
    preloadFunc();
  };

  const handleFocus = () => {
    preloadFunc();
  };

  return {
    onMouseEnter: handleMouseEnter,
    onFocus: handleFocus,
  };
}

/**
 * Bundle of commonly used loadable components
 */
export const LoadableComponents = {
  // Dashboard components
  Dashboard: loadable(() => import('@/components/dashboard/Dashboard'), {
    fallback: <LoadingCard />,
  }),
  
  // Template generators
  TemplateGenerators: loadable(() => import('@/components/templates/TemplateGenerators'), {
    fallback: <LoadingSkeleton className="h-96" />,
  }),
  
  // Analytics components
  AnalyticsDashboard: loadable(() => import('@/components/analytics/AnalyticsDashboard'), {
    fallback: <LoadingSpinner />,
  }),
  
  // Achievement system
  AchievementsDashboard: loadable(() => import('@/components/engagement/AchievementsDashboard'), {
    fallback: <LoadingCard />,
  }),
  
  // Resource library
  ResourceLibrary: loadable(() => import('@/components/resources/ResourceLibrary'), {
    fallback: <LoadingSkeleton className="h-64" />,
  }),
};

/**
 * Route-level loadable pages
 */
export const LoadablePages = {
  Dashboard: loadable(() => import('@/app/dashboard/page'), {
    fallback: <LoadingSpinner />,
  }),
  
  Templates: loadable(() => import('@/app/templates/page'), {
    fallback: <LoadingCard />,
  }),
  
  Analytics: loadable(() => import('@/app/analytics/page'), {
    fallback: <LoadingSpinner />,
  }),
  
  Achievements: loadable(() => import('@/app/achievements/page'), {
    fallback: <LoadingCard />,
  }),
  
  Resources: loadable(() => import('@/app/resources/page'), {
    fallback: <LoadingSkeleton className="h-96" />,
  }),
};