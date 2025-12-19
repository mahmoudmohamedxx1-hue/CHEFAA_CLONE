-- Phase 3: Security & Trust Enhancements - Database Schema
-- Created: 2025-11-02
-- Purpose: Enterprise-grade security and compliance framework

-- ============================================
-- SECURITY TABLES
-- ============================================

-- 1. Audit Logs Table
-- Comprehensive logging of all security-relevant events
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL, -- auth, data_access, data_modification, security, compliance
    resource_type VARCHAR(100), -- users, products, orders, prescriptions, etc.
    resource_id VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- login, logout, view, create, update, delete, etc.
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, error, critical
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Security Events Table
-- Track security-specific events and incidents
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- failed_login, suspicious_activity, password_reset, 2fa_enabled, etc.
    risk_level VARCHAR(20) DEFAULT 'low', -- low, medium, high, critical
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Two-Factor Authentication Table
-- Store 2FA secrets and recovery codes
CREATE TABLE IF NOT EXISTS user_2fa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT FALSE,
    secret VARCHAR(255), -- TOTP secret (encrypted)
    recovery_codes TEXT[], -- Backup codes (hashed)
    phone_number VARCHAR(20), -- For SMS 2FA
    phone_verified BOOLEAN DEFAULT FALSE,
    preferred_method VARCHAR(20) DEFAULT 'totp', -- totp, sms, email
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Fraud Detection Scores Table
-- Track fraud risk scores for orders and users
CREATE TABLE IF NOT EXISTS fraud_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    risk_level VARCHAR(20) NOT NULL, -- low, medium, high, critical
    risk_factors JSONB DEFAULT '[]', -- Array of detected risk factors
    rules_triggered VARCHAR(255)[],
    manual_review_required BOOLEAN DEFAULT FALSE,
    manual_review_status VARCHAR(50), -- pending, approved, rejected
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. User Security Profile Table
-- Extended security information for users
CREATE TABLE IF NOT EXISTS user_security_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMPTZ,
    account_locked BOOLEAN DEFAULT FALSE,
    locked_until TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ DEFAULT NOW(),
    suspicious_activity_count INTEGER DEFAULT 0,
    last_ip_address INET,
    known_ip_addresses INET[],
    known_devices JSONB DEFAULT '[]', -- Array of device fingerprints
    security_questions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Compliance Consent Table
-- GDPR/HIPAA consent management
CREATE TABLE IF NOT EXISTS user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL, -- gdpr_data_processing, marketing, cookies, hipaa_authorization, etc.
    consent_version VARCHAR(20) NOT NULL,
    consented BOOLEAN DEFAULT FALSE,
    consent_text TEXT,
    ip_address INET,
    user_agent TEXT,
    consented_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Data Access Requests Table
-- GDPR right to access/erasure
CREATE TABLE IF NOT EXISTS data_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    request_type VARCHAR(50) NOT NULL, -- access, erasure, portability, rectification
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, rejected
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    data_export_url TEXT,
    notes TEXT,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 8. Prescription Verification Logs Table
-- Enhanced prescription validation tracking
CREATE TABLE IF NOT EXISTS prescription_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    verification_method VARCHAR(50), -- manual, ocr, ai_assisted
    verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected, requires_review
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Pharmacist ID
    confidence_score INTEGER, -- For AI/OCR: 0-100
    extracted_data JSONB DEFAULT '{}', -- OCR results
    verification_notes TEXT,
    risk_flags VARCHAR(255)[],
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Medical Certifications Table
-- Store platform certifications and licenses
CREATE TABLE IF NOT EXISTS platform_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certification_type VARCHAR(100) NOT NULL, -- pharmacy_license, fda_registration, iso_27001, gdp, pqs, dea
    certification_number VARCHAR(255) NOT NULL,
    issuing_authority VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- active, expired, suspended, revoked
    verification_url TEXT,
    document_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_risk_level ON security_events(risk_level);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON security_events(resolved);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_scores_user_id ON fraud_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_scores_order_id ON fraud_scores(order_id);
CREATE INDEX IF NOT EXISTS idx_fraud_scores_risk_level ON fraud_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_fraud_scores_manual_review ON fraud_scores(manual_review_required);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type);

