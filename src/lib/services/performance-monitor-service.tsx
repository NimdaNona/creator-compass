'use client';

import * as React from 'react';
import { useEffect } from 'react';
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

interface PerformanceMetric {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  componentName?: string;
  url?: string;
}

interface PerformanceMonitorOptions {
  reportToEndpoint?: boolean;
  logToConsole?: boolean;
  sampleRate?: number;
  batchSize?: number;
  flushInterval?: number;
}

export class PerformanceMonitorService {
  private static instance: PerformanceMonitorService;
  private metrics: PerformanceMetric[] = [];
  private options: PerformanceMonitorOptions;
  private flushTimer?: NodeJS.Timeout;
  private isInitialized = false;

  private constructor(options: PerformanceMonitorOptions = {}) {
    this.options = {
      reportToEndpoint: true,
      logToConsole: process.env.NODE_ENV === 'development',
      sampleRate: 1, // 100% sampling by default
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      ...options,
    };
  }

  static getInstance(options?: PerformanceMonitorOptions): PerformanceMonitorService {
    if (!PerformanceMonitorService.instance) {
      PerformanceMonitorService.instance = new PerformanceMonitorService(options);
    }
    return PerformanceMonitorService.instance;
  }

  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;

    // Set up Web Vitals monitoring
    onCLS(this.handleMetric.bind(this));
    onFID(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));

    // Set up periodic flushing
    if (this.options.reportToEndpoint) {
      this.startFlushTimer();
    }

    // Flush on page unload
    if ('addEventListener' in window) {
      window.addEventListener('beforeunload', () => {
        this.flush(true);
      });

      // Also flush on visibility change (mobile)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush(true);
        }
      });
    }

    // Monitor JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError('javascript-error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('unhandled-rejection', {
        reason: event.reason,
      });
    });

    // Monitor resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement;
        if ('src' in target || 'href' in target) {
          this.trackError('resource-error', {
            tagName: target.tagName,
            src: (target as any).src || (target as any).href,
          });
        }
      }
    }, true);

    if (this.options.logToConsole) {
      console.log('✅ Performance monitoring initialized');
    }
  }

  private handleMetric(metric: any) {
    // Apply sampling
    if (Math.random() > this.options.sampleRate!) return;

    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      url: window.location.href,
    };

    if (this.options.logToConsole) {
      const emoji = metric.rating === 'good' ? '✅' : 
                   metric.rating === 'needs-improvement' ? '⚠️' : '❌';
      console.log(
        `${emoji} [Web Vital] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`
      );
    }

    this.addMetric(performanceMetric);
  }

  addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);

    // Auto-flush if batch size reached
    if (this.metrics.length >= this.options.batchSize!) {
      this.flush();
    }
  }

  trackTiming(name: string, duration: number, componentName?: string) {
    const metric: PerformanceMetric = {
      name: `custom.${name}`,
      value: duration,
      componentName,
      url: window.location.href,
    };

    if (this.options.logToConsole) {
      console.log(`⏱️ [Timing] ${name}: ${duration.toFixed(2)}ms`);
    }

    this.addMetric(metric);
  }

  trackError(type: string, details: any) {
    const metric: PerformanceMetric = {
      name: `error.${type}`,
      value: 1,
      url: window.location.href,
    };

    if (this.options.logToConsole) {
      console.error(`❌ [Error] ${type}:`, details);
    }

    this.addMetric(metric);
  }

  private startFlushTimer() {
    this.flushTimer = setInterval(() => {
      if (this.metrics.length > 0) {
        this.flush();
      }
    }, this.options.flushInterval!);
  }

  private async flush(immediate = false) {
    if (this.metrics.length === 0 || !this.options.reportToEndpoint) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      const payload = {
        metrics: metricsToSend,
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      if (immediate && 'sendBeacon' in navigator) {
        // Use sendBeacon for reliability on page unload
        navigator.sendBeacon(
          '/api/performance',
          new Blob([JSON.stringify(payload)], { type: 'application/json' })
        );
      } else {
        // Regular fetch for normal operation
        await fetch('/api/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
      // Re-add metrics to queue on failure
      this.metrics.unshift(...metricsToSend);
    }
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(true);
    this.isInitialized = false;
  }

  // Helper method to measure component render time
  measureComponent(componentName: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.trackTiming(`component.${componentName}`, duration, componentName);
    };
  }

  // Helper to create marks and measures
  mark(name: string) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  }

  measure(name: string, startMark: string, endMark?: string) {
    if ('performance' in window && 'measure' in performance) {
      try {
        const measure = performance.measure(name, startMark, endMark);
        this.trackTiming(`measure.${name}`, measure.duration);
      } catch (error) {
        console.error('Failed to measure:', error);
      }
    }
  }

  // Get current metrics without flushing
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get aggregated statistics
  getStatistics() {
    const stats: Record<string, { count: number; total: number; average: number }> = {};

    this.metrics.forEach((metric) => {
      if (!stats[metric.name]) {
        stats[metric.name] = { count: 0, total: 0, average: 0 };
      }
      stats[metric.name].count++;
      stats[metric.name].total += metric.value;
      stats[metric.name].average = stats[metric.name].total / stats[metric.name].count;
    });

    return stats;
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitorService.getInstance();

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const endMeasure = performanceMonitor.measureComponent(componentName);
    return endMeasure;
  }, [componentName]);
}

// HOC for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceMonitoredComponent(props: P) {
    usePerformanceMonitor(componentName);
    return <Component {...props} />;
  };
}