-- Migration: add_insurance_claims_system
-- Created at: 1762082920

-- Insurance Claims Management System

-- Claims table
CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_insurance_id UUID NOT NULL REFERENCES user_insurance(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  claim_number TEXT UNIQUE NOT NULL,
  claim_amount DECIMAL(10,2) NOT NULL,
  approved_amount DECIMAL(10,2),
  patient_responsibility DECIMAL(10,2),
  claim_status TEXT DEFAULT 'pending' CHECK (claim_status IN (
    'pending', 'processing', 'approved', 'partially_approved', 'rejected', 'cancelled'
  )),
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  processing_date TIMESTAMPTZ,
  approval_date TIMESTAMPTZ,
  rejection_reason TEXT,
  reviewer_notes TEXT,
  reimbursement_method TEXT CHECK (reimbursement_method IN (
    'direct_billing', 'reimbursement_check', 'bank_transfer', 'pharmacy_credit'
  )),
  supporting_documents TEXT[],
  prior_authorization_required BOOLEAN DEFAULT FALSE,
  prior_authorization_number TEXT,
  processed_by TEXT,
  appeal_submitted BOOLEAN DEFAULT FALSE,
  appeal_date TIMESTAMPTZ,
  final_decision TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims processing history
CREATE TABLE IF NOT EXISTS insurance_claims_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES insurance_claims(id) ON DELETE CASCADE,
  status_from TEXT,
  status_to TEXT NOT NULL,
  changed_by TEXT,
  change_reason TEXT,
  notes TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coverage plans and structures
CREATE TABLE IF NOT EXISTS insurance_coverage_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES insurance_providers(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_name_ar TEXT NOT NULL,
  plan_type TEXT CHECK (plan_type IN ('basic', 'standard', 'premium', 'family', 'senior')),
  medication_coverage_percentage INTEGER CHECK (medication_coverage_percentage BETWEEN 50 AND 100),
  generic_medication_coverage INTEGER DEFAULT 90,
  brand_medication_coverage INTEGER DEFAULT 80,
  specialty_medication_coverage INTEGER DEFAULT 60,
  deductible_amount DECIMAL(10,2) DEFAULT 0,
  max_annual_benefit DECIMAL(10,2),
  copay_structure JSONB,
  formulary_tier JSONB,
  restrictions TEXT[],
  monthly_premium DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  effective_date DATE,
  termination_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced formulary system
CREATE TABLE IF NOT EXISTS insurance_formulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES insurance_providers(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  medication_name_ar TEXT,
  generic_name TEXT,
  brand_name TEXT,
  therapeutic_class TEXT,
  tier_level INTEGER DEFAULT 1 CHECK (tier_level BETWEEN 1 AND 5),
  requires_prior_auth BOOLEAN DEFAULT FALSE,
  step_therapy_required BOOLEAN DEFAULT FALSE,
  quantity_limit INTEGER,
  quantity_limit_period TEXT,
  copay_amount DECIMAL(10,2),
  coinsurance_percentage INTEGER,
  special_instructions TEXT,
  alternative_medications TEXT[],
  is_covered BOOLEAN DEFAULT TRUE,
  coverage_start_date DATE DEFAULT CURRENT_DATE,
  coverage_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prior authorization system
CREATE TABLE IF NOT EXISTS insurance_prior_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_insurance_id UUID NOT NULL REFERENCES user_insurance(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES insurance_claims(id),
  medication_name TEXT NOT NULL,
  medication_name_ar TEXT,
  indication TEXT,
  requested_quantity INTEGER,
  duration_days INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'under_review', 'approved', 'denied', 'expired', 'cancelled'
  )),
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  decision_date TIMESTAMPTZ,
  decision_made_by TEXT,
  decision_reason TEXT,
  approval_number TEXT UNIQUE,
  expiration_date DATE,
  reviewer_notes TEXT,
  clinical_criteria_met BOOLEAN,
  supporting_documentation TEXT[],
  appeals_allowed BOOLEAN DEFAULT TRUE,
  appeals_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copay calculation engine
CREATE TABLE IF NOT EXISTS insurance_copay_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_insurance_id UUID NOT NULL REFERENCES user_insurance(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  verification_id UUID REFERENCES insurance_verifications(id),
  total_order_amount DECIMAL(10,2) NOT NULL,
  deductible_applied DECIMAL(10,2) DEFAULT 0,
  copay_percentage_applied DECIMAL(5,2),
  insurance_coverage DECIMAL(10,2) NOT NULL,
  patient_responsibility DECIMAL(10,2) NOT NULL,
  medication_breakdown JSONB,
  calculation_details JSONB,
  calculation_timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_final BOOLEAN DEFAULT FALSE,
  calculated_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns to insurance_verifications if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'insurance_verifications' AND column_name = 'verification_reference') THEN
    ALTER TABLE insurance_verifications ADD COLUMN verification_reference TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'insurance_verifications' AND column_name = 'processing_time_ms') THEN
    ALTER TABLE insurance_verifications ADD COLUMN processing_time_ms INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'insurance_verifications' AND column_name = 'api_endpoint_used') THEN
    ALTER TABLE insurance_verifications ADD COLUMN api_endpoint_used TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'insurance_verifications' AND column_name = 'fallback_used') THEN
    ALTER TABLE insurance_verifications ADD COLUMN fallback_used BOOLEAN DEFAULT FALSE;
  END IF;
END $$;;