CREATE INDEX IF NOT EXISTS idx_prescription_verifications_prescription_id ON prescription_verifications(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_verifications_status ON prescription_verifications(verification_status);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- 1. Log Audit Event Function
CREATE OR REPLACE FUNCTION log_audit_event(
    p_user_id UUID,
    p_event_type VARCHAR,
    p_event_category VARCHAR,
    p_action VARCHAR,
    p_resource_type VARCHAR DEFAULT NULL,
    p_resource_id VARCHAR DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id, event_type, event_category, action,
        resource_type, resource_id, metadata
    ) VALUES (
        p_user_id, p_event_type, p_event_category, p_action,
        p_resource_type, p_resource_id, p_metadata
    )
    RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Calculate Fraud Risk Score Function
CREATE OR REPLACE FUNCTION calculate_fraud_risk(
    p_user_id UUID,
    p_order_total DECIMAL,
    p_order_items INTEGER
)
RETURNS TABLE (
    risk_score INTEGER,
    risk_level VARCHAR,
    risk_factors JSONB
) AS $$
DECLARE
    v_score INTEGER := 0;
    v_factors JSONB := '[]'::JSONB;
    v_user_order_count INTEGER;
    v_user_age_days INTEGER;
    v_recent_orders INTEGER;
BEGIN
    -- Check if user is new (< 7 days)
    SELECT EXTRACT(DAY FROM NOW() - created_at)::INTEGER
    INTO v_user_age_days
    FROM auth.users
    WHERE id = p_user_id;
    
    IF v_user_age_days < 7 THEN
        v_score := v_score + 20;
        v_factors := v_factors || '["New account (< 7 days)"]'::JSONB;
    END IF;
    
    -- Check total order count
    SELECT COUNT(*)
    INTO v_user_order_count
    FROM orders
    WHERE user_id = p_user_id AND status = 'completed';
    
    IF v_user_order_count = 0 THEN
        v_score := v_score + 15;
        v_factors := v_factors || '["First order"]'::JSONB;
    END IF;
    
    -- Check for high order value
    IF p_order_total > 2000 THEN
        v_score := v_score + 25;
        v_factors := v_factors || '["High order value (> 2000 EGP)"]'::JSONB;
    END IF;
    
    -- Check for large quantity
    IF p_order_items > 20 THEN
        v_score := v_score + 15;
        v_factors := v_factors || '["Large quantity (> 20 items)"]'::JSONB;
    END IF;
    
    -- Check for velocity (multiple orders in short time)
    SELECT COUNT(*)
    INTO v_recent_orders
    FROM orders
    WHERE user_id = p_user_id
    AND created_at > NOW() - INTERVAL '1 hour';
    
    IF v_recent_orders > 3 THEN
        v_score := v_score + 30;
        v_factors := v_factors || '["High velocity (> 3 orders in 1 hour)"]'::JSONB;
    END IF;
    
    -- Determine risk level
    RETURN QUERY SELECT
        v_score,
        CASE
            WHEN v_score < 25 THEN 'low'
            WHEN v_score < 50 THEN 'medium'
            WHEN v_score < 75 THEN 'high'
            ELSE 'critical'
        END,
        v_factors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Check Security Event Function
CREATE OR REPLACE FUNCTION record_security_event(
    p_user_id UUID,
    p_event_type VARCHAR,
    p_risk_level VARCHAR,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO security_events (
        user_id, event_type, risk_level, description, metadata
    ) VALUES (
        p_user_id, p_event_type, p_risk_level, p_description, p_metadata
    )
    RETURNING id INTO v_event_id;
    
    -- If critical event, could trigger notifications here
    IF p_risk_level = 'critical' THEN
        -- Log additional audit entry
        PERFORM log_audit_event(
            p_user_id,
            'critical_security_event',
            'security',
            'triggered',
            'security_events',
            v_event_id::VARCHAR,
            p_metadata
        );
    END IF;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get User Security Dashboard Data
CREATE OR REPLACE FUNCTION get_security_dashboard_stats(
    p_time_range VARCHAR DEFAULT '30d'
)
RETURNS TABLE (
    total_security_events BIGINT,
    critical_events BIGINT,
    unresolved_events BIGINT,
    high_risk_fraud_cases BIGINT,
    pending_verifications BIGINT,
    failed_logins_24h BIGINT,
    unique_active_users BIGINT
) AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
BEGIN
    -- Calculate start date based on time range
    v_start_date := CASE p_time_range
        WHEN '24h' THEN NOW() - INTERVAL '24 hours'
        WHEN '7d' THEN NOW() - INTERVAL '7 days'
        WHEN '30d' THEN NOW() - INTERVAL '30 days'
        ELSE NOW() - INTERVAL '30 days'
    END;
    
    RETURN QUERY SELECT
        (SELECT COUNT(*) FROM security_events WHERE created_at >= v_start_date),
        (SELECT COUNT(*) FROM security_events WHERE risk_level = 'critical' AND created_at >= v_start_date),
        (SELECT COUNT(*) FROM security_events WHERE resolved = FALSE),
        (SELECT COUNT(*) FROM fraud_scores WHERE risk_level IN ('high', 'critical') AND created_at >= v_start_date),
        (SELECT COUNT(*) FROM prescription_verifications WHERE verification_status = 'pending'),
        (SELECT COUNT(*) FROM security_events WHERE event_type = 'failed_login' AND created_at >= NOW() - INTERVAL '24 hours'),
        (SELECT COUNT(DISTINCT user_id) FROM user_sessions WHERE created_at >= v_start_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all security tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_certifications ENABLE ROW LEVEL SECURITY;

-- Platform certifications: Public read access
CREATE POLICY "Platform certifications are viewable by everyone" ON platform_certifications
    FOR SELECT USING (status = 'active');

-- User 2FA: Users can only access their own 2FA settings
CREATE POLICY "Users can view their own 2FA settings" ON user_2fa
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings" ON user_2fa
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings" ON user_2fa
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User consents: Users can manage their own consents
CREATE POLICY "Users can view their own consents" ON user_consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents" ON user_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Data access requests: Users can create and view their own requests
CREATE POLICY "Users can view their own data requests" ON data_access_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create data requests" ON data_access_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Security profiles: Users can view their own security profile
CREATE POLICY "Users can view their own security profile" ON user_security_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Audit logs, security events, fraud scores: Admin only (no policies = service role only)
-- These tables are accessed via RPC functions or service role for security

COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system events';
COMMENT ON TABLE security_events IS 'Security-specific events and incidents tracking';
COMMENT ON TABLE user_2fa IS 'Two-factor authentication settings per user';
COMMENT ON TABLE fraud_scores IS 'Fraud risk assessment for orders and users';
COMMENT ON TABLE user_security_profiles IS 'Extended security information for users';
COMMENT ON TABLE user_consents IS 'GDPR/HIPAA consent management';
COMMENT ON TABLE data_access_requests IS 'User data access and erasure requests';
COMMENT ON TABLE prescription_verifications IS 'Enhanced prescription validation logs';
COMMENT ON TABLE platform_certifications IS 'Medical and regulatory certifications';
