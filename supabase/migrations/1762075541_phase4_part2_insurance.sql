-- Migration: phase4_part2_insurance
-- Created at: 1762075541

-- Phase 4 Part 2: Insurance Integration

-- Insurance providers database
CREATE TABLE IF NOT EXISTS insurance_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  provider_code TEXT UNIQUE NOT NULL,
  provider_type TEXT CHECK (provider_type IN ('private', 'government', 'corporate', 'international')),
  contact_phone TEXT,
  contact_email TEXT,
  api_endpoint TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  coverage_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User insurance information
CREATE TABLE IF NOT EXISTS user_insurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  provider_id UUID NOT NULL REFERENCES insurance_providers(id),
  policy_number TEXT NOT NULL,
  member_id TEXT,
  group_number TEXT,
  policy_holder_name TEXT,
  relationship TEXT CHECK (relationship IN ('self', 'spouse', 'child', 'parent', 'other')),
  coverage_start_date DATE,
  coverage_end_date DATE,
  copay_percentage DECIMAL(5,2) DEFAULT 0,
  deductible_amount DECIMAL(10,2) DEFAULT 0,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  last_verified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insurance verification logs
CREATE TABLE IF NOT EXISTS insurance_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_insurance_id UUID NOT NULL REFERENCES user_insurance(id),
  order_id UUID REFERENCES orders(id),
  verification_type TEXT CHECK (verification_type IN ('eligibility', 'prior_authorization', 'coverage')),
  request_data JSONB,
  response_data JSONB,
  status TEXT DEFAULT 'pending',
  coverage_amount DECIMAL(10,2),
  copay_amount DECIMAL(10,2),
  patient_responsibility DECIMAL(10,2),
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_insurance_user ON user_insurance(user_id);
CREATE INDEX IF NOT EXISTS idx_user_insurance_provider ON user_insurance(provider_id);
CREATE INDEX IF NOT EXISTS idx_insurance_verifications_order ON insurance_verifications(order_id);
;