-- Migration: create_healthcare_integrations_schema
-- Created at: 1762137977

-- Healthcare Integration Management Tables

-- Integration Services Registry
CREATE TABLE IF NOT EXISTS integration_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type VARCHAR(50) NOT NULL, -- 'ehr', 'pharmacy', 'insurance', 'health_device', 'telemedicine', 'laboratory'
    service_name VARCHAR(255) NOT NULL,
    provider_name VARCHAR(255) NOT NULL,
    api_endpoint TEXT,
    api_version VARCHAR(50),
    status VARCHAR(50) DEFAULT 'inactive', -- 'active', 'inactive', 'maintenance', 'error'
    capabilities JSONB, -- Service-specific capabilities
    configuration JSONB, -- Service configuration
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    UNIQUE(service_type, provider_name)
);

-- User Integration Consents and Connections
CREATE TABLE IF NOT EXISTS user_integration_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES integration_services(id) ON DELETE CASCADE,
    connection_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'active', 'revoked', 'expired', 'error'
    consent_given BOOLEAN DEFAULT false,
    consent_timestamp TIMESTAMPTZ,
    oauth_tokens JSONB, -- Encrypted OAuth tokens
    external_user_id VARCHAR(255), -- User ID in external system
    last_sync_at TIMESTAMPTZ,
    sync_frequency VARCHAR(50) DEFAULT 'hourly', -- 'realtime', 'hourly', 'daily', 'manual'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, service_id)
);

-- FHIR Resources (HL7 FHIR R4)
CREATE TABLE IF NOT EXISTS fhir_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL, -- 'Patient', 'Medication', 'Observation', 'Condition', etc.
    resource_id VARCHAR(255) NOT NULL, -- FHIR resource ID
    source_system VARCHAR(255), -- Source EHR system
    fhir_version VARCHAR(20) DEFAULT 'R4',
    resource_data JSONB NOT NULL, -- Complete FHIR resource in JSON
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, resource_type, resource_id, source_system)
);

-- Pharmacy Network Integration
CREATE TABLE IF NOT EXISTS pharmacy_network_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pharmacy_id VARCHAR(255) NOT NULL,
    pharmacy_name VARCHAR(255),
    pharmacy_chain VARCHAR(255), -- 'CVS', 'Walgreens', etc.
    prescription_id VARCHAR(255),
    prescription_status VARCHAR(100), -- 'pending', 'in_progress', 'ready', 'picked_up', 'cancelled'
    medication_name VARCHAR(255),
    refills_remaining INTEGER,
    next_refill_date DATE,
    inventory_status VARCHAR(50), -- 'in_stock', 'low_stock', 'out_of_stock'
    location JSONB, -- Pharmacy location data
    sync_data JSONB, -- Additional sync data from pharmacy API
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insurance Verification Data
CREATE TABLE IF NOT EXISTS insurance_verification_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insurance_provider VARCHAR(255),
    policy_number VARCHAR(255),
    group_number VARCHAR(255),
    verification_status VARCHAR(50), -- 'verified', 'pending', 'failed', 'expired'
    eligibility_status VARCHAR(50), -- 'active', 'inactive', 'terminated'
    coverage_effective_date DATE,
    coverage_termination_date DATE,
    copay_amount DECIMAL(10,2),
    deductible_amount DECIMAL(10,2),
    deductible_remaining DECIMAL(10,2),
    formulary_tier VARCHAR(50), -- 'tier1', 'tier2', 'tier3', 'tier4'
    prior_auth_required BOOLEAN DEFAULT false,
    verification_response JSONB, -- Full API response
    last_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Device Data (Apple Health, Google Fit, etc.)
CREATE TABLE IF NOT EXISTS health_device_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_type VARCHAR(100), -- 'apple_health', 'google_fit', 'cgm', 'bp_monitor', 'wearable'
    device_id VARCHAR(255),
    data_type VARCHAR(100), -- 'heart_rate', 'blood_pressure', 'glucose', 'steps', 'sleep', etc.
    measurement_value JSONB, -- Flexible measurement data
    measurement_unit VARCHAR(50),
    recorded_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    source_app VARCHAR(255),
    metadata JSONB, -- Additional device metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_health_device_user_type ON health_device_data(user_id, data_type, recorded_at DESC);

