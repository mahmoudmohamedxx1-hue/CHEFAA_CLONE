-- Migration: medical_records_system_fixed
-- Created at: 1762082754

-- Medical Records System Database Schema
-- HIPAA-Compliant Secure Medical Records with Encryption

-- ============================================
-- 1. ENCRYPTED MEDICAL RECORDS CORE
-- ============================================

-- Main encrypted medical records table
CREATE TABLE IF NOT EXISTS encrypted_medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  record_type TEXT NOT NULL CHECK (record_type IN ('general', 'prescription', 'lab_result', 'consultation', 'procedure', 'immunization')),
  encrypted_data TEXT NOT NULL, -- Encrypted JSON with medical data
  encryption_key_id TEXT, -- Reference to encryption key
  record_date DATE NOT NULL,
  provider_id UUID, -- Healthcare provider
  facility_name TEXT,
  record_hash TEXT, -- Integrity check hash
  is_active BOOLEAN DEFAULT TRUE,
  access_level TEXT DEFAULT 'standard' CHECK (access_level IN ('standard', 'restricted', 'emergency')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  UNIQUE(user_id, record_type, record_date)
);

-- Medical record access logs (HIPAA audit trail)
CREATE TABLE IF NOT EXISTS medical_record_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL REFERENCES encrypted_medical_records(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'create', 'update', 'delete', 'export')),
  access_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  access_granted BOOLEAN DEFAULT TRUE,
  audit_timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT
);

-- ============================================
-- 2. ENHANCED PRESCRIPTION HISTORY
-- ============================================

-- Enhanced prescription history with timeline tracking
CREATE TABLE IF NOT EXISTS enhanced_prescription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  medication_name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL,
  dosage_form TEXT, -- tablet, capsule, liquid, etc.
  frequency TEXT NOT NULL, -- "twice daily", "every 8 hours"
  route TEXT, -- oral, topical, injection, etc.
  start_date DATE NOT NULL,
  end_date DATE,
  prescribed_by TEXT NOT NULL,
  prescriber_license TEXT,
  pharmacy_name TEXT,
  pharmacy_license TEXT,
  prescription_number TEXT,
  refills_remaining INTEGER DEFAULT 0,
  total_refills INTEGER DEFAULT 0,
  days_supply INTEGER,
  quantity_dispensed INTEGER,
  indication TEXT, -- Reason for prescription
  instructions TEXT, -- Special instructions
  side_effects TEXT,
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
  adherence_score INTEGER CHECK (adherence_score BETWEEN 0 AND 100),
  cost DECIMAL(10,2),
  insurance_coverage DECIMAL(10,2),
  is_controlled_substance BOOLEAN DEFAULT FALSE,
  controlled_substance_class TEXT, -- Schedule I-V
  prescription_status TEXT DEFAULT 'active' CHECK (prescription_status IN ('active', 'completed', 'discontinued', 'on_hold', 'expired')),
  discontinuation_reason TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  next_refill_date DATE,
  compliance_notes TEXT,
  encrypted_medication_data TEXT, -- Additional encrypted sensitive data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prescription timeline events
CREATE TABLE IF NOT EXISTS prescription_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES enhanced_prescription_history(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('prescribed', 'refilled', 'discontinued', 'side_effect_reported', 'dose_changed', 'therapy_completed')),
  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_details TEXT,
  performed_by TEXT, -- Doctor, pharmacist, patient
  outcome TEXT,
  notes TEXT
);

-- ============================================
-- 3. COMPREHENSIVE DRUG INTERACTIONS
-- ============================================

