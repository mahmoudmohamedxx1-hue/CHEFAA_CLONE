-- Migration: phase4_part4_family_accounts
-- Created at: 1762075569

-- Phase 4 Part 4: Family Accounts

-- Family account relationships
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id UUID NOT NULL REFERENCES auth.users(id),
  member_user_id UUID REFERENCES auth.users(id),
  first_name TEXT NOT NULL,
  last_name TEXT,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  relationship TEXT CHECK (relationship IN ('self', 'spouse', 'child', 'parent', 'sibling', 'other')),
  national_id TEXT,
  has_separate_account BOOLEAN DEFAULT FALSE,
  consent_given BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family medication schedules
CREATE TABLE IF NOT EXISTS medication_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id),
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  schedule_times TIME[],
  start_date DATE NOT NULL,
  end_date DATE,
  reminder_enabled BOOLEAN DEFAULT TRUE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family shared prescriptions
CREATE TABLE IF NOT EXISTS family_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  prescription_url TEXT NOT NULL,
  patient_name TEXT NOT NULL,
  doctor_name TEXT,
  prescription_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_family_members_primary ON family_members(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_member ON medication_schedules(family_member_id);
;