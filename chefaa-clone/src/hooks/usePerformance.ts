// Advanced Performance Utilities
import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Virtual scrolling hook for large lists
 * Dramatically improves performance for product grids
 */
export function useVirtualScroll(
  itemCount: number,
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight)
  );

  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push(i);
  }

  return {
    visibleItems,
    totalHeight: itemCount * itemHeight,
    offsetY: startIndex * itemHeight,
    onScroll: (e: React.UIEvent<HTMLElement>) => {
      setScrollTop(e.currentTarget.scrollTop);
    },
  };
}

/**
 * Debounce hook for search and input optimization
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [(node: Element | null) => void, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [node, setNode] = useState<Element | null>(null);

  useEffect(() => {
    if (!node) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node, options]);

  return [setNode, isIntersecting];
}

/**
 * Image preloader for better perceived performance
 */
export function useImagePreload(src: string): boolean {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.onload = () => setLoaded(true);
    img.src = src;

    return () => {
      img.onload = null;
    };
  }, [src]);

  return loaded;
}

/**
 * Network status hook for offline detection
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Touch gesture detection for mobile
 */
export function useSwipeGesture(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold: number = 50
) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!touchStart.current) return;

      const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStart.current.y;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }

      touchStart.current = null;
    },
    [onSwipeLeft, onSwipeRight, threshold]
  );

  return { handleTouchStart, handleTouchEnd };
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitoring(pageName: string) {
  useEffect(() => {
    // Mark page load start
    performance.mark(`${pageName}-start`);

    return () => {
      // Mark page load end and measure
      performance.mark(`${pageName}-end`);
      performance.measure(
        pageName,
        `${pageName}-start`,
        `${pageName}-end`
      );

      // Get the measurement
      const measure = performance.getEntriesByName(pageName)[0];
      if (measure) {
        console.log(`[Performance] ${pageName}: ${measure.duration.toFixed(2)}ms`);
      }

      // Clean up marks
      performance.clearMarks(`${pageName}-start`);
      performance.clearMarks(`${pageName}-end`);
      performance.clearMeasures(pageName);
    };
  }, [pageName]);
}

/**
 * Request deduplication utility
 */
class RequestCache {
  private cache = new Map<string, Promise<any>>();
  private ttl = 5000; // 5 seconds

  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const promise = fn();
    this.cache.set(key, promise);

    // Clear cache after TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, this.ttl);

    return promise;
  }
}

export const requestCache = new RequestCache();

/**
 * Optimized fetch with retry and timeout
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = 3,
  timeout: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!response.ok && retries > 0) {
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * (4 - retries)));
      return fetchWithRetry(url, options, retries - 1, timeout);
    }

    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * (4 - retries)));
      return fetchWithRetry(url, options, retries - 1, timeout);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
