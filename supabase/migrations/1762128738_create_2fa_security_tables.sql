-- Migration: create_2fa_security_tables
-- Created at: 1762128738

-- Two-Factor Authentication Tables
CREATE TABLE IF NOT EXISTS public.user_2fa_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  totp_enabled BOOLEAN DEFAULT FALSE,
  totp_secret TEXT,
  sms_enabled BOOLEAN DEFAULT FALSE,
  phone_number TEXT,
  backup_codes TEXT[], -- Array of hashed backup codes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_2fa_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_type TEXT NOT NULL, -- 'totp', 'sms', 'backup_code'
  success BOOLEAN NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate Limiting and Security Tables
CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP address or user_id
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  blocked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blocked_ips (
  ip_address INET PRIMARY KEY,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ,
  permanent BOOLEAN DEFAULT FALSE,
  threat_level TEXT DEFAULT 'medium' -- 'low', 'medium', 'high', 'critical'
);

-- Threat Detection Tables
CREATE TABLE IF NOT EXISTS public.security_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL, -- 'unusual_location', 'rapid_requests', 'failed_auth', 'suspicious_pattern'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_behavior_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL, -- 'login_time', 'device', 'location', 'activity_frequency'
  pattern_data JSONB NOT NULL,
  confidence_score NUMERIC(3,2) DEFAULT 0.5, -- 0.0 to 1.0
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Data Encryption Key Management
CREATE TABLE IF NOT EXISTS public.encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT UNIQUE NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rotated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

-- HIPAA Compliance Tables
CREATE TABLE IF NOT EXISTS public.phi_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  patient_id UUID,
  data_type TEXT NOT NULL, -- 'prescription', 'medical_record', 'insurance', 'payment'
  action TEXT NOT NULL, -- 'view', 'create', 'update', 'delete', 'export'
  purpose TEXT, -- Reason for accessing PHI
  ip_address INET,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_category TEXT UNIQUE NOT NULL,
  retention_days INTEGER NOT NULL,
  auto_delete BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GDPR Compliance Tables
CREATE TABLE IF NOT EXISTS public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL, -- 'marketing', 'analytics', 'third_party', 'data_processing'
  granted BOOLEAN NOT NULL,
  version TEXT NOT NULL,
  ip_address INET,
  granted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.data_subject_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  request_type TEXT NOT NULL, -- 'access', 'rectification', 'erasure', 'portability', 'restriction'
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'rejected'
  request_data JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.data_processing_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  data_categories TEXT[],
  legal_basis TEXT NOT NULL,
  retention_period TEXT,
  recipients TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_2fa_settings_user ON public.user_2fa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_attempts_user ON public.user_2fa_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON public.rate_limit_entries(identifier, endpoint, window_start);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON public.blocked_ips(ip_address, blocked_until);
CREATE INDEX IF NOT EXISTS idx_security_anomalies_user ON public.security_anomalies(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_anomalies_severity ON public.security_anomalies(severity, resolved);
CREATE INDEX IF NOT EXISTS idx_phi_access_user ON public.phi_access_log(user_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_phi_access_patient ON public.phi_access_log(patient_id, accessed_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_records_user ON public.consent_records(user_id, consent_type);
CREATE INDEX IF NOT EXISTS idx_dsar_user ON public.data_subject_requests(user_id, status);

-- Enable RLS on all tables
ALTER TABLE public.user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phi_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_processing_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own 2FA settings"
  ON public.user_2fa_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings"
  ON public.user_2fa_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all security data"
  ON public.user_2fa_settings FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Apply service role policy to all security tables
CREATE POLICY "Service role full access - 2fa_attempts" ON public.user_2fa_attempts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - rate_limit" ON public.rate_limit_entries FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - blocked_ips" ON public.blocked_ips FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - anomalies" ON public.security_anomalies FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - behavior" ON public.user_behavior_patterns FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - encryption" ON public.encryption_keys FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - phi_log" ON public.phi_access_log FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - retention" ON public.data_retention_policies FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - consent" ON public.consent_records FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - dsar" ON public.data_subject_requests FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access - processing" ON public.data_processing_activities FOR ALL TO service_role USING (true);

-- User policies for consent records
CREATE POLICY "Users can view their own consent records"
  ON public.consent_records FOR SELECT
  USING (auth.uid() = user_id);

-- User policies for data subject requests
CREATE POLICY "Users can view their own DSARs"
  ON public.data_subject_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own DSARs"
  ON public.data_subject_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);;