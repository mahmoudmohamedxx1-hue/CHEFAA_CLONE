/**
 * Real User Monitoring (RUM) - Core Web Vitals Tracking
 * 
 * Tracks key performance metrics from actual user sessions:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): First paint
 * - TTFB (Time to First Byte): Server response
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
}

// Core Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function sendMetric(metric: PerformanceMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(
      `${emoji} ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`,
      metric
    );
  }

  // Send to analytics service (replace with your analytics endpoint)
  if (typeof navigator.sendBeacon !== 'undefined') {
    const endpoint = '/api/analytics/performance';
    const body = JSON.stringify(metric);
    
    try {
      navigator.sendBeacon(endpoint, body);
    } catch (error) {
      // Fallback to fetch if sendBeacon fails
      fetch(endpoint, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {
        // Silently fail if analytics endpoint is unavailable
      });
    }
  }

  // Store in localStorage for debugging (last 10 metrics)
  try {
    const stored = JSON.parse(localStorage.getItem('rum_metrics') || '[]');
    stored.push(metric);
    localStorage.setItem('rum_metrics', JSON.stringify(stored.slice(-10)));
  } catch (error) {
    // Ignore localStorage errors
  }
}

function createMetric(name: string, value: number): PerformanceMetric {
  return {
    name,
    value,
    rating: getRating(name, value),
    timestamp: Date.now(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };
}

/**
 * Track Largest Contentful Paint (LCP)
 * Good: < 2.5s, Needs Improvement: 2.5s - 4s, Poor: > 4s
 */
export function trackLCP() {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        if (lastEntry) {
          const metric = createMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
          sendMetric(metric);
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      console.warn('LCP tracking failed:', error);
    }
  }
}

/**
 * Track First Input Delay (FID)
 * Good: < 100ms, Needs Improvement: 100ms - 300ms, Poor: > 300ms
 */
export function trackFID() {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          const metric = createMetric('FID', entry.processingStart - entry.startTime);
          sendMetric(metric);
        });
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      console.warn('FID tracking failed:', error);
    }
  }
}

/**
 * Track Cumulative Layout Shift (CLS)
 * Good: < 0.1, Needs Improvement: 0.1 - 0.25, Poor: > 0.25
 */
export function trackCLS() {
  if ('PerformanceObserver' in window) {
    try {
      let clsValue = 0;
      let sessionValue = 0;
      let sessionEntries: any[] = [];

      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            if (
              sessionValue &&
              entry.startTime - lastSessionEntry.startTime < 1000 &&
              entry.startTime - firstSessionEntry.startTime < 5000
            ) {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            } else {
              sessionValue = entry.value;
              sessionEntries = [entry];
            }

            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              const metric = createMetric('CLS', clsValue);
              sendMetric(metric);
            }
          }
        });
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      console.warn('CLS tracking failed:', error);
    }
  }
}

/**
 * Track First Contentful Paint (FCP)
 * Good: < 1.8s, Needs Improvement: 1.8s - 3s, Poor: > 3s
 */
export function trackFCP() {
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: any) => {
          if (entry.name === 'first-contentful-paint') {
            const metric = createMetric('FCP', entry.startTime);
            sendMetric(metric);
          }
        });
      });

      observer.observe({ type: 'paint', buffered: true });
    } catch (error) {
      console.warn('FCP tracking failed:', error);
    }
  }
}

/**
 * Track Time to First Byte (TTFB)
 * Good: < 800ms, Needs Improvement: 800ms - 1800ms, Poor: > 1800ms
 */
export function trackTTFB() {
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      const metric = createMetric('TTFB', ttfb);
      sendMetric(metric);
    }
  } catch (error) {
    console.warn('TTFB tracking failed:', error);
  }
}

/**
 * Track custom page load time
 */
export function trackPageLoad(pageName: string) {
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      const metric = createMetric(`PageLoad_${pageName}`, loadTime);
      sendMetric(metric);
    }
  } catch (error) {
    console.warn('Page load tracking failed:', error);
  }
}

/**
 * Initialize all Core Web Vitals tracking
 */
export function initRUM() {
  // Only track in browser environment
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals
  trackLCP();
  trackFID();
  trackCLS();
  trackFCP();
  trackTTFB();

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Send final metrics when user leaves page
      trackCLS(); // Final CLS value
    }
  });

  console.log('📊 Real User Monitoring (RUM) initialized - tracking Core Web Vitals');
}

/**
 * Get stored metrics for debugging
 */
export function getStoredMetrics(): PerformanceMetric[] {
  try {
    return JSON.parse(localStorage.getItem('rum_metrics') || '[]');
  } catch {
    return [];
  }
}

/**
 * Clear stored metrics
 */
export function clearStoredMetrics() {
  try {
    localStorage.removeItem('rum_metrics');
  } catch {
    // Ignore errors
  }
}
