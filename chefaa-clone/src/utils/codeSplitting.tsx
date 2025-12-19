import React, { ComponentType, lazy, Suspense, useEffect, useState } from 'react';

/**
 * Code splitting utilities for React components
 * Provides dynamic imports with loading states and error boundaries
 */

interface DynamicImportOptions {
  fallback?: React.ReactNode;
  delay?: number;
  retries?: number;
  preload?: boolean;
}

/**
 * Create a lazy-loaded component with retry logic
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  options: DynamicImportOptions = {}
): React.LazyExoticComponent<T> {
  const { retries = 3, delay = 1000 } = options;

  return lazy(() =>
    retryImport(componentImport, retries, delay)
  );
}

/**
 * Retry import with exponential backoff
 */
async function retryImport<T>(
  importFn: () => Promise<T>,
  retries: number,
  delay: number
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }

    // Wait before retry
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry with exponential backoff
    return retryImport(importFn, retries - 1, delay * 2);
  }
}

/**
 * HOC for lazy loading with custom fallback
 */
export function withLazyLoad<P extends object>(
  Component: React.LazyExoticComponent<ComponentType<P>>,
  fallback?: React.ReactNode
): React.FC<P> {
  return (props: P) => (
    <Suspense
      fallback={
        fallback || (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )
      }
    >
      <Component {...(props as any)} />
    </Suspense>
  );
}

/**
 * Preload component on hover/focus
 */
export function usePreloadComponent(
  componentImport: () => Promise<any>
): {
  preload: () => void;
  onMouseEnter: () => void;
  onFocus: () => void;
} {
  const [isPreloaded, setIsPreloaded] = useState(false);

  const preload = () => {
    if (!isPreloaded) {
      componentImport().then(() => setIsPreloaded(true));
    }
  };

  return {
    preload,
    onMouseEnter: preload,
    onFocus: preload,
  };
}

/**
 * Prefetch component when in viewport
 */
export function usePrefetchOnView(
  componentImport: () => Promise<any>,
  ref: React.RefObject<HTMLElement>
): void {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            componentImport();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.01, rootMargin: '100px' }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [componentImport, ref]);
}

/**
 * Route-based code splitting helper
 */
export const createLazyRoute = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazyWithRetry(importFn);
  return withLazyLoad(LazyComponent, fallback);
};

/**
 * Bundle size monitoring
 */
export function logBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    if ('performance' in window) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const scripts = resources.filter((r) => r.initiatorType === 'script');
      
      const totalSize = scripts.reduce((sum, script) => {
        return sum + (script.transferSize || 0);
      }, 0);

      console.log('[Bundle] Total JS size:', (totalSize / 1024).toFixed(2), 'KB');
      console.log('[Bundle] Script count:', scripts.length);
    }
  }
}

/**
 * Detect slow network and adjust code splitting
 */
export function useNetworkSpeed(): 'slow' | 'fast' | 'unknown' {
  const [speed, setSpeed] = useState<'slow' | 'fast' | 'unknown'>('unknown');

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;

      if (effectiveType === '4g') {
        setSpeed('fast');
      } else if (effectiveType === '3g' || effectiveType === '2g') {
        setSpeed('slow');
      }

      // Listen for changes
      connection?.addEventListener('change', () => {
        const newType = connection.effectiveType;
        setSpeed(newType === '4g' ? 'fast' : 'slow');
      });
    }
  }, []);

  return speed;
}

/**
 * Conditional code splitting based on conditions
 */
export function conditionalImport<T>(
  condition: boolean,
  importFn: () => Promise<T>,
  fallbackFn?: () => Promise<T>
): Promise<T> {
  if (condition) {
    return importFn();
  } else if (fallbackFn) {
    return fallbackFn();
  }
  throw new Error('Conditional import failed: condition is false and no fallback provided');
}

/**
 * Prefetch critical routes on idle
 */
export function prefetchCriticalRoutes(routes: Array<() => Promise<any>>): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      routes.forEach((route) => {
        route().catch((e) => {
          console.warn('Failed to prefetch route:', e);
        });
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      routes.forEach((route) => {
        route().catch((e) => {
          console.warn('Failed to prefetch route:', e);
        });
      });
    }, 1000);
  }
}
