-- Migration: phase2_blockchain_innovations
-- Created at: 1762098072

-- Phase 2: Blockchain & Supply Chain Innovations
-- Migration: Drug Provenance, Smart Contracts, IoT Adherence Monitoring

-- ============================================================================
-- 1. DRUG PROVENANCE & ANTI-COUNTERFEITING SYSTEM
-- ============================================================================

-- Drug batch provenance tracking
CREATE TABLE drug_provenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  batch_number VARCHAR(100) UNIQUE NOT NULL,
  blockchain_hash VARCHAR(256) NOT NULL,
  manufacturing_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  manufacturer_id VARCHAR(100) NOT NULL,
  manufacturer_name VARCHAR(255) NOT NULL,
  manufacturing_location VARCHAR(255),
  qr_code_data TEXT NOT NULL,
  verification_status VARCHAR(50) DEFAULT 'verified',
  total_units INTEGER NOT NULL,
  units_distributed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supply chain event tracking
CREATE TABLE supply_chain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES drug_provenance(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_timestamp TIMESTAMPTZ DEFAULT NOW(),
  location_name VARCHAR(255),
  location_coordinates JSONB,
  handler_name VARCHAR(255),
  handler_id VARCHAR(100),
  units_transferred INTEGER,
  temperature_log JSONB,
  blockchain_hash VARCHAR(256),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User verification history
CREATE TABLE verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES drug_provenance(id) ON DELETE SET NULL,
  verification_method VARCHAR(50),
  verification_result VARCHAR(50),
  scan_location JSONB,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for provenance queries
CREATE INDEX idx_drug_provenance_product ON drug_provenance(product_id);
CREATE INDEX idx_drug_provenance_batch ON drug_provenance(batch_number);
CREATE INDEX idx_drug_provenance_hash ON drug_provenance(blockchain_hash);
CREATE INDEX idx_supply_chain_batch ON supply_chain_events(batch_id);
CREATE INDEX idx_supply_chain_timestamp ON supply_chain_events(event_timestamp DESC);
CREATE INDEX idx_verification_history_user ON verification_history(user_id);
CREATE INDEX idx_verification_history_batch ON verification_history(batch_id);

-- ============================================================================
-- 2. SMART CONTRACT PRESCRIPTION FULFILLMENT
-- ============================================================================

-- Smart contract state management
CREATE TABLE smart_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type VARCHAR(50) NOT NULL,
  contract_hash VARCHAR(256) NOT NULL,
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  state VARCHAR(50) DEFAULT 'pending',
  auto_refill_enabled BOOLEAN DEFAULT false,
  refill_schedule JSONB,
  insurance_verified BOOLEAN DEFAULT false,
  insurance_details JSONB,
  execution_log JSONB[],
  error_log JSONB[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Prescription lifecycle automation tracking
CREATE TABLE prescription_lifecycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES smart_contracts(id) ON DELETE CASCADE,
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  lifecycle_stage VARCHAR(50) NOT NULL,
  stage_status VARCHAR(50) DEFAULT 'in_progress',
  automation_enabled BOOLEAN DEFAULT true,
  stage_started_at TIMESTAMPTZ DEFAULT NOW(),
  stage_completed_at TIMESTAMPTZ,
  processing_time_seconds INTEGER,
  automation_actions JSONB,
  human_intervention_required BOOLEAN DEFAULT false,
  intervention_reason TEXT,
  notes TEXT
);

-- Automated refill schedule
CREATE TABLE automated_refills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES smart_contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  refill_frequency VARCHAR(50),
  next_refill_date DATE NOT NULL,
  refills_remaining INTEGER,
  auto_process BOOLEAN DEFAULT true,
  last_refill_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for smart contracts
CREATE INDEX idx_smart_contracts_prescription ON smart_contracts(prescription_id);
CREATE INDEX idx_smart_contracts_user ON smart_contracts(user_id);
CREATE INDEX idx_smart_contracts_state ON smart_contracts(state);
CREATE INDEX idx_prescription_lifecycle_contract ON prescription_lifecycle(contract_id);
CREATE INDEX idx_prescription_lifecycle_stage ON prescription_lifecycle(lifecycle_stage, stage_status);
CREATE INDEX idx_automated_refills_user ON automated_refills(user_id);
CREATE INDEX idx_automated_refills_next_date ON automated_refills(next_refill_date);

-- ============================================================================
-- 3. IOT-ENABLED INTELLIGENT ADHERENCE PROGRAMS
-- ============================================================================

-- IoT device registration and management
CREATE TABLE iot_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type VARCHAR(50) NOT NULL,
  device_id VARCHAR(100) UNIQUE NOT NULL,
  device_name VARCHAR(255),
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  firmware_version VARCHAR(50),
  connection_status VARCHAR(50) DEFAULT 'offline',
  last_connection TIMESTAMPTZ,
  battery_level INTEGER,
  configuration JSONB,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time adherence data tracking
CREATE TABLE adherence_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES iot_devices(id) ON DELETE CASCADE,
  medication_name VARCHAR(255),
  scheduled_time TIMESTAMPTZ NOT NULL,
  actual_time TIMESTAMPTZ,
  adherence_status VARCHAR(50) NOT NULL,
  dose_amount VARCHAR(100),
  device_reading JSONB,
  location JSONB,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-driven personalized interventions
CREATE TABLE interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  intervention_type VARCHAR(50) NOT NULL,
  trigger_event VARCHAR(100),
  intervention_method VARCHAR(50),
  message_content TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  ai_confidence_score DECIMAL(3,2),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  user_response VARCHAR(50),
  effectiveness_score DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adherence analytics summary
CREATE TABLE adherence_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_scheduled_doses INTEGER NOT NULL,
  doses_taken INTEGER NOT NULL,
  doses_missed INTEGER NOT NULL,
  adherence_rate DECIMAL(5,2),
  improvement_vs_previous DECIMAL(5,2),
  streak_days INTEGER DEFAULT 0,
  best_streak_days INTEGER DEFAULT 0,
  avg_delay_minutes INTEGER,
  risk_level VARCHAR(20),
  ai_recommendations JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Caregiver notifications
CREATE TABLE caregiver_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  caregiver_email VARCHAR(255) NOT NULL,
  caregiver_phone VARCHAR(50),
  notification_type VARCHAR(50),
  alert_level VARCHAR(20) DEFAULT 'info',
  message TEXT NOT NULL,
  adherence_data_id UUID REFERENCES adherence_data(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes for IoT and adherence
CREATE INDEX idx_iot_devices_user ON iot_devices(user_id);
CREATE INDEX idx_iot_devices_status ON iot_devices(connection_status);
CREATE INDEX idx_adherence_data_user ON adherence_data(user_id);
CREATE INDEX idx_adherence_data_device ON adherence_data(device_id);
CREATE INDEX idx_adherence_data_scheduled ON adherence_data(scheduled_time DESC);
CREATE INDEX idx_adherence_data_status ON adherence_data(adherence_status);
CREATE INDEX idx_interventions_user ON interventions(user_id);
CREATE INDEX idx_interventions_priority ON interventions(priority, sent_at DESC);
CREATE INDEX idx_adherence_analytics_user ON adherence_analytics(user_id);
CREATE INDEX idx_caregiver_notifications_patient ON caregiver_notifications(patient_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Drug Provenance RLS
ALTER TABLE drug_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE supply_chain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view drug provenance" ON drug_provenance FOR SELECT USING (true);
CREATE POLICY "Anyone can view supply chain events" ON supply_chain_events FOR SELECT USING (true);
CREATE POLICY "Users can view own verification history" ON verification_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create verification records" ON verification_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Smart Contracts RLS
ALTER TABLE smart_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_lifecycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_refills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contracts" ON smart_contracts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own contracts" ON smart_contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contracts" ON smart_contracts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own prescription lifecycle" ON prescription_lifecycle FOR SELECT USING (
  EXISTS (SELECT 1 FROM smart_contracts WHERE id = contract_id AND user_id = auth.uid())
);
CREATE POLICY "Users can view own refills" ON automated_refills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own refills" ON automated_refills FOR ALL USING (auth.uid() = user_id);

-- IoT and Adherence RLS
ALTER TABLE iot_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE adherence_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE adherence_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own devices" ON iot_devices FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own devices" ON iot_devices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own adherence data" ON adherence_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own adherence data" ON adherence_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own interventions" ON interventions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own analytics" ON adherence_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view caregiver notifications for own data" ON caregiver_notifications FOR SELECT USING (auth.uid() = patient_id);

-- ============================================================================
-- SEED DATA FOR DEMO
-- ============================================================================

-- Insert sample drug provenance data for existing products
INSERT INTO drug_provenance (product_id, batch_number, blockchain_hash, manufacturing_date, expiry_date, manufacturer_id, manufacturer_name, manufacturing_location, qr_code_data, total_units, units_distributed)
SELECT 
  id,
  'BATCH-' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8),
  'SHA256:' || MD5(RANDOM()::TEXT || id::TEXT),
  CURRENT_DATE - INTERVAL '6 months',
  CURRENT_DATE + INTERVAL '18 months',
  'MFG-' || (RANDOM() * 1000)::INTEGER,
  CASE 
    WHEN RANDOM() < 0.3 THEN 'Pfizer Pharmaceuticals'
    WHEN RANDOM() < 0.6 THEN 'GSK Manufacturing'
    ELSE 'Novartis Production'
  END,
  CASE 
    WHEN RANDOM() < 0.5 THEN 'Cairo, Egypt'
    ELSE 'Alexandria, Egypt'
  END,
  'QR:' || MD5(RANDOM()::TEXT),
  (RANDOM() * 10000 + 1000)::INTEGER,
  (RANDOM() * 500)::INTEGER
FROM products
WHERE id IN (SELECT id FROM products ORDER BY RANDOM() LIMIT 20);

-- Insert supply chain events for batches
INSERT INTO supply_chain_events (batch_id, event_type, event_timestamp, location_name, location_coordinates, handler_name, units_transferred, blockchain_hash)
SELECT 
  id,
  'manufactured',
  created_at,
  manufacturing_location,
  jsonb_build_object('lat', 30.0444 + (RANDOM() * 0.5), 'lng', 31.2357 + (RANDOM() * 0.5)),
  manufacturer_name,
  total_units,
  'SHA256:' || MD5(RANDOM()::TEXT || id::TEXT)
FROM drug_provenance;

INSERT INTO supply_chain_events (batch_id, event_type, event_timestamp, location_name, location_coordinates, handler_name, units_transferred, blockchain_hash)
SELECT 
  id,
  'shipped',
  created_at + INTERVAL '2 days',
  'Distribution Center Cairo',
  jsonb_build_object('lat', 30.0626, 'lng', 31.2497),
  'Egypt Pharma Logistics',
  total_units,
  'SHA256:' || MD5(RANDOM()::TEXT || id::TEXT)
FROM drug_provenance;;