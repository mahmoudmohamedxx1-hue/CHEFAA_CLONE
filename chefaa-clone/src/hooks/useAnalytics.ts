import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// Session management
let sessionId: string | null = null;
let sessionStartTime: number = Date.now();

const getSessionId = () => {
  if (!sessionId) {
    sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
  }
  return sessionId;
};

const getDeviceType = () => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

const getBrowser = () => {
  const ua = navigator.userAgent;
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Safari') > -1) return 'Safari';
  if (ua.indexOf('Firefox') > -1) return 'Firefox';
  if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1) return 'IE';
  return 'Other';
};

interface AnalyticsEvent {
  event_type: 'page_view' | 'product_view' | 'product_click' | 'add_to_cart' | 'click' | 'scroll';
  event_data?: Record<string, any>;
}

export function useAnalytics() {
  const { user } = useAuth();

  // Initialize or update session
  useEffect(() => {
    initializeSession();
    
    // Update session on page unload
    const handleBeforeUnload = () => {
      updateSessionEnd();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user]);

  const initializeSession = async () => {
    const sid = getSessionId();
    
    try {
      // Check if session exists
      const { data: existingSession } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('session_id', sid)
        .single();

      if (!existingSession) {
        // Create new session
        await supabase.from('user_sessions').insert({
          user_id: user?.id || null,
          session_id: sid,
          device_type: getDeviceType(),
          browser: getBrowser(),
          started_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  const updateSessionEnd = async () => {
    const sid = getSessionId();
    const duration = Math.floor((Date.now() - sessionStartTime) / 1000);

    try {
      await supabase
        .from('user_sessions')
        .update({
          ended_at: new Date().toISOString(),
          total_page_views: duration,
        })
        .eq('session_id', sid);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  // Track page view
  const trackPageView = useCallback(async (pageUrl: string, pageTitle?: string) => {
    const sid = getSessionId();
    
    try {
      const { data: session } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('session_id', sid)
        .single();

      if (session) {
        await supabase.from('page_views').insert({
          session_id: session.id,
          user_id: user?.id || null,
          page_url: pageUrl,
          page_title: pageTitle || document.title,
          referrer: document.referrer,
        });
      }
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }, [user]);

  // Track product interaction
  const trackProductInteraction = useCallback(async (
    productId: string,
    interactionType: 'view' | 'quick_view' | 'add_to_cart' | 'wishlist' | 'click',
    additionalData?: Record<string, any>
  ) => {
    const sid = getSessionId();
    
    try {
      const { data: session } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('session_id', sid)
        .single();

      if (session) {
        await supabase.from('product_interactions').insert({
          session_id: session.id,
          user_id: user?.id || null,
          product_id: productId,
          interaction_type: interactionType,
          interaction_data: additionalData || null,
        });
      }
    } catch (error) {
      console.error('Error tracking product interaction:', error);
    }
  }, [user]);

  // Track click for heatmap
  const trackClick = useCallback(async (
    pageUrl: string,
    elementSelector: string,
    x: number,
    y: number
  ) => {
    try {
      await supabase.from('click_heatmap').insert({
        page_url: pageUrl,
        element_selector: elementSelector,
        click_x: x,
        click_y: y,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        device_type: getDeviceType(),
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }, []);

  // Track cart abandonment
  const trackCartAbandonment = useCallback(async (
    cartData: any[],
    cartTotal: number
  ) => {
    if (!user) return;

    const sid = getSessionId();
    
    try {
      const { data: session } = await supabase
        .from('user_sessions')
        .select('id')
        .eq('session_id', sid)
        .single();

      if (session) {
        await supabase.rpc('track_cart_abandonment', {
          p_user_id: user.id,
          p_session_id: session.id,
          p_cart_data: cartData,
          p_cart_total: cartTotal,
        });
      }
    } catch (error) {
      console.error('Error tracking cart abandonment:', error);
    }
  }, [user]);

  return {
    trackPageView,
    trackProductInteraction,
    trackClick,
    trackCartAbandonment,
  };
}

// Hook for automatic page view tracking
export function usePageViewTracking(pageUrl?: string) {
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    const url = pageUrl || window.location.pathname;
    trackPageView(url, document.title);
  }, [pageUrl, trackPageView]);
}