-- Enhanced drug interactions database
CREATE TABLE IF NOT EXISTS comprehensive_drug_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_a_name TEXT NOT NULL,
  medication_a_generic TEXT,
  medication_b_name TEXT NOT NULL,
  medication_b_generic TEXT,
  interaction_severity TEXT NOT NULL CHECK (interaction_severity IN ('contraindicated', 'major', 'moderate', 'minor', 'monitor')),
  interaction_type TEXT CHECK (interaction_type IN ('drug_drug', 'drug_food', 'drug_supplement', 'drug_condition')),
  interaction_mechanism TEXT, -- How the interaction occurs
  clinical_effects TEXT NOT NULL, -- What happens
  management_recommendations TEXT NOT NULL, -- How to manage
  evidence_level TEXT CHECK (evidence_level IN ('excellent', 'good', 'fair', 'poor')),
  onset TEXT CHECK (onset IN ('rapid', 'delayed', 'variable')),
  documentation TEXT, -- Supporting documentation
  scientific_references TEXT, -- Scientific references
  is_emergency BOOLEAN DEFAULT FALSE,
  requires_monitoring BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drug interaction check logs
CREATE TABLE IF NOT EXISTS drug_interaction_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  medications_checked TEXT[] NOT NULL, -- Array of medication names
  interactions_found JSONB, -- Array of interaction results
  check_timestamp TIMESTAMPTZ DEFAULT NOW(),
  check_context TEXT, -- Why the check was performed
  user_agent TEXT,
  ip_address INET
);

-- ============================================
-- 4. ALLERGY & CONDITION MANAGEMENT
-- ============================================

-- Comprehensive allergy management
CREATE TABLE IF NOT EXISTS enhanced_patient_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  allergen_name TEXT NOT NULL,
  allergen_type TEXT NOT NULL CHECK (allergen_type IN ('medication', 'food', 'environmental', 'contact', 'other')),
  allergen_category TEXT, -- More specific classification
  allergic_reaction TEXT NOT NULL, -- What happens
  reaction_severity TEXT NOT NULL CHECK (reaction_severity IN ('mild', 'moderate', 'severe', 'life_threatening', 'anaphylaxis')),
  onset_time TEXT, -- How quickly reaction occurs
  body_systems_affected TEXT[], -- Array of affected body systems
  treatment_required TEXT,
  cross_reactivity TEXT, -- Related allergens
  desensitization_status TEXT CHECK (desensitization_status IN ('not_attempted', 'in_progress', 'completed', 'failed')),
  last_reaction_date DATE,
  reaction_frequency TEXT, -- How often reactions occur
  emergency_plan TEXT,
  notes TEXT,
  verified_by TEXT, -- Healthcare provider verification
  verification_date DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical conditions with detailed tracking
CREATE TABLE IF NOT EXISTS enhanced_patient_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  condition_name TEXT NOT NULL,
  condition_code TEXT, -- ICD-10, SNOMED, etc.
  condition_category TEXT,
  diagnosis_date DATE,
  diagnosis_source TEXT, -- How diagnosed
  diagnosed_by TEXT, -- Healthcare provider
  severity TEXT CHECK (severity IN ('asymptomatic', 'mild', 'moderate', 'severe', 'life_threatening')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'resolved', 'chronic', 'recurring')),
  is_genetic BOOLEAN DEFAULT FALSE,
  is_infectious BOOLEAN DEFAULT FALSE,
  is_contagious BOOLEAN DEFAULT FALSE,
  family_history_relevance TEXT,
  risk_factors TEXT,
  current_symptoms TEXT,
  symptom_severity_score INTEGER CHECK (symptom_severity_score BETWEEN 0 AND 10),
  functional_impact TEXT, -- How it affects daily life
  treatment_response TEXT,
  monitoring_parameters TEXT, -- What to monitor
  follow_up_schedule TEXT,
  prognosis TEXT,
  notes TEXT,
  verified_by TEXT,
  verification_date DATE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. LAB RESULTS INTEGRATION
-- ============================================

