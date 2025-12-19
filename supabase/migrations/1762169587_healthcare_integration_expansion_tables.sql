-- Migration: healthcare_integration_expansion_tables
-- Created at: 1762169587

-- Healthcare Integration Expansion Database Schema

-- 1. EHR Integration Tracking
CREATE TABLE IF NOT EXISTS ehr_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_type VARCHAR(50) NOT NULL, -- 'epic', 'cerner', 'allscripts', 'athenahealth', 'advancedmd', 'eclinicalworks'
  provider_name VARCHAR(255) NOT NULL,
  connection_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'disconnected', 'error'
  fhir_endpoint TEXT,
  patient_id VARCHAR(255),
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_frequency_minutes INTEGER DEFAULT 60,
  data_scope JSONB, -- Array of FHIR resources: ['Patient', 'Observation', 'MedicationRequest', etc.]
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ehr_connections_user ON ehr_connections(user_id);
CREATE INDEX idx_ehr_connections_status ON ehr_connections(connection_status);
CREATE INDEX idx_ehr_connections_provider ON ehr_connections(provider_type);

-- 2. Medical Device Data
CREATE TABLE IF NOT EXISTS medical_device_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type VARCHAR(100) NOT NULL, -- 'cgm', 'blood_pressure', 'pulse_oximeter', 'ecg', 'smart_scale', 'sleep_tracker', 'thermometer'
  device_brand VARCHAR(100),
  device_model VARCHAR(100),
  measurement_type VARCHAR(50) NOT NULL, -- 'glucose', 'bp_systolic', 'bp_diastolic', 'heart_rate', 'spo2', 'weight', 'temperature', 'ecg_reading'
  value NUMERIC NOT NULL,
  unit VARCHAR(20) NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL,
  device_id VARCHAR(255),
  raw_data JSONB,
  flags JSONB, -- Alerts, warnings, anomalies
  sync_status VARCHAR(50) DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_device_data_user ON medical_device_data(user_id);
CREATE INDEX idx_device_data_type ON medical_device_data(device_type);
CREATE INDEX idx_device_data_measurement ON medical_device_data(measurement_type);
CREATE INDEX idx_device_data_measured_at ON medical_device_data(measured_at DESC);

-- 3. Real-time Health Monitoring
CREATE TABLE IF NOT EXISTS real_time_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  monitoring_type VARCHAR(100) NOT NULL, -- 'vital_signs', 'medication_adherence', 'symptom_tracking', 'wellness'
  metric_name VARCHAR(100) NOT NULL,
  current_value NUMERIC,
  baseline_value NUMERIC,
  threshold_min NUMERIC,
  threshold_max NUMERIC,
  alert_level VARCHAR(20), -- 'normal', 'warning', 'critical'
  alert_message TEXT,
  data_source VARCHAR(100), -- Device, EHR, manual entry
  raw_data JSONB,
  recorded_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_monitoring_user ON real_time_monitoring(user_id);
CREATE INDEX idx_monitoring_type ON real_time_monitoring(monitoring_type);
CREATE INDEX idx_monitoring_alert ON real_time_monitoring(alert_level);
CREATE INDEX idx_monitoring_recorded ON real_time_monitoring(recorded_at DESC);

-- 4. Telemedicine Sessions
CREATE TABLE IF NOT EXISTS telemedicine_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id UUID,
  session_type VARCHAR(50) NOT NULL, -- 'video_consultation', 'remote_monitoring', 'e_prescription', 'virtual_care'
  platform VARCHAR(50), -- 'zoom_healthcare', 'microsoft_teams', 'teladoc', 'custom'
  session_status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  meeting_url TEXT,
  meeting_id VARCHAR(255),
  session_notes TEXT,
  prescriptions_issued JSONB,
  diagnostic_data JSONB,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_telemedicine_patient ON telemedicine_sessions(patient_id);
CREATE INDEX idx_telemedicine_status ON telemedicine_sessions(session_status);
CREATE INDEX idx_telemedicine_scheduled ON telemedicine_sessions(scheduled_at);

-- 5. Laboratory Results Integration
CREATE TABLE IF NOT EXISTS laboratory_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lab_provider VARCHAR(100) NOT NULL, -- 'quest_diagnostics', 'labcorp', 'bioreference', 'regional_lab', 'genetic_testing'
  test_category VARCHAR(100), -- 'blood_chemistry', 'hematology', 'genetic', 'pathology', 'microbiology'
  test_name VARCHAR(255) NOT NULL,
  test_code VARCHAR(50), -- LOINC code
  result_value VARCHAR(255),
  result_unit VARCHAR(50),
  reference_range VARCHAR(100),
  abnormal_flag VARCHAR(20), -- 'normal', 'high', 'low', 'critical'
  result_status VARCHAR(50) DEFAULT 'final', -- 'preliminary', 'final', 'corrected', 'cancelled'
  ordered_at TIMESTAMPTZ,
  collected_at TIMESTAMPTZ,
  resulted_at TIMESTAMPTZ NOT NULL,
  ordering_provider VARCHAR(255),
  performing_lab VARCHAR(255),
  result_notes TEXT,
  raw_hl7_message TEXT,
  fhir_observation JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lab_results_user ON laboratory_results(user_id);
