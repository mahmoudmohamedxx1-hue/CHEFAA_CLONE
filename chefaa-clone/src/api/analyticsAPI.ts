import { supabase } from '../lib/supabase';

export interface AnalyticsDashboardData {
  total_events: number;
  active_users: number;
  total_revenue: number;
  avg_response_time: number;
  recent_events: Array<{
    event_type: string;
    count: number;
    timestamp: string;
  }>;
}

export interface PlatformMetrics {
  period: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time: number;
  peak_requests_per_hour: number;
  unique_users: number;
}

export interface UserAnalytics {
  total_users: number;
  active_users_today: number;
  new_users_this_week: number;
  user_retention_rate: number;
  avg_session_duration: number;
  top_user_actions: Array<{
    action: string;
    count: number;
  }>;
}

export interface HealthcareMetrics {
  total_patients: number;
  prescriptions_uploaded: number;
  medication_adherence_rate: number;
  clinical_outcomes: Array<{
    outcome_type: string;
    count: number;
    improvement_rate: number;
  }>;
}

export interface FinancialMetrics {
  total_revenue: number;
  revenue_growth: number;
  avg_order_value: number;
  top_revenue_categories: Array<{
    category: string;
    revenue: number;
  }>;
}

export interface PredictiveAnalytics {
  prediction_type: string;
  predicted_value: number;
  confidence_score: number;
  trend: string;
  factors: string[];
}

export interface UserBehaviorData {
  user_journey: Array<{
    step: string;
    users: number;
    conversion_rate: number;
  }>;
  engagement_score: number;
  feature_usage: Array<{
    feature: string;
    usage_count: number;
  }>;
}

export interface RealtimeMetrics {
  current_active_users: number;
  requests_per_minute: number;
  system_health: 'healthy' | 'degraded' | 'critical';
  recent_activities: Array<{
    activity_type: string;
    timestamp: string;
    user_id: string;
  }>;
}