-- Comprehensive lab results
CREATE TABLE IF NOT EXISTS comprehensive_lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  test_name TEXT NOT NULL,
  test_code TEXT, -- LOINC code
  test_category TEXT, -- Chemistry, Hematology, etc.
  test_date DATE NOT NULL,
  collection_time TIME,
  result_value TEXT NOT NULL,
  result_value_numeric DECIMAL(15,6), -- For numerical results
  unit TEXT,
  reference_range TEXT,
  reference_range_low DECIMAL(15,6),
  reference_range_high DECIMAL(15,6),
  is_abnormal BOOLEAN DEFAULT FALSE,
  abnormality_flag TEXT, -- H, L, HH, LL, etc.
  critical_value BOOLEAN DEFAULT FALSE,
  lab_name TEXT NOT NULL,
  lab_license TEXT,
  lab_address TEXT,
  ordered_by TEXT NOT NULL,
  ordering_provider_license TEXT,
  test_methodology TEXT,
  specimen_type TEXT, -- Blood, urine, etc.
  specimen_collector TEXT,
  report_date TIMESTAMPTZ,
  verification_date TIMESTAMPTZ,
  verified_by TEXT,
  clinical_significance TEXT,
  recommended_actions TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  notes TEXT,
  document_url TEXT, -- Link to original lab report
  quality_control_passed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab result trends and analysis
CREATE TABLE IF NOT EXISTS lab_result_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  test_code TEXT NOT NULL,
  test_name TEXT NOT NULL,
  measurement_period_start DATE NOT NULL,
  measurement_period_end DATE NOT NULL,
  total_measurements INTEGER NOT NULL,
  average_value DECIMAL(15,6),
  trend_direction TEXT CHECK (trend_direction IN ('increasing', 'decreasing', 'stable', 'variable')),
  trend_significance TEXT CHECK (trend_significance IN ('significant', 'moderate', 'minimal')),
  clinical_interpretation TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. TREATMENT PLANS & MONITORING
-- ============================================

-- Treatment plans
CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  plan_name TEXT NOT NULL,
  condition_treated TEXT,
  plan_type TEXT CHECK (plan_type IN ('medication', 'therapy', 'lifestyle', 'surgical', 'preventive', 'palliative')),
  start_date DATE NOT NULL,
  end_date DATE,
  goal_description TEXT,
  specific_objectives TEXT[],
  interventions TEXT[], -- Array of interventions
  monitoring_schedule TEXT,
  success_metrics TEXT[],
  risk_assessment TEXT,
  contingency_plans TEXT[],
  provider_id UUID,
  plan_status TEXT DEFAULT 'active' CHECK (plan_status IN ('planned', 'active', 'completed', 'discontinued', 'on_hold')),
  progress_notes TEXT,
  patient_education_provided BOOLEAN DEFAULT FALSE,
  adherence_rate INTEGER CHECK (adherence_rate BETWEEN 0 AND 100),
  outcome_assessment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Treatment plan monitoring
CREATE TABLE IF NOT EXISTS treatment_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_id UUID NOT NULL REFERENCES treatment_plans(id),
  monitoring_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parameter_measured TEXT NOT NULL,
  measured_value TEXT,
  target_value TEXT,
  within_target BOOLEAN,
  adherence_score INTEGER CHECK (adherence_score BETWEEN 0 AND 100),
  side_effects_observed TEXT,
  dose_adjustments TEXT,
  patient_reported_outcomes TEXT,
  provider_assessment TEXT,
  next_monitoring_date DATE,
  notes TEXT,
  monitored_by TEXT
);

-- ============================================
-- 7. SECURITY & COMPLIANCE
-- ============================================

-- Data encryption keys management
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id TEXT UNIQUE NOT NULL,
  key_version INTEGER NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'AES-256-GCM',
  key_purpose TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  rotation_required BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HIPAA compliance audit
CREATE TABLE IF NOT EXISTS hipaa_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  access_granted BOOLEAN DEFAULT TRUE,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  session_duration INTERVAL,
  data_elements_accessed TEXT[],
  audit_timestamp TIMESTAMPTZ DEFAULT NOW(),
  compliance_officer_notified BOOLEAN DEFAULT FALSE
);

-- Data retention policy
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type TEXT NOT NULL,
  retention_period_years INTEGER NOT NULL,
  disposal_method TEXT NOT NULL CHECK (disposal_method IN ('delete', 'archive', 'anonymize')),
  applicable_regulations TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

