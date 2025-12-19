-- Migration: advanced_security_tables
-- Created at: 1762166076

-- Advanced Security and Compliance Tables

-- Comprehensive audit log table
CREATE TABLE IF NOT EXISTS comprehensive_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  action TEXT NOT NULL,
  outcome TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Encryption audit log
CREATE TABLE IF NOT EXISTS encryption_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('encrypt', 'decrypt', 'tokenize', 'detokenize')),
  field_name TEXT,
  key_id TEXT,
  classification TEXT,
  data_type TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token vault for data tokenization
CREATE TABLE IF NOT EXISTS token_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  encrypted_value TEXT NOT NULL,
  data_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Key rotation log
CREATE TABLE IF NOT EXISTS key_rotation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_key_id TEXT,
  new_key_id TEXT NOT NULL,
  rotation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT CHECK (status IN ('completed', 'in-progress', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security configuration table
CREATE TABLE IF NOT EXISTS security_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  last_modified TIMESTAMPTZ DEFAULT NOW(),
  modified_by UUID REFERENCES auth.users(id)
);

-- Compliance audit table
CREATE TABLE IF NOT EXISTS compliance_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework TEXT NOT NULL,
  audit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  findings JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  auditor_id UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('passed', 'failed', 'needs-improvement')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_log_user_timestamp ON comprehensive_audit_log(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON comprehensive_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON comprehensive_audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_encryption_log_user ON encryption_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_token_vault_token ON token_vault(token);
CREATE INDEX IF NOT EXISTS idx_token_vault_user ON token_vault(user_id);

-- Enable Row Level Security
ALTER TABLE comprehensive_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE encryption_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE key_rotation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comprehensive_audit_log
CREATE POLICY "Users can view their own audit logs"
  ON comprehensive_audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs"
  ON comprehensive_audit_log FOR INSERT
  WITH CHECK (true);

-- RLS Policies for encryption_audit_log
CREATE POLICY "Users can view their own encryption logs"
  ON encryption_audit_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert encryption logs"
  ON encryption_audit_log FOR INSERT
  WITH CHECK (true);

-- RLS Policies for token_vault
CREATE POLICY "Users can view their own tokens"
  ON token_vault FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
  ON token_vault FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for key_rotation_log
CREATE POLICY "Users can view their own rotation logs"
  ON key_rotation_log FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policies for security_configuration
CREATE POLICY "Authenticated users can view security config"
  ON security_configuration FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for compliance_audit
CREATE POLICY "Authenticated users can view compliance audits"
  ON compliance_audit FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Insert default security configuration
INSERT INTO security_configuration (config_key, config_value, description) VALUES
  ('csp_policy', '{"enabled": true, "policy": "default-src ''self''; script-src ''self'' ''unsafe-inline''; style-src ''self'' ''unsafe-inline'';"}', 'Content Security Policy configuration'),
  ('encryption_settings', '{"algorithm": "AES-256-GCM", "key_rotation_days": 90, "enabled": true}', 'Encryption configuration'),
  ('audit_retention', '{"days": 2555, "archive_enabled": true}', 'Audit log retention policy (7 years for HIPAA compliance)')
ON CONFLICT (config_key) DO NOTHING;
;