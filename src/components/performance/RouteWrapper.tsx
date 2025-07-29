'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

interface RouteWrapperProps {
  children: ReactNode;
  routeName?: string;
  preloadRoutes?: string[];
}

export function RouteWrapper({ 
  children, 
  routeName,
  preloadRoutes = [] 
}: RouteWrapperProps) {
  const pathname = usePathname();
  const displayName = routeName || pathname;
  
  // Monitor route performance
  usePerformanceMonitor(`Route: ${displayName}`);

  // Preload specified routes for faster navigation
  useEffect(() => {
    if (preloadRoutes.length === 0) return;

    // Use Intersection Observer to preload routes when idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadRoutes.forEach((route) => {
          // Preload route using Next.js prefetch
          const link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = route;
          document.head.appendChild(link);
        });
      });
    }
  }, [preloadRoutes]);

  // Track route changes
  useEffect(() => {
    const routeChangeStart = performance.now();
    
    return () => {
      const routeChangeDuration = performance.now() - routeChangeStart;
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[Route Change] ${displayName} -> Duration: ${routeChangeDuration.toFixed(2)}ms`
        );
      }
    };
  }, [pathname, displayName]);

  return <>{children}</>;
}

// Higher-order component for route optimization
export function withRouteOptimization<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    routeName?: string;
    preloadRoutes?: string[];
    prefetchData?: () => Promise<any>;
  } = {}
) {
  return function OptimizedRoute(props: P) {
    const { routeName, preloadRoutes, prefetchData } = options;

    // Prefetch data on mount
    useEffect(() => {
      if (prefetchData && 'requestIdleCallback' in window) {
        requestIdleCallback(() => {
          prefetchData().catch(console.error);
        });
      }
    }, []);

    return (
      <RouteWrapper routeName={routeName} preloadRoutes={preloadRoutes}>
        <Component {...props} />
      </RouteWrapper>
    );
  };
}