CREATE INDEX idx_lab_results_provider ON laboratory_results(lab_provider);
CREATE INDEX idx_lab_results_category ON laboratory_results(test_category);
CREATE INDEX idx_lab_results_resulted ON laboratory_results(resulted_at DESC);
CREATE INDEX idx_lab_results_abnormal ON laboratory_results(abnormal_flag);

-- 6. IoT Device Connectivity
CREATE TABLE IF NOT EXISTS iot_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_category VARCHAR(100) NOT NULL, -- 'medication_dispenser', 'smart_inhaler', 'insulin_pump', 'smart_pill_bottle', 'environmental_monitor'
  device_name VARCHAR(255) NOT NULL,
  device_brand VARCHAR(100),
  device_model VARCHAR(100),
  device_serial VARCHAR(255),
  connection_type VARCHAR(50), -- 'bluetooth', 'wifi', 'cellular', 'zigbee', 'api'
  connection_status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'error', 'maintenance'
  firmware_version VARCHAR(50),
  battery_level INTEGER,
  last_data_sync TIMESTAMPTZ,
  sync_frequency_minutes INTEGER DEFAULT 15,
  device_settings JSONB,
  alert_config JSONB,
  medication_schedule JSONB, -- For medication-related devices
  adherence_data JSONB,
  environmental_data JSONB, -- For environmental monitors
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_iot_devices_user ON iot_devices(user_id);
CREATE INDEX idx_iot_devices_category ON iot_devices(device_category);
CREATE INDEX idx_iot_devices_status ON iot_devices(connection_status);

-- 7. Integration Health Monitoring
CREATE TABLE IF NOT EXISTS integration_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_type VARCHAR(100) NOT NULL, -- 'ehr', 'medical_device', 'lab', 'telemedicine', 'iot'
  integration_name VARCHAR(255) NOT NULL,
  health_status VARCHAR(50) DEFAULT 'healthy', -- 'healthy', 'degraded', 'down', 'maintenance'
  uptime_percentage NUMERIC(5,2),
  last_successful_sync TIMESTAMPTZ,
  last_failed_sync TIMESTAMPTZ,
  sync_success_count INTEGER DEFAULT 0,
  sync_failure_count INTEGER DEFAULT 0,
  average_response_time_ms INTEGER,
  error_rate_percentage NUMERIC(5,2),
  last_error_message TEXT,
  alert_subscribers JSONB, -- User IDs to notify on issues
  metadata JSONB,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_integration_health_type ON integration_health(integration_type);
CREATE INDEX idx_integration_health_status ON integration_health(health_status);
CREATE INDEX idx_integration_health_checked ON integration_health(checked_at DESC);

-- 8. Data Synchronization Log
CREATE TABLE IF NOT EXISTS data_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type VARCHAR(100) NOT NULL, -- 'ehr_to_platform', 'device_to_platform', 'platform_to_ehr', 'bidirectional'
  source_system VARCHAR(100) NOT NULL,
  target_system VARCHAR(100) NOT NULL,
  data_type VARCHAR(100), -- 'patient_data', 'observations', 'medications', 'lab_results', 'device_readings'
  sync_status VARCHAR(50) NOT NULL, -- 'initiated', 'in_progress', 'completed', 'failed', 'partial'
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  sync_duration_ms INTEGER,
  error_details JSONB,
  conflict_resolution JSONB,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sync_log_user ON data_sync_log(user_id);
CREATE INDEX idx_sync_log_type ON data_sync_log(sync_type);
CREATE INDEX idx_sync_log_status ON data_sync_log(sync_status);
CREATE INDEX idx_sync_log_started ON data_sync_log(started_at DESC);

-- Enable Row Level Security
ALTER TABLE ehr_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_device_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemedicine_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratory_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Users can only access their own data)
CREATE POLICY "Users can view own EHR connections" ON ehr_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own EHR connections" ON ehr_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own EHR connections" ON ehr_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own EHR connections" ON ehr_connections FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own device data" ON medical_device_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own device data" ON medical_device_data FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own monitoring data" ON real_time_monitoring FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own monitoring data" ON real_time_monitoring FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own telemedicine sessions" ON telemedicine_sessions FOR SELECT USING (auth.uid() = patient_id);
CREATE POLICY "Users can insert own telemedicine sessions" ON telemedicine_sessions FOR INSERT WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "Users can update own telemedicine sessions" ON telemedicine_sessions FOR UPDATE USING (auth.uid() = patient_id);

CREATE POLICY "Users can view own lab results" ON laboratory_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lab results" ON laboratory_results FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own IoT devices" ON iot_devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own IoT devices" ON iot_devices FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own IoT devices" ON iot_devices FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own IoT devices" ON iot_devices FOR DELETE USING (auth.uid() = user_id);

-- Integration health is viewable by all authenticated users
CREATE POLICY "Authenticated users can view integration health" ON integration_health FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own sync logs" ON data_sync_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sync logs" ON data_sync_log FOR INSERT WITH CHECK (auth.uid() = user_id);;