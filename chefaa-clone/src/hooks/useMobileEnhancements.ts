import { useEffect, useState } from 'react';

/**
 * Phase 5: Touch Interface Optimization
 * - 44px minimum touch targets
 * - Touch gestures throughout
 * - Haptic feedback for interactions
 */

/**
 * Custom hook for haptic feedback
 */
export function useHapticFeedback() {
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  return {
    light: () => vibrate(10),
    medium: () => vibrate(20),
    heavy: () => vibrate(30),
    success: () => vibrate([50, 50, 50]),
    error: () => vibrate([30, 30, 30, 30]),
    tap: () => vibrate(10),
  };
}

/**
 * Phase 6: Mobile Performance Optimization
 * - Lazy loading optimizations
 * - Progressive loading for slow connections
 * - Offline support
 */

/**
 * Network status hook
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
 * Connection type hook for adaptive loading
 */
export function useConnectionType() {
  const [connectionType, setConnectionType] = useState<'slow' | 'fast' | 'unknown'>('unknown');

  useEffect(() => {
    const connection = (navigator as any).connection 
      || (navigator as any).mozConnection 
      || (navigator as any).webkitConnection;

    if (connection) {
      const updateConnectionType = () => {
        const effectiveType = connection.effectiveType;
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          setConnectionType('slow');
        } else {
          setConnectionType('fast');
        }
      };

      updateConnectionType();
      connection.addEventListener('change', updateConnectionType);

      return () => {
        connection.removeEventListener('change', updateConnectionType);
      };
    }
  }, []);

  return connectionType;
}

/**
 * Battery status hook for power mode optimization
 */
export function useBatteryStatus() {
  const [batteryStatus, setBatteryStatus] = useState<{
    level: number;
    charging: boolean;
    powerMode: 'normal' | 'low' | 'critical';
  }>({
    level: 1,
    charging: false,
    powerMode: 'normal',
  });

  useEffect(() => {
    const getBattery = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();

          const updateBatteryStatus = () => {
            const level = battery.level;
            const charging = battery.charging;
            let powerMode: 'normal' | 'low' | 'critical' = 'normal';

            if (!charging) {
              if (level <= 0.1) {
                powerMode = 'critical';
              } else if (level <= 0.2) {
                powerMode = 'low';
              }
            }

            setBatteryStatus({ level, charging, powerMode });
          };

          updateBatteryStatus();
          
          battery.addEventListener('levelchange', updateBatteryStatus);
          battery.addEventListener('chargingchange', updateBatteryStatus);

          return () => {
            battery.removeEventListener('levelchange', updateBatteryStatus);
            battery.removeEventListener('chargingchange', updateBatteryStatus);
          };
        } catch (error) {
          console.error('Battery API not supported:', error);
        }
      }
    };

    getBattery();
  }, []);

  return batteryStatus;
}

/**
 * Phase 7: PWA Features
 * - Install prompt handling
 * - Push notifications
 * - App-like experience
 */

/**
 * PWA install prompt hook
 */
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return false;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstallable(false);
      setInstallPrompt(null);
      return true;
    }

    return false;
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
}

/**
 * Push notifications hook
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) return false;

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, options);
    }
  };

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification,
  };
}

/**
 * Phase 8: Mobile Accessibility
 * - Screen reader optimizations
 * - High contrast mode
 * - Voice control
 */

/**
 * Screen reader detection hook
 */
export function useScreenReader() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Detect screen reader by checking ARIA live region updates
    const testRegion = document.createElement('div');
    testRegion.setAttribute('role', 'status');
    testRegion.setAttribute('aria-live', 'polite');
    testRegion.style.position = 'absolute';
    testRegion.style.left = '-9999px';
    document.body.appendChild(testRegion);

    let updateCount = 0;
    const observer = new MutationObserver(() => {
      updateCount++;
      if (updateCount > 0) {
        setIsActive(true);
      }
    });

    observer.observe(testRegion, { childList: true, subtree: true });

    testRegion.textContent = 'Screen reader test';

    setTimeout(() => {
      observer.disconnect();
      document.body.removeChild(testRegion);
    }, 1000);

    return () => {
      if (document.body.contains(testRegion)) {
        observer.disconnect();
        document.body.removeChild(testRegion);
      }
    };
  }, []);

  return isActive;
}

/**
 * High contrast mode detection
 */
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    
    setIsHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  return isHighContrast;
}

/**
 * Reduced motion preference
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Focus management for keyboard navigation
 */
export function useFocusTrap(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = document.querySelectorAll(focusableSelectors);
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);
}

/**
 * Announce content to screen readers
 */
export function useAnnounce() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.position = 'absolute';
    announcer.style.left = '-9999px';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.overflow = 'hidden';

    document.body.appendChild(announcer);
    announcer.textContent = message;

    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  };

  return announce;
}

/**
 * Viewport height compensation for mobile browsers
 */
export function useViewportHeight() {
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);
}

/**
 * Safe area insets for notched devices
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      
      setSafeArea({
        top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
        right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
        left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
    };
  }, []);

  return safeArea;
}
