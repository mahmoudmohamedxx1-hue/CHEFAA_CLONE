-- Migration: enhanced_analytics_monitoring_schema
-- Created at: 1762171507

-- Enhanced Analytics & Monitoring Schema

-- 1. Platform Usage Analytics
CREATE TABLE IF NOT EXISTS platform_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  page_url TEXT,
  referrer TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  country TEXT,
  city TEXT,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_usage_user ON platform_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_usage_event_type ON platform_usage_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_platform_usage_created_at ON platform_usage_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_usage_session ON platform_usage_analytics(session_id);

-- 2. Healthcare Outcomes Tracking
CREATE TABLE IF NOT EXISTS healthcare_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  outcome_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  unit TEXT,
  baseline_value NUMERIC,
  improvement_percentage NUMERIC,
  status TEXT DEFAULT 'active',
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_healthcare_outcomes_user ON healthcare_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_outcomes_type ON healthcare_outcomes(outcome_type);
CREATE INDEX IF NOT EXISTS idx_healthcare_outcomes_recorded_at ON healthcare_outcomes(recorded_at DESC);

-- 3. Business Metrics
CREATE TABLE IF NOT EXISTS business_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_category TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  unit TEXT,
  target_value NUMERIC,
  comparison_period TEXT,
  growth_rate NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_metrics_category ON business_metrics(metric_category);
CREATE INDEX IF NOT EXISTS idx_business_metrics_recorded_at ON business_metrics(recorded_at DESC);

-- 4. Predictive Analytics Results
CREATE TABLE IF NOT EXISTS predictive_analytics_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_type TEXT NOT NULL,
  model_name TEXT NOT NULL,
  input_data JSONB NOT NULL,
  prediction_result JSONB NOT NULL,
  confidence_score NUMERIC,
  actual_outcome JSONB,
  accuracy_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictive_analytics_type ON predictive_analytics_results(prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictive_analytics_created_at ON predictive_analytics_results(created_at DESC);

-- 5. User Behavior Tracking
CREATE TABLE IF NOT EXISTS user_behavior_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  behavior_type TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  interaction_count INTEGER DEFAULT 1,
  time_spent_seconds INTEGER,
  conversion_achieved BOOLEAN DEFAULT FALSE,
  funnel_stage TEXT,
  ab_test_variant TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_behavior_user ON user_behavior_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_behavior_type ON user_behavior_tracking(behavior_type);
CREATE INDEX IF NOT EXISTS idx_user_behavior_feature ON user_behavior_tracking(feature_name);
CREATE INDEX IF NOT EXISTS idx_user_behavior_created_at ON user_behavior_tracking(created_at DESC);

-- 6. Real-time Monitoring Events
CREATE TABLE IF NOT EXISTS real_time_monitoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_category TEXT NOT NULL,
  event_name TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT,
  affected_component TEXT,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  alert_triggered BOOLEAN DEFAULT FALSE,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_category ON real_time_monitoring_events(event_category);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_severity ON real_time_monitoring_events(severity);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_resolved ON real_time_monitoring_events(resolved);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_created_at ON real_time_monitoring_events(created_at DESC);

-- 7. Report Generation History
CREATE TABLE IF NOT EXISTS report_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  report_name TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  file_url TEXT,
  file_format TEXT,
  generation_time_seconds INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_report_history_user ON report_generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_report_history_type ON report_generation_history(report_type);
CREATE INDEX IF NOT EXISTS idx_report_history_status ON report_generation_history(status);
CREATE INDEX IF NOT EXISTS idx_report_history_created_at ON report_generation_history(created_at DESC);

-- 8. Dashboard Configuration
CREATE TABLE IF NOT EXISTS dashboard_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dashboard_name TEXT NOT NULL,
  layout_config JSONB NOT NULL,
  widgets JSONB NOT NULL,
  refresh_interval INTEGER DEFAULT 30,
  is_default BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dashboard_config_user ON dashboard_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_config_default ON dashboard_configurations(is_default);

-- Enable Row Level Security
ALTER TABLE platform_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_analytics_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavior_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_monitoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own usage analytics" ON platform_usage_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own usage analytics" ON platform_usage_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own healthcare outcomes" ON healthcare_outcomes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own healthcare outcomes" ON healthcare_outcomes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view business metrics" ON business_metrics FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view predictive analytics" ON predictive_analytics_results FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own behavior tracking" ON user_behavior_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own behavior tracking" ON user_behavior_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view monitoring events" ON real_time_monitoring_events FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own report history" ON report_generation_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reports" ON report_generation_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own dashboards" ON dashboard_configurations FOR ALL USING (auth.uid() = user_id);
;