-- Medical Records
CREATE INDEX IF NOT EXISTS idx_encrypted_medical_records_user ON encrypted_medical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_medical_records_type ON encrypted_medical_records(record_type);
CREATE INDEX IF NOT EXISTS idx_encrypted_medical_records_date ON encrypted_medical_records(record_date);
CREATE INDEX IF NOT EXISTS idx_medical_record_access_logs_record ON medical_record_access_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_access_logs_user ON medical_record_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_record_access_logs_timestamp ON medical_record_access_logs(audit_timestamp);

-- Prescription History
CREATE INDEX IF NOT EXISTS idx_enhanced_prescription_history_user ON enhanced_prescription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_prescription_history_medication ON enhanced_prescription_history(medication_name);
CREATE INDEX IF NOT EXISTS idx_enhanced_prescription_history_date ON enhanced_prescription_history(start_date);
CREATE INDEX IF NOT EXISTS idx_prescription_timeline_prescription ON prescription_timeline(prescription_id);
CREATE INDEX IF NOT EXISTS idx_prescription_timeline_date ON prescription_timeline(event_date);

-- Drug Interactions
CREATE INDEX IF NOT EXISTS idx_comprehensive_drug_interactions_a ON comprehensive_drug_interactions(medication_a_name);
CREATE INDEX IF NOT EXISTS idx_comprehensive_drug_interactions_b ON comprehensive_drug_interactions(medication_b_name);
CREATE INDEX IF NOT EXISTS idx_comprehensive_drug_interactions_severity ON comprehensive_drug_interactions(interaction_severity);
CREATE INDEX IF NOT EXISTS idx_drug_interaction_checks_user ON drug_interaction_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_drug_interaction_checks_timestamp ON drug_interaction_checks(check_timestamp);

-- Allergies & Conditions
CREATE INDEX IF NOT EXISTS idx_enhanced_patient_allergies_user ON enhanced_patient_allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_patient_allergies_type ON enhanced_patient_allergies(allergen_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_patient_allergies_severity ON enhanced_patient_allergies(reaction_severity);
CREATE INDEX IF NOT EXISTS idx_enhanced_patient_conditions_user ON enhanced_patient_conditions(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_patient_conditions_code ON enhanced_patient_conditions(condition_code);
CREATE INDEX IF NOT EXISTS idx_enhanced_patient_conditions_status ON enhanced_patient_conditions(status);

-- Lab Results
CREATE INDEX IF NOT EXISTS idx_comprehensive_lab_results_user ON comprehensive_lab_results(user_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_lab_results_test ON comprehensive_lab_results(test_code);
CREATE INDEX IF NOT EXISTS idx_comprehensive_lab_results_date ON comprehensive_lab_results(test_date);
CREATE INDEX IF NOT EXISTS idx_comprehensive_lab_results_abnormal ON comprehensive_lab_results(is_abnormal);
CREATE INDEX IF NOT EXISTS idx_lab_result_trends_user ON lab_result_trends(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_result_trends_test ON lab_result_trends(test_code);

-- Treatment Plans
CREATE INDEX IF NOT EXISTS idx_treatment_plans_user ON treatment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_condition ON treatment_plans(condition_treated);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_status ON treatment_plans(plan_status);
CREATE INDEX IF NOT EXISTS idx_treatment_monitoring_plan ON treatment_monitoring(treatment_plan_id);
CREATE INDEX IF NOT EXISTS idx_treatment_monitoring_date ON treatment_monitoring(monitoring_date);

-- Security
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_logs_user ON hipaa_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_logs_action ON hipaa_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_hipaa_audit_logs_timestamp ON hipaa_audit_logs(audit_timestamp);

-- ============================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all medical tables
ALTER TABLE encrypted_medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_record_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_prescription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_patient_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comprehensive_lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_result_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE hipaa_audit_logs ENABLE ROW LEVEL SECURITY;

-- Medical records access policies
CREATE POLICY "Users can only access their own medical records" ON encrypted_medical_records
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own access logs" ON medical_record_access_logs
  FOR ALL USING (auth.uid() = user_id);

-- Prescription history policies
CREATE POLICY "Users can manage their own prescription history" ON enhanced_prescription_history
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own prescription timeline" ON prescription_timeline
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM enhanced_prescription_history 
      WHERE id = prescription_id AND user_id = auth.uid()
    )
  );

-- Allergy policies
CREATE POLICY "Users can manage their own allergies" ON enhanced_patient_allergies
  FOR ALL USING (auth.uid() = user_id);

-- Condition policies
CREATE POLICY "Users can manage their own conditions" ON enhanced_patient_conditions
  FOR ALL USING (auth.uid() = user_id);

-- Lab result policies
CREATE POLICY "Users can manage their own lab results" ON comprehensive_lab_results
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own lab trends" ON lab_result_trends
  FOR ALL USING (auth.uid() = user_id);

-- Treatment plan policies
CREATE POLICY "Users can view their own treatment plans" ON treatment_plans
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own treatment monitoring" ON treatment_monitoring
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM treatment_plans 
      WHERE id = treatment_plan_id AND user_id = auth.uid()
    )
  );

