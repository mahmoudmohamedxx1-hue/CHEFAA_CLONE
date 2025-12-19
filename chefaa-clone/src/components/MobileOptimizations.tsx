import React, { useEffect, useState } from 'react';
import { RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useNetworkStatus } from '../hooks/usePerformance';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

/**
 * Pull-to-refresh component for mobile
 */
export function PullToRefresh({ onRefresh, children, threshold = 80 }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      const distance = e.touches[0].clientY - touchStart;
      if (distance > 0) {
        setPullDistance(Math.min(distance, threshold * 1.5));
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  };

  const rotation = (pullDistance / threshold) * 360;
  const opacity = pullDistance / threshold;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex justify-center items-center transition-transform"
          style={{
            transform: `translateY(${isRefreshing ? 60 : pullDistance}px)`,
            opacity: isRefreshing ? 1 : opacity,
          }}
        >
          <div className="bg-white rounded-full p-3 shadow-lg">
            <RefreshCw
              className={`w-6 h-6 text-brand-blue-500 ${isRefreshing ? 'animate-spin' : ''}`}
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Network status indicator
 */
export function NetworkStatusIndicator({ language }: { language: 'ar' | 'en' }) {
  const isOnline = useNetworkStatus();
  const [showOffline, setShowOffline] = useState(false);

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
    } else {
      // Keep showing for a moment when coming back online
      const timer = setTimeout(() => setShowOffline(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showOffline) return null;

  return (
    <div
      className={`fixed top-16 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 p-4 rounded-lg shadow-lg transition-all ${
        isOnline ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {isOnline ? (
          <Wifi className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <WifiOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <p className={`font-semibold text-sm ${isOnline ? 'text-green-800' : 'text-red-800'}`}>
            {isOnline
              ? t('تم الاتصال بالإنترنت', 'Back Online')
              : t('لا يوجد اتصال بالإنترنت', 'No Internet Connection')}
          </p>
          <p className={`text-xs mt-1 ${isOnline ? 'text-green-700' : 'text-red-700'}`}>
            {isOnline
              ? t('تم استعادة الاتصال', 'Connection restored')
              : t('يعمل التطبيق في وضع عدم الاتصال', 'App working in offline mode')}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for better perceived performance
 */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
      <div className="aspect-square mb-3 bg-gray-200 rounded-lg" />
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
        <div className="h-10 bg-gray-200 rounded w-full mt-3" />
      </div>
    </div>
  );
}

/**
 * Error boundary fallback with retry
 */
export function ErrorFallback({
  error,
  resetError,
  language,
}: {
  error: Error;
  resetError: () => void;
  language: 'ar' | 'en';
}) {
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {t('حدث خطأ', 'Something Went Wrong')}
        </h2>
        <p className="text-gray-600 mb-6">
          {t(
            'عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
            "We're sorry, an unexpected error occurred. Please try again."
          )}
        </p>
        <details className="text-left mb-6">
          <summary className="text-sm text-gray-500 cursor-pointer mb-2">
            {t('تفاصيل الخطأ', 'Error Details')}
          </summary>
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-32">
            {error.message}
          </pre>
        </details>
        <button
          onClick={resetError}
          className="w-full py-3 px-6 bg-brand-blue-500 text-white rounded-lg font-semibold hover:bg-brand-blue-600 transition-colors"
        >
          {t('إعادة المحاولة', 'Try Again')}
        </button>
      </div>
    </div>
  );
}

/**
 * Touch-friendly button with haptic feedback simulation
 */
export function TouchButton({
  children,
  onClick,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = () => {
    setIsPressed(true);
    // Simulate haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
  };

  return (
    <button
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={onClick}
      className={`min-h-[44px] min-w-[44px] transition-transform ${
        isPressed ? 'scale-95' : 'scale-100'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
