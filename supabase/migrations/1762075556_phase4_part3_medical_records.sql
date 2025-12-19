-- Migration: phase4_part3_medical_records
-- Created at: 1762075556

-- Phase 4 Part 3: Medical Records System

-- Patient medical conditions
CREATE TABLE IF NOT EXISTS patient_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  condition_name TEXT NOT NULL,
  condition_code TEXT,
  diagnosed_date DATE,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  is_chronic BOOLEAN DEFAULT FALSE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient allergies
CREATE TABLE IF NOT EXISTS patient_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  allergen TEXT NOT NULL,
  allergen_type TEXT CHECK (allergen_type IN ('medication', 'food', 'environmental', 'other')),
  reaction TEXT,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
  diagnosed_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medication history
CREATE TABLE IF NOT EXISTS medication_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  prescribed_by TEXT,
  purpose TEXT,
  side_effects_experienced TEXT,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drug interaction warnings
CREATE TABLE IF NOT EXISTS drug_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_a TEXT NOT NULL,
  medication_b TEXT NOT NULL,
  interaction_type TEXT CHECK (interaction_type IN ('major', 'moderate', 'minor')),
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(medication_a, medication_b)
);

-- Lab results integration
CREATE TABLE IF NOT EXISTS lab_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  test_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  result_value TEXT NOT NULL,
  unit TEXT,
  reference_range TEXT,
  is_abnormal BOOLEAN DEFAULT FALSE,
  lab_name TEXT,
  ordered_by TEXT,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patient_conditions_user ON patient_conditions(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_user ON patient_allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_history_user ON medication_history(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_user ON lab_results(user_id);
;