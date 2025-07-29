'use client';

import { ReactNode, memo, useCallback, useMemo } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

interface OptimizedClientProps {
  children: ReactNode;
  componentName?: string;
  memoize?: boolean;
  debounceMs?: number;
}

// Optimized client component wrapper with performance monitoring
export function OptimizedClient({
  children,
  componentName = 'OptimizedComponent',
  memoize = true,
}: OptimizedClientProps) {
  usePerformanceMonitor(componentName);

  if (memoize) {
    return <MemoizedWrapper>{children}</MemoizedWrapper>;
  }

  return <>{children}</>;
}

// Memoized wrapper to prevent unnecessary re-renders
const MemoizedWrapper = memo(({ children }: { children: ReactNode }) => {
  return <>{children}</>;
});

MemoizedWrapper.displayName = 'MemoizedWrapper';

// Hook for optimized callbacks
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options: {
    debounceMs?: number;
    throttleMs?: number;
  } = {}
): T {
  const { debounceMs, throttleMs } = options;

  const memoizedCallback = useCallback(callback, deps);

  const debouncedCallback = useMemo(() => {
    if (!debounceMs) return memoizedCallback;

    let timeoutId: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        memoizedCallback(...args);
      }, debounceMs);
    }) as T;
  }, [memoizedCallback, debounceMs]);

  const throttledCallback = useMemo(() => {
    if (!throttleMs) return debouncedCallback;

    let lastCall = 0;
    let timeoutId: NodeJS.Timeout;

    return ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCall;

      if (timeSinceLastCall >= throttleMs) {
        lastCall = now;
        debouncedCallback(...args);
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          lastCall = Date.now();
          debouncedCallback(...args);
        }, throttleMs - timeSinceLastCall);
      }
    }) as T;
  }, [debouncedCallback, throttleMs]);

  return throttledCallback;
}

// Hook for optimized memo with custom comparison
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual?: (prev: T, next: T) => boolean
): T {
  const memoizedValue = useMemo(factory, deps);

  // If custom comparison is provided, use it
  if (isEqual) {
    const prevValueRef = React.useRef<T>(memoizedValue);
    
    if (!isEqual(prevValueRef.current, memoizedValue)) {
      prevValueRef.current = memoizedValue;
    }
    
    return prevValueRef.current;
  }

  return memoizedValue;
}

// Virtual scrolling wrapper for large lists
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}