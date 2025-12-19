-- Migration: jwt_security_enhancements
-- Created at: 1762125977

-- JWT Authentication Enhancements Migration
-- Created: 2025-11-03
-- Purpose: Add comprehensive JWT security features including token blacklist, session tracking, and audit logging

-- ==============================================
-- 1. Token Blacklist Table
-- ==============================================
-- Stores invalidated JWT tokens to prevent reuse after logout
CREATE TABLE IF NOT EXISTS token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token_id ON token_blacklist(token_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id ON token_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON token_blacklist(expires_at);

-- Cleanup trigger to remove expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM token_blacklist 
  WHERE expires_at < NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_expired_tokens
  AFTER INSERT ON token_blacklist
  EXECUTE FUNCTION cleanup_expired_tokens();

-- ==============================================
-- 2. User Sessions Table
-- ==============================================
-- Track active user sessions with device information
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  logout_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for session management
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_fingerprint ON user_sessions(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity);

-- Auto-update last_activity trigger
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_activity
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_activity();

-- ==============================================
-- 3. Security Events Table
-- ==============================================
-- Track security-related events (already exists, adding if not exists)
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

-- Indexes for security monitoring
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);

-- ==============================================
-- 4. Comprehensive Audit Logs Table (Enhanced)
-- ==============================================
-- Comprehensive audit trail for all system actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  city TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);

-- ==============================================
-- 5. Row Level Security (RLS) Policies
-- ==============================================

-- Token Blacklist RLS
ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blacklisted tokens"
  ON token_blacklist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all blacklisted tokens"
  ON token_blacklist FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- User Sessions RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON user_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON user_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON user_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sessions"
  ON user_sessions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Security Events RLS
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security events"
  ON security_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security events"
  ON security_events FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Service role can manage all security events"
  ON security_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Audit Logs RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Service role can manage all audit logs"
  ON audit_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ==============================================
-- 6. Helper Functions
-- ==============================================

-- Function to blacklist a token
CREATE OR REPLACE FUNCTION blacklist_token(
  p_token TEXT,
  p_user_id UUID,
  p_expires_at TIMESTAMP WITH TIME ZONE,
  p_reason TEXT DEFAULT 'user_logout'
)
RETURNS UUID AS $$
DECLARE
  v_token_id TEXT;
  v_blacklist_id UUID;
BEGIN
  -- Extract token ID from JWT
  v_token_id := substring(p_token from 1 for 50);
  
  -- Insert into blacklist
  INSERT INTO token_blacklist (token_id, token, user_id, expires_at, reason)
  VALUES (v_token_id, p_token, p_user_id, p_expires_at, p_reason)
  RETURNING id INTO v_blacklist_id;
  
  RETURN v_blacklist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if token is blacklisted
CREATE OR REPLACE FUNCTION is_token_blacklisted(p_token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_token_id TEXT;
  v_exists BOOLEAN;
BEGIN
  v_token_id := substring(p_token from 1 for 50);
  
  SELECT EXISTS(
    SELECT 1 FROM token_blacklist 
    WHERE token_id = v_token_id 
    AND expires_at > NOW()
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_resource TEXT,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_success BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, resource, details, success)
  VALUES (p_user_id, p_action, p_resource, p_details, p_success)
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active sessions for a user
CREATE OR REPLACE FUNCTION get_active_sessions(p_user_id UUID)
RETURNS TABLE (
  session_id UUID,
  device_fingerprint TEXT,
  user_agent TEXT,
  ip_address TEXT,
  last_activity TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    device_fingerprint,
    user_agent,
    ip_address,
    last_activity,
    created_at
  FROM user_sessions
  WHERE user_id = p_user_id
  AND is_active = TRUE
  AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY last_activity DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to terminate session
CREATE OR REPLACE FUNCTION terminate_session(p_session_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = FALSE, logout_at = NOW()
  WHERE id = p_session_id AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to terminate all user sessions
CREATE OR REPLACE FUNCTION terminate_all_sessions(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE user_sessions
  SET is_active = FALSE, logout_at = NOW()
  WHERE user_id = p_user_id AND is_active = TRUE;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 7. Security Monitoring Views
-- ==============================================

-- View for recent security events
CREATE OR REPLACE VIEW recent_security_events AS
SELECT 
  se.id,
  se.user_id,
  u.email AS user_email,
  se.event_type,
  se.severity,
  se.description,
  se.ip_address,
  se.created_at,
  se.resolved
FROM security_events se
LEFT JOIN auth.users u ON se.user_id = u.id
WHERE se.created_at > NOW() - INTERVAL '7 days'
ORDER BY se.created_at DESC;

-- View for active sessions summary
CREATE OR REPLACE VIEW active_sessions_summary AS
SELECT 
  us.user_id,
  u.email AS user_email,
  COUNT(*) AS active_session_count,
  MAX(us.last_activity) AS latest_activity,
  MIN(us.created_at) AS oldest_session
FROM user_sessions us
LEFT JOIN auth.users u ON us.user_id = u.id
WHERE us.is_active = TRUE
AND (us.expires_at IS NULL OR us.expires_at > NOW())
GROUP BY us.user_id, u.email;

-- ==============================================
-- 8. Cleanup Jobs (Scheduled via cron)
-- ==============================================

-- Function to cleanup old audit logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup inactive sessions (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM user_sessions
  WHERE is_active = FALSE
  AND logout_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON recent_security_events TO authenticated;
GRANT SELECT ON active_sessions_summary TO authenticated;

-- ==============================================
-- Migration Complete
-- ==============================================

COMMENT ON TABLE token_blacklist IS 'Stores invalidated JWT tokens to prevent reuse';
COMMENT ON TABLE user_sessions IS 'Tracks active user sessions with device information';
COMMENT ON TABLE security_events IS 'Comprehensive security event logging';
COMMENT ON TABLE audit_logs IS 'Detailed audit trail for all system actions';;