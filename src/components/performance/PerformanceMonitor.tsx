'use client';

import { useEffect, useRef } from 'react';

interface PerformanceEntry {
  name: string;
  type: string;
  startTime: number;
  duration: number;
}

interface VitalsReportEntry {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
}

export function PerformanceMonitor() {
  const vitalsData = useRef<VitalsReportEntry[]>([]);

  useEffect(() => {
    // Only run in production or when explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING) {
      return;
    }

    // Web Vitals monitoring
    const reportWebVitals = (entry: VitalsReportEntry) => {
      vitalsData.current.push(entry);
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${entry.name}:`, {
          value: entry.value,
          rating: entry.rating,
          delta: entry.delta,
        });
      }

      // Send to analytics service
      sendToAnalytics(entry);
    };

    // Import and register web vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(reportWebVitals);
      getFID(reportWebVitals);
      getFCP(reportWebVitals);
      getLCP(reportWebVitals);
      getTTFB(reportWebVitals);
    }).catch(() => {
      // Fallback for when web-vitals is not available
      console.warn('[Performance] Web Vitals library not available');
    });

    // Performance observer for custom metrics
    if ('PerformanceObserver' in window) {
      try {
        // Monitor navigation timing
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              reportCustomMetric('Page Load Time', navEntry.loadEventEnd - navEntry.fetchStart);
              reportCustomMetric('DOM Content Loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
              reportCustomMetric('First Paint', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });

        // Monitor largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            reportCustomMetric('LCP Element', entry.startTime, {
              element: (entry as any).element?.tagName || 'unknown',
              url: (entry as any).url || '',
            });
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Monitor layout shifts
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              reportCustomMetric('Layout Shift', (entry as any).value);
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Monitor long tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            reportCustomMetric('Long Task', entry.duration, {
              attribution: (entry as any).attribution?.[0]?.name || 'unknown',
            });
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });

      } catch (error) {
        console.warn('[Performance] PerformanceObserver setup failed:', error);
      }
    }

    // Memory usage monitoring (if available)
    if ('memory' in performance) {
      const monitorMemory = () => {
        const memInfo = (performance as any).memory;
        reportCustomMetric('JS Heap Used', memInfo.usedJSHeapSize);
        reportCustomMetric('JS Heap Total', memInfo.totalJSHeapSize);
        reportCustomMetric('JS Heap Limit', memInfo.jsHeapSizeLimit);
      };

      // Monitor memory every 30 seconds
      const memoryInterval = setInterval(monitorMemory, 30000);
      monitorMemory(); // Initial measurement

      return () => clearInterval(memoryInterval);
    }
  }, []);

  const reportCustomMetric = (name: string, value: number, metadata?: any) => {
    const entry = {
      name,
      value,
      metadata,
      timestamp: Date.now(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}:`, value, metadata);
    }

    // Send to analytics
    sendToAnalytics(entry);
  };

  const sendToAnalytics = (data: any) => {
    // Send to your analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'Performance',
        event_label: data.name,
        value: Math.round(data.value),
        custom_map: {
          metric_rating: data.rating,
          metric_delta: data.delta,
        },
      });
    }

    // Send to custom analytics endpoint
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'performance',
          data,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      }).catch(() => {
        // Silently fail
      });
    }
  };

  // Component doesn't render anything
  return null;
}

// Extended Window interface for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}