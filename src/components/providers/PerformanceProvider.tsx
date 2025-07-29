'use client';

import { useEffect } from 'react';
import { performanceMonitor } from '@/lib/services/performance-monitor-service';

export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.initialize();

    // Mark app initialization
    performanceMonitor.mark('app-init-start');

    // Measure initial load time
    if ('performance' in window && 'timing' in performance) {
      const timing = performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      
      if (loadTime > 0) {
        performanceMonitor.trackTiming('page-load', loadTime);
      }
    }

    // Mark when React app is interactive
    requestIdleCallback(() => {
      performanceMonitor.mark('app-interactive');
      performanceMonitor.measure('app-init', 'app-init-start', 'app-interactive');
    });

    return () => {
      // Cleanup on unmount
      performanceMonitor.destroy();
    };
  }, []);

  return <>{children}</>;
}