class AnalyticsAPI {
  private async callFunction(functionName: string, action: string, data: any = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action, ...data }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API call failed');
    }

    const result = await response.json();
    return result.data;
  }

  // Advanced Analytics Dashboard
  async getDashboardOverview(timeRange: string = '24h'): Promise<AnalyticsDashboardData> {
    return this.callFunction('advanced-analytics-dashboard', 'get_dashboard_overview', { timeRange });
  }

  async getPlatformMetrics(timeRange: string = '24h'): Promise<PlatformMetrics> {
    return this.callFunction('advanced-analytics-dashboard', 'get_platform_metrics', { timeRange });
  }

  async getUserAnalytics(timeRange: string = '7d'): Promise<UserAnalytics> {
    return this.callFunction('advanced-analytics-dashboard', 'get_user_analytics', { timeRange });
  }

  async getHealthcareMetrics(timeRange: string = '30d'): Promise<HealthcareMetrics> {
    return this.callFunction('advanced-analytics-dashboard', 'get_healthcare_metrics', { timeRange });
  }

  async getFinancialMetrics(timeRange: string = '30d'): Promise<FinancialMetrics> {
    return this.callFunction('advanced-analytics-dashboard', 'get_financial_metrics', { timeRange });
  }

  async exportAnalyticsData(format: 'csv' | 'pdf' | 'excel' | 'json', dataType: string): Promise<Blob> {
    const result = await this.callFunction('advanced-analytics-dashboard', 'export_analytics_data', { format, dataType });
    // Convert base64 to Blob
    const byteCharacters = atob(result.file_data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: result.mime_type });
  }

  // Predictive Analytics
  async predictHealthOutcomes(patientData: any): Promise<PredictiveAnalytics> {
    return this.callFunction('predictive-analytics-engine', 'predict_health_outcomes', { patientData });
  }

  async predictPatientRisk(patientId: string): Promise<PredictiveAnalytics> {
    return this.callFunction('predictive-analytics-engine', 'predict_patient_risk', { patientId });
  }

  async predictMedicationAdherence(patientId: string): Promise<PredictiveAnalytics> {
    return this.callFunction('predictive-analytics-engine', 'predict_medication_adherence', { patientId });
  }

  async forecastRevenue(months: number = 6): Promise<Array<{ month: string; predicted_revenue: number; confidence: number }>> {
    return this.callFunction('predictive-analytics-engine', 'predict_revenue', { months });
  }

  async forecastTrends(dataType: string, timeframe: string): Promise<Array<{ date: string; predicted_value: number }>> {
    return this.callFunction('predictive-analytics-engine', 'forecast_trends', { dataType, timeframe });
  }

  // Healthcare Outcomes Analytics
  async getPatientOutcomes(timeRange: string = '90d'): Promise<any> {
    return this.callFunction('healthcare-outcomes-analytics', 'get_patient_outcomes', { timeRange });
  }

  async analyzeMedicationEffectiveness(medicationId: string): Promise<any> {
    return this.callFunction('healthcare-outcomes-analytics', 'analyze_medication_effectiveness', { medicationId });
  }

  async trackClinicalOutcomes(outcomeType: string): Promise<any> {
    return this.callFunction('healthcare-outcomes-analytics', 'track_clinical_outcomes', { outcomeType });
  }

  async analyzePopulationHealth(demographicFilters?: any): Promise<any> {
    return this.callFunction('healthcare-outcomes-analytics', 'analyze_population_health', { filters: demographicFilters });
  }

  async analyzeAdverseEvents(timeRange: string = '30d'): Promise<any> {
    return this.callFunction('healthcare-outcomes-analytics', 'analyze_adverse_events', { timeRange });
  }

  // Business Intelligence Dashboard
  async getExecutiveSummary(timeRange: string = '30d'): Promise<any> {
    return this.callFunction('business-intelligence-dashboard', 'get_executive_summary', { timeRange });
  }

  async getFinancialPerformance(timeRange: string = '90d'): Promise<any> {
    return this.callFunction('business-intelligence-dashboard', 'get_financial_performance', { timeRange });
  }

  async getOperationalEfficiency(): Promise<any> {
    return this.callFunction('business-intelligence-dashboard', 'get_operational_efficiency', {});
  }

  async getCustomerAnalytics(segment?: string): Promise<any> {
    return this.callFunction('business-intelligence-dashboard', 'get_customer_analytics', { segment });
  }

  async getMarketAnalysis(): Promise<any> {
    return this.callFunction('business-intelligence-dashboard', 'get_market_analysis', {});
  }

  async getComplianceMetrics(): Promise<any> {
    return this.callFunction('business-intelligence-dashboard', 'get_compliance_metrics', {});
  }

  // User Behavior Analytics
  async trackUserJourney(userId: string): Promise<UserBehaviorData> {
    return this.callFunction('user-behavior-analytics', 'track_user_journey', { userId });
  }

  async analyzeABTest(testId: string): Promise<any> {
    return this.callFunction('user-behavior-analytics', 'analyze_ab_test', { testId });
  }

  async getUserSegmentation(): Promise<any> {
    return this.callFunction('user-behavior-analytics', 'get_user_segmentation', {});
  }

  async getFeatureUsage(feature?: string): Promise<any> {
    return this.callFunction('user-behavior-analytics', 'get_feature_usage', { feature });
  }

  async analyzeEngagement(timeRange: string = '30d'): Promise<any> {
    return this.callFunction('user-behavior-analytics', 'analyze_engagement', { timeRange });
  }

  // Real-time Monitoring
  async trackUserActivity(activityData: any): Promise<void> {
    await this.callFunction('realtime-monitoring-events', 'track_user_activity', { activity: activityData });
  }

  async monitorSystemPerformance(): Promise<RealtimeMetrics> {
    return this.callFunction('realtime-monitoring-events', 'monitor_system_performance', {});
  }

  async monitorSecurityEvents(): Promise<any> {
    return this.callFunction('realtime-monitoring-events', 'monitor_security_events', {});
  }

  async monitorHealthcareSync(): Promise<any> {
    return this.callFunction('realtime-monitoring-events', 'monitor_healthcare_sync', {});
  }

  async trackMedicationAdherence(patientId: string): Promise<any> {
    return this.callFunction('realtime-monitoring-events', 'track_medication_adherence', { patientId });
  }
}

export const analyticsAPI = new AnalyticsAPI();