-- Telemedicine Appointments
CREATE TABLE IF NOT EXISTS telemedicine_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id VARCHAR(255),
    provider_name VARCHAR(255),
    appointment_type VARCHAR(100), -- 'video', 'phone', 'chat'
    appointment_status VARCHAR(50), -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    meeting_link TEXT,
    meeting_id VARCHAR(255),
    platform VARCHAR(100), -- 'zoom', 'teams', 'custom'
    chief_complaint TEXT,
    prescription_issued BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Laboratory Results Integration
CREATE TABLE IF NOT EXISTS laboratory_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lab_provider VARCHAR(255), -- 'Quest', 'LabCorp', etc.
    order_id VARCHAR(255),
    test_code VARCHAR(100), -- LOINC code
    test_name VARCHAR(255),
    test_category VARCHAR(100), -- 'Chemistry', 'Hematology', 'Microbiology', etc.
    result_value VARCHAR(255),
    result_unit VARCHAR(50),
    reference_range VARCHAR(100),
    abnormal_flag VARCHAR(50), -- 'normal', 'high', 'low', 'critical_high', 'critical_low'
    result_status VARCHAR(50), -- 'final', 'preliminary', 'corrected', 'cancelled'
    collected_at TIMESTAMPTZ,
    resulted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    ordering_provider VARCHAR(255),
    result_data JSONB, -- Complete HL7 result data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lab_results_user_test ON laboratory_results(user_id, test_code, resulted_at DESC);

-- Integration Audit Log
CREATE TABLE IF NOT EXISTS integration_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    service_id UUID REFERENCES integration_services(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL, -- 'connection_created', 'data_synced', 'api_call', 'error', etc.
    action_details JSONB,
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(50), -- 'success', 'failure', 'partial'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_action ON integration_audit_log(user_id, action_type, created_at DESC);

-- Integration API Keys (encrypted)
CREATE TABLE IF NOT EXISTS integration_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES integration_services(id) ON DELETE CASCADE,
    key_name VARCHAR(255) NOT NULL,
    encrypted_key_value TEXT NOT NULL, -- Encrypted API key
    key_type VARCHAR(50), -- 'api_key', 'client_id', 'client_secret', etc.
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_id, key_name)
);

-- Enable Row Level Security
ALTER TABLE integration_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_network_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_verification_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_device_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemedicine_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE laboratory_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for integration_services (public read for available services)
CREATE POLICY "Public read integration services" ON integration_services
    FOR SELECT USING (true);

CREATE POLICY "Admin manage integration services" ON integration_services
    FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%@admin.%'));

-- RLS Policies for user_integration_connections (users can only see their own)
CREATE POLICY "Users manage own integration connections" ON user_integration_connections
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for FHIR resources
CREATE POLICY "Users access own FHIR resources" ON fhir_resources
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for pharmacy network data
CREATE POLICY "Users access own pharmacy data" ON pharmacy_network_data
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for insurance verification data
CREATE POLICY "Users access own insurance data" ON insurance_verification_data
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for health device data
CREATE POLICY "Users access own health device data" ON health_device_data
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for telemedicine appointments
CREATE POLICY "Users access own telemedicine appointments" ON telemedicine_appointments
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for laboratory results
CREATE POLICY "Users access own laboratory results" ON laboratory_results
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for integration audit log
CREATE POLICY "Users access own audit log" ON integration_audit_log
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for integration API keys (admin only)
CREATE POLICY "Admin manage API keys" ON integration_api_keys
    FOR ALL USING (auth.uid() IN (SELECT id FROM auth.users WHERE email LIKE '%@admin.%'));

COMMENT ON TABLE integration_services IS 'Registry of all available healthcare integration services';
COMMENT ON TABLE user_integration_connections IS 'User consent and connection status for each integration';
COMMENT ON TABLE fhir_resources IS 'HL7 FHIR R4 resources from EHR systems';
COMMENT ON TABLE pharmacy_network_data IS 'Data synced from pharmacy network APIs';
COMMENT ON TABLE insurance_verification_data IS 'Real-time insurance eligibility and coverage data';
COMMENT ON TABLE health_device_data IS 'Data from Apple Health, Google Fit, and medical devices';
COMMENT ON TABLE telemedicine_appointments IS 'Virtual appointment scheduling and management';
COMMENT ON TABLE laboratory_results IS 'HL7 laboratory results from Quest, LabCorp, etc.';
COMMENT ON TABLE integration_audit_log IS 'Audit trail for all integration activities';
COMMENT ON TABLE integration_api_keys IS 'Encrypted API keys for external service authentication';;