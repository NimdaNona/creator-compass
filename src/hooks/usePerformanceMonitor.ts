'use client';

import { useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  loadTime?: number;
  renderTime?: number;
}

export function usePerformanceMonitor(
  componentName: string,
  options: {
    logToConsole?: boolean;
    sendToAnalytics?: boolean;
    threshold?: {
      fcp?: number;
      lcp?: number;
      fid?: number;
      cls?: number;
    };
  } = {}
) {
  const {
    logToConsole = process.env.NODE_ENV === 'development',
    sendToAnalytics = false,
    threshold = {
      fcp: 1800, // 1.8s
      lcp: 2500, // 2.5s
      fid: 100, // 100ms
      cls: 0.1, // 0.1
    },
  } = options;

  const reportMetric = useCallback(
    (metric: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') => {
      if (logToConsole) {
        const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
        console.log(
          `${emoji} [${componentName}] ${metric}: ${value.toFixed(2)}ms (${rating})`
        );
      }

      if (sendToAnalytics && typeof window !== 'undefined' && 'gtag' in window) {
        // Send to Google Analytics
        (window as any).gtag('event', 'performance', {
          event_category: 'Web Vitals',
          event_label: componentName,
          metric_name: metric,
          value: Math.round(value),
          rating,
        });
      }
    },
    [componentName, logToConsole, sendToAnalytics]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    const metrics: PerformanceMetrics = {};

    // Measure component render time
    const startTime = performance.now();
    
    // Use requestIdleCallback to avoid blocking the main thread
    const measureRenderTime = () => {
      const renderTime = performance.now() - startTime;
      metrics.renderTime = renderTime;
      
      if (logToConsole) {
        console.log(`[${componentName}] Render time: ${renderTime.toFixed(2)}ms`);
      }
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(measureRenderTime);
    } else {
      setTimeout(measureRenderTime, 0);
    }

    // Observe Web Vitals
    try {
      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcp = entries.find((entry) => entry.name === 'first-contentful-paint');
        if (fcp) {
          metrics.fcp = fcp.startTime;
          const rating = 
            fcp.startTime <= threshold.fcp! ? 'good' :
            fcp.startTime <= threshold.fcp! * 1.5 ? 'needs-improvement' : 'poor';
          reportMetric('FCP', fcp.startTime, rating);
        }
      });
      fcpObserver.observe({ type: 'paint', buffered: true });

      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          metrics.lcp = lastEntry.startTime;
          const rating = 
            lastEntry.startTime <= threshold.lcp! ? 'good' :
            lastEntry.startTime <= threshold.lcp! * 1.5 ? 'needs-improvement' : 'poor';
          reportMetric('LCP', lastEntry.startTime, rating);
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstInput = entries[0];
        if (firstInput) {
          const fid = firstInput.processingStart - firstInput.startTime;
          metrics.fid = fid;
          const rating = 
            fid <= threshold.fid! ? 'good' :
            fid <= threshold.fid! * 3 ? 'needs-improvement' : 'poor';
          reportMetric('FID', fid, rating);
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];
      const clsObserver = new PerformanceObserver((list) => {
        clsEntries = clsEntries.concat(list.getEntries());
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Calculate CLS on page hide
      const calculateCLS = () => {
        let cls = 0;
        let sessionValue = 0;
        let sessionEntries: PerformanceEntry[] = [];
        
        clsEntries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            const firstEntry = sessionEntries[0];
            const lastEntry = sessionEntries[sessionEntries.length - 1];
            
            if (
              sessionValue &&
              entry.startTime - lastEntry.startTime < 1000 &&
              entry.startTime - firstEntry.startTime < 5000
            ) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }
            
            if (sessionValue > cls) {
              cls = sessionValue;
            }
          }
        });
        
        metrics.cls = cls;
        const rating = 
          cls <= threshold.cls! ? 'good' :
          cls <= threshold.cls! * 2.5 ? 'needs-improvement' : 'poor';
        reportMetric('CLS', cls, rating);
      };

      // Time to First Byte (TTFB)
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        metrics.ttfb = ttfb;
        const rating = 
          ttfb <= 800 ? 'good' :
          ttfb <= 1800 ? 'needs-improvement' : 'poor';
        reportMetric('TTFB', ttfb, rating);
      }

      // Clean up observers on unmount
      return () => {
        fcpObserver.disconnect();
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
        
        // Calculate final CLS
        if (document.visibilityState === 'hidden') {
          calculateCLS();
        }
      };
    } catch (error) {
      console.error('Performance monitoring error:', error);
    }
  }, [componentName, reportMetric, threshold]);

  return metrics;
}

// Hook to measure specific operations
export function useOperationTimer(operationName: string) {
  const startTimer = useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Operation: ${operationName}] Duration: ${duration.toFixed(2)}ms`);
      }
      return duration;
    };
  }, [operationName]);

  return startTimer;
}

// Hook to track component mount/unmount performance
export function useComponentLifecycle(componentName: string) {
  useEffect(() => {
    const mountTime = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Mounted`);
    }

    return () => {
      const lifetimeDuration = performance.now() - mountTime;
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `[${componentName}] Unmounted after ${lifetimeDuration.toFixed(2)}ms`
        );
      }
    };
  }, [componentName]);
}