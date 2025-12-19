import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';

// Performance thresholds
const THRESHOLDS = {
  LCP: 2500, // Largest Contentful Paint
  INP: 200,  // Interaction to Next Paint (replaces FID in web-vitals v3+)
  CLS: 0.1,  // Cumulative Layout Shift
  FCP: 1800, // First Contentful Paint
  TTFB: 800, // Time to First Byte
};

function sendToAnalytics(metric: Metric) {
  const { name, value, rating } = metric;
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${name}: ${Math.round(value)}ms (${rating})`);
  }

  // Send to analytics service (can be customized)
  if (typeof window !== 'undefined' && 'navigator' in window && 'sendBeacon' in navigator) {
    const body = JSON.stringify({
      metric: name,
      value: Math.round(value),
      rating,
      timestamp: Date.now(),
      url: window.location.pathname,
    });

    // Example: Send to your analytics endpoint
    // navigator.sendBeacon('/api/analytics', body);
    
    // For now, store in localStorage for monitoring
    try {
      const metrics = JSON.parse(localStorage.getItem('performance-metrics') || '[]');
      metrics.push(JSON.parse(body));
      // Keep only last 50 metrics
      if (metrics.length > 50) metrics.shift();
      localStorage.setItem('performance-metrics', JSON.stringify(metrics));
    } catch (e) {
      console.error('Error storing metrics:', e);
    }
  }
}

export function initPerformanceMonitoring() {
  // Track Core Web Vitals
  onCLS(sendToAnalytics);
  onFCP(sendToAnalytics);
  onINP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

export function getPerformanceMetrics() {
  try {
    return JSON.parse(localStorage.getItem('performance-metrics') || '[]');
  } catch {
    return [];
  }
}

export function clearPerformanceMetrics() {
  localStorage.removeItem('performance-metrics');
}

// Export thresholds for reference
export { THRESHOLDS };
