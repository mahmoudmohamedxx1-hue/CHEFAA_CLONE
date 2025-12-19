-- Migration: comprehensive_family_accounts_fixed
-- Created at: 1762082637

-- Comprehensive Family Account Management System
-- Enhanced database schema for family accounts with age-based features and COPPA compliance

-- ============================================
-- 1. ENHANCED FAMILY RELATIONSHIPS
-- ============================================

-- Family relationships with comprehensive metadata
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS medical_conditions JSONB DEFAULT '[]';
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS allergies JSONB DEFAULT '[]';
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS insurance_info JSONB DEFAULT '{}';
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS emergency_contact BOOLEAN DEFAULT FALSE;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS address JSONB DEFAULT '{}';
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS age_category TEXT CHECK (age_category IN ('infant', 'child', 'adolescent', 'adult', 'senior'));
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS requires_emergency_contact BOOLEAN DEFAULT FALSE;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS can_manage_own_medications BOOLEAN DEFAULT TRUE;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS parental_consent_status TEXT CHECK (parental_consent_status IN ('not_required', 'pending', 'granted', 'denied'));
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS consent_expiry_date TIMESTAMPTZ;

-- Update family_members table constraints
ALTER TABLE family_members 
  ALTER COLUMN consent_given SET DEFAULT FALSE,
  ALTER COLUMN is_active SET DEFAULT TRUE;

-- ============================================
-- 2. EMERGENCY CONTACTS SYSTEM
-- ============================================

-- Emergency contacts for family members
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT,
  relationship TEXT CHECK (relationship IN ('parent', 'guardian', 'spouse', 'child', 'sibling', 'other')),
  primary_contact BOOLEAN DEFAULT FALSE,
  can_access_medical_info BOOLEAN DEFAULT TRUE,
  can_manage_orders BOOLEAN DEFAULT FALSE,
  notification_preferences JSONB DEFAULT '{"sms": true, "email": true, "push": true}',
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. ENHANCED MEDICATION MANAGEMENT
-- ============================================

-- Medication categories based on age
CREATE TABLE IF NOT EXISTS medication_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  age_restrictions JSONB, -- {"min_age": 0, "max_age": 120}
  requires_prescription BOOLEAN DEFAULT FALSE,
  parental_approval_required BOOLEAN DEFAULT FALSE,
  dosage_guidelines JSONB,
  side_effects JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced medication schedules with automation
ALTER TABLE medication_schedules 
  ADD COLUMN IF NOT EXISTS automation_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_refill_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_taken_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS missed_doses INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS adherence_rate DECIMAL(5,2) DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS reminder_times TIME[],
  ADD COLUMN IF NOT EXISTS dosage_instructions TEXT,
  ADD COLUMN IF NOT EXISTS prescribed_by TEXT,
  ADD COLUMN IF NOT EXISTS prescription_date DATE,
  ADD COLUMN IF NOT EXISTS side_effects TEXT,
  ADD COLUMN IF NOT EXISTS pharmacy_notes TEXT;

-- Medication adherence tracking
CREATE TABLE IF NOT EXISTS medication_adherence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_schedule_id UUID NOT NULL REFERENCES medication_schedules(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  actual_time TIMESTAMPTZ,
  status TEXT CHECK (status IN ('taken', 'missed', 'late', 'skipped')) DEFAULT 'missed',
  notes TEXT,
  photo_proof_url TEXT,
  side_effects_reported TEXT,
  adherence_confidence DECIMAL(3,2), -- AI confidence in adherence data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(medication_schedule_id, scheduled_time)
);

-- ============================================
-- 4. PARENTAL CONSENT AND COPPA COMPLIANCE
-- ============================================

-- Parental consent management
CREATE TABLE IF NOT EXISTS parental_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  parent_guardian_id UUID NOT NULL REFERENCES auth.users(id),
  consent_type TEXT CHECK (consent_type IN ('data_collection', 'medication_management', 'emergency_access', 'order_management', 'data_sharing')) NOT NULL,
  consent_status TEXT CHECK (consent_status IN ('pending', 'granted', 'denied', 'revoked', 'expired')) DEFAULT 'pending',
  consent_details JSONB DEFAULT '{}',
  expiry_date TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_member_id, consent_type)
);

-- Consent audit log
CREATE TABLE IF NOT EXISTS consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id),
  parent_guardian_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. FAMILY PERMISSIONS SYSTEM
-- ============================================

-- Family member permissions
CREATE TABLE IF NOT EXISTS family_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  permission_type TEXT CHECK (permission_type IN ('manage_medications', 'view_orders', 'manage_orders', 'access_medical_history', 'emergency_access', 'share_data')) NOT NULL,
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  granted_to UUID, -- Self-granted or by other family member
  is_active BOOLEAN DEFAULT TRUE,
  expiry_date TIMESTAMPTZ,
  conditions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_member_id, permission_type)
);

-- ============================================
-- 6. SHARED MEDICATION CARTS
-- ============================================

-- Family shared medication cart
CREATE TABLE IF NOT EXISTS family_shared_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  added_by UUID NOT NULL REFERENCES auth.users(id),
  is_urgent BOOLEAN DEFAULT FALSE,
  notes TEXT,
  auto_reorder BOOLEAN DEFAULT FALSE,
  reorder_frequency_days INTEGER,
  next_reorder_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shared cart permissions
CREATE TABLE IF NOT EXISTS shared_cart_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id),
  can_add_items BOOLEAN DEFAULT TRUE,
  can_remove_items BOOLEAN DEFAULT FALSE,
  can_modify_quantities BOOLEAN DEFAULT TRUE,
  can_checkout BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_member_id)
);

-- ============================================
-- 7. FAMILY NOTIFICATIONS
-- ============================================

-- Family-specific notifications
CREATE TABLE IF NOT EXISTS family_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID REFERENCES family_members(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  notification_type TEXT CHECK (notification_type IN ('medication_reminder', 'refill_due', 'emergency_contact', 'consent_required', 'adherence_alert')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  is_read BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. FAMILY MEDICAL RECORDS
-- ============================================

-- Family medical conditions
CREATE TABLE IF NOT EXISTS family_medical_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  condition_name TEXT NOT NULL,
  condition_code TEXT, -- ICD-10
  diagnosed_date DATE,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  is_chronic BOOLEAN DEFAULT FALSE,
  treatment_status TEXT CHECK (treatment_status IN ('active', 'monitoring', 'resolved', 'inactive')),
  notes TEXT,
  is_visible_to_family BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family allergies
CREATE TABLE IF NOT EXISTS family_allergies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  allergen TEXT NOT NULL,
  allergen_type TEXT CHECK (allergen_type IN ('medication', 'food', 'environmental', 'contact')) NOT NULL,
  reaction_description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')) NOT NULL,
  diagnosed_date DATE,
  treatment_notes TEXT,
  is_critical BOOLEAN DEFAULT FALSE,
  is_visible_to_family BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);;