-- Migration: seed_analytics_sample_data
-- Created at: 1762132465

-- Insert sample system performance metrics
INSERT INTO system_performance_metrics (metric_type, metric_name, value, unit, metadata)
VALUES
  ('response_time', 'api_response', 125, 'ms', '{"endpoint": "/api/products"}'),
  ('response_time', 'api_response', 89, 'ms', '{"endpoint": "/api/products"}'),
  ('response_time', 'api_response', 156, 'ms', '{"endpoint": "/api/orders"}'),
  ('response_time', 'api_response', 234, 'ms', '{"endpoint": "/api/auth"}'),
  ('memory', 'heap_usage', 450, 'MB', '{"server": "main"}'),
  ('cpu', 'usage_percent', 35, '%', '{"server": "main"}');

-- Insert sample user behavior analytics
INSERT INTO user_behavior_analytics (session_id, event_type, page_url, element_id, metadata)
VALUES
  ('session-001', 'page_view', '/', NULL, '{}'),
  ('session-001', 'click', '/', 'search-button', '{"query": "aspirin"}'),
  ('session-001', 'page_view', '/search', NULL, '{"query": "aspirin"}'),
  ('session-002', 'page_view', '/', NULL, '{}'),
  ('session-002', 'page_view', '/category/medications', NULL, '{}'),
  ('session-003', 'click', '/product/panadol', 'add-to-cart', '{"product": "panadol"}'),
  ('session-003', 'page_view', '/cart', NULL, '{}');

-- Insert sample security events
INSERT INTO security_events_analytics (event_type, severity, ip_address, description, metadata)
VALUES
  ('failed_login', 'warning', '192.168.1.100', 'Failed login attempt', '{"username": "test@example.com", "attempts": 3}'),
  ('suspicious_activity', 'high', '10.0.0.50', 'Multiple rapid requests', '{"requests_per_second": 100}'),
  ('password_reset', 'info', '172.16.0.10', 'Password reset requested', '{"user_id": "123"}');

-- Insert sample system health logs
INSERT INTO system_health_logs (component, status, health_score, response_time_ms, error_count, warning_count, uptime_percentage, metadata)
VALUES
  ('database', 'healthy', 98, 45, 0, 1, 99.95, '{"version": "15.0", "connections": 25}'),
  ('api', 'healthy', 100, 120, 0, 0, 99.99, '{"version": "2.0", "requests_per_minute": 150}'),
  ('edge_functions', 'healthy', 95, 89, 2, 3, 99.8, '{"deployed": 8, "active": 8}'),
  ('storage', 'healthy', 99, 78, 0, 0, 100.0, '{"usage_gb": 45, "capacity_gb": 200}');

-- Insert sample medication adherence data (only if user exists)
-- This is conditional based on having actual user IDs
DO $$
DECLARE
  sample_user_id UUID;
BEGIN
  -- Try to get a user ID, if any exist
  SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
  
  IF sample_user_id IS NOT NULL THEN
    INSERT INTO medication_adherence_data (user_id, medication_id, medication_name, prescribed_dosage, scheduled_time, taken_time, adherence_status, reminder_sent, reminder_effectiveness)
    VALUES
      (sample_user_id, 'med-001', 'Aspirin 100mg', '1 tablet', '09:00:00', now() - interval '1 hour', 'taken', true, 85),
      (sample_user_id, 'med-002', 'Vitamin D', '1 capsule', '20:00:00', NULL, 'missed', true, 60),
      (sample_user_id, 'med-003', 'Blood Pressure Medication', '1 tablet', '08:00:00', now() - interval '2 hours', 'taken', true, 95);
  END IF;
END $$;

-- Insert sample clinical trial metrics
INSERT INTO clinical_trial_metrics (trial_id, trial_name, phase, enrolled_patients, completed_patients, dropout_rate, success_rate, protocol_adherence_rate, adverse_events_count, primary_outcome_met, regulatory_status, start_date, end_date)
VALUES
  ('trial-001', 'Diabetes Medication Trial Phase III', 'Phase III', 500, 425, 15.0, 78.5, 92.3, 12, true, 'FDA_Approved', '2023-01-15', '2024-12-20'),
  ('trial-002', 'Cardiovascular Drug Study', 'Phase II', 200, 180, 10.0, 85.0, 95.0, 5, true, 'In_Review', '2023-06-01', '2025-05-30'),
  ('trial-003', 'Cancer Treatment Protocol', 'Phase II', 150, 120, 20.0, 68.0, 88.0, 18, false, 'Active', '2024-01-10', NULL);
;