-- Audit log policies
CREATE POLICY "Users can view their own audit logs" ON hipaa_audit_logs
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 10. SAMPLE DATA FOR DRUG INTERACTIONS
-- ============================================

INSERT INTO comprehensive_drug_interactions (medication_a_name, medication_a_generic, medication_b_name, medication_b_generic, interaction_severity, interaction_type, clinical_effects, management_recommendations) VALUES
('Warfarin', 'warfarin', 'Aspirin', 'aspirin', 'major', 'drug_drug', 'Increased risk of bleeding', 'Monitor INR closely, consider alternative pain reliever'),
('Metformin', 'metformin', 'Contrast agents', 'iodine', 'major', 'drug_drug', 'Risk of lactic acidosis', 'Hold metformin 48 hours before and after contrast'),
('Lisinopril', 'lisinopril', 'Potassium supplements', 'potassium', 'moderate', 'drug_drug', 'Hyperkalemia risk', 'Monitor potassium levels regularly'),
('Simvastatin', 'simvastatin', 'Grapefruit juice', 'grapefruit', 'moderate', 'drug_food', 'Increased statin levels', 'Avoid grapefruit juice consumption'),
('Digoxin', 'digoxin', 'Furosemide', 'furosemide', 'moderate', 'drug_drug', 'Electrolyte imbalance affecting digoxin', 'Monitor electrolytes and digoxin levels'),
('Ibuprofen', 'ibuprofen', 'Lisinopril', 'lisinopril', 'moderate', 'drug_drug', 'Reduced antihypertensive effect', 'Monitor blood pressure, consider alternative pain reliever'),
('Amoxicillin', 'amoxicillin', 'Oral contraceptives', 'ethinyl estradiol', 'minor', 'drug_drug', 'Reduced contraceptive efficacy', 'Use backup contraception during treatment'),
('Methotrexate', 'methotrexate', 'Trimethoprim', 'trimethoprim', 'major', 'drug_drug', 'Severe bone marrow suppression', 'Avoid combination or monitor closely'),
('Insulin', 'insulin', 'Beta blockers', 'propranolol', 'moderate', 'drug_drug', 'Masked hypoglycemia symptoms', 'Monitor blood glucose more frequently'),
('Clopidogrel', 'clopidogrel', 'Omeprazole', 'omeprazole', 'moderate', 'drug_drug', 'Reduced antiplatelet effect', 'Consider alternative PPI');

-- Sample data retention policies
INSERT INTO data_retention_policies (data_type, retention_period_years, disposal_method, applicable_regulations) VALUES
('Medical Records', 10, 'archive', ARRAY['HIPAA', 'GDPR']),
('Lab Results', 7, 'archive', ARRAY['HIPAA', 'CLIA']),
('Prescription Records', 7, 'archive', ARRAY['DEA', 'State Regulations']),
('Audit Logs', 6, 'archive', ARRAY['HIPAA', 'SOX']),
('Access Logs', 3, 'delete', ARRAY['HIPAA']);

-- Initialize encryption key
INSERT INTO encryption_keys (key_id, key_version, key_purpose, is_active) VALUES
('med_records_key', 1, 'medical_records_encryption', true);;