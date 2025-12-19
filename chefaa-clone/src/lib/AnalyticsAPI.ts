import { supabase } from './supabase';

const FUNCTIONS_URL = 'https://hdcpruwkvarfbdtztzgq.supabase.co/functions/v1';

export interface AnalyticsData {
  success: boolean;
  data: any;
  timestamp: string;
}

export class AnalyticsAPI {
  // Collect analytics event
  static async collectEvent(type: string, data: any): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${FUNCTIONS_URL}/analytics-collector`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ type, data })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Analytics collection failed');
      }
    } catch (error) {
      console.error('Analytics collection error:', error);
      // Don't throw - analytics failures shouldn't break the app
    }
  }

  // Get aggregated analytics data
  static async getAnalytics(metric: string, timeRange: string = '24h'): Promise<AnalyticsData> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${FUNCTIONS_URL}/analytics-aggregator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ metric, timeRange })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Analytics fetch failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Analytics fetch error:', error);
      throw error;
    }
  }

  // Run system health check
  static async checkSystemHealth(): Promise<any> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(`${FUNCTIONS_URL}/health-checker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Health check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      throw error;
    }
  }

  // Track page view
  static async trackPageView(pageUrl: string, metadata?: any): Promise<void> {
    const sessionId = sessionStorage.getItem('analytics_session_id') || 
                     crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);

    await this.collectEvent('user_behavior', {
      session_id: sessionId,
      event_type: 'page_view',
      page_url: pageUrl,
      metadata: metadata || {},
      user_agent: navigator.userAgent
    });
  }

  // Track user interaction
  static async trackInteraction(eventType: string, elementId: string, metadata?: any): Promise<void> {
    const sessionId = sessionStorage.getItem('analytics_session_id') || 
                     crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);

    await this.collectEvent('user_behavior', {
      session_id: sessionId,
      event_type: eventType,
      page_url: window.location.pathname,
      element_id: elementId,
      metadata: metadata || {},
      user_agent: navigator.userAgent
    });
  }

  // Track medication adherence
  static async trackMedicationAdherence(medicationData: any): Promise<void> {
    await this.collectEvent('medication_adherence', medicationData);
  }

  // Track security event
  static async trackSecurityEvent(eventType: string, severity: string, description: string, metadata?: any): Promise<void> {
    await this.collectEvent('security_event', {
      event_type: eventType,
      severity,
      description,
      metadata: metadata || {},
      ip_address: '0.0.0.0' // Will be populated server-side
    });
  }

  // Track performance metric
  static async trackPerformance(metricType: string, metricName: string, value: number, unit?: string): Promise<void> {
    await this.collectEvent('performance', {
      metric_type: metricType,
      metric_name: metricName,
      value,
      unit: unit || 'ms'
    });
  }
}

export default AnalyticsAPI;
