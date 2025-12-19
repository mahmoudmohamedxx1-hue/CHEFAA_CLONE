-- Migration: comprehensive_family_accounts
-- Created at: 1762082611

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
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Family Members
CREATE INDEX IF NOT EXISTS idx_family_members_primary_active ON family_members(primary_user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_family_members_age_category ON family_members(age_category);
CREATE INDEX IF NOT EXISTS idx_family_members_emergency ON family_members(emergency_contact) WHERE emergency_contact = true;

-- Emergency Contacts
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_member ON emergency_contacts(family_member_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_primary ON emergency_contacts(family_member_id, primary_contact) WHERE primary_contact = true;

-- Medication Management
CREATE INDEX IF NOT EXISTS idx_medication_schedules_due ON medication_schedules(next_due_at, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_medication_adherence_schedule ON medication_adherence(medication_schedule_id, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_medication_adherence_member ON medication_adherence(id, status);

-- Parental Consents
CREATE INDEX IF NOT EXISTS idx_parental_consents_member ON parental_consents(family_member_id);
CREATE INDEX IF NOT EXISTS idx_parental_consents_status ON parental_consents(consent_status);
CREATE INDEX IF NOT EXISTS idx_consent_audit_member ON consent_audit_log(family_member_id);

-- Family Permissions
CREATE INDEX IF NOT EXISTS idx_family_permissions_member ON family_permissions(family_member_id, is_active);
CREATE INDEX IF NOT EXISTS idx_family_permissions_type ON family_permissions(permission_type);

-- Shared Carts
CREATE INDEX IF NOT EXISTS idx_family_shared_carts_member ON family_shared_carts(family_member_id);
CREATE INDEX IF NOT EXISTS idx_family_shared_carts_reorder ON family_shared_carts(auto_reorder, next_reorder_date) WHERE auto_reorder = true;

-- Notifications
CREATE INDEX IF NOT EXISTS idx_family_notifications_user ON family_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_family_notifications_scheduled ON family_notifications(scheduled_for, sent_at) WHERE sent_at IS NULL;

-- Medical Records
CREATE INDEX IF NOT EXISTS idx_family_medical_conditions_member ON family_medical_conditions(family_member_id);
CREATE INDEX IF NOT EXISTS idx_family_allergies_member ON family_allergies(family_member_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all family tables
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_adherence ENABLE ROW LEVEL SECURITY;
ALTER TABLE parental_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_shared_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_cart_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_medical_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_allergies ENABLE ROW LEVEL SECURITY;

-- Family Members: Only primary user and authorized family members can access
CREATE POLICY "family_members_select_policy" ON family_members
  FOR SELECT USING (
    primary_user_id = auth.uid() OR 
    member_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.primary_user_id = auth.uid() 
      AND fm.id = family_members.id
    )
  );

CREATE POLICY "family_members_insert_policy" ON family_members
  FOR INSERT WITH CHECK (primary_user_id = auth.uid());

CREATE POLICY "family_members_update_policy" ON family_members
  FOR UPDATE USING (primary_user_id = auth.uid());

-- Emergency Contacts: Only primary user can manage
CREATE POLICY "emergency_contacts_policy" ON emergency_contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.id = emergency_contacts.family_member_id 
      AND fm.primary_user_id = auth.uid()
    )
  );

-- Medication Schedules: Primary user and family members with permission
CREATE POLICY "medication_schedules_policy" ON medication_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.id = medication_schedules.family_member_id 
      AND fm.primary_user_id = auth.uid()
    )
  );

-- Medication Adherence: Primary user can view all, family member can insert own
CREATE POLICY "medication_adherence_select_policy" ON medication_adherence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      JOIN medication_schedules ms ON ms.family_member_id = fm.id
      WHERE ms.id = medication_adherence.medication_schedule_id
      AND fm.primary_user_id = auth.uid()
    )
  );

CREATE POLICY "medication_adherence_insert_policy" ON medication_adherence
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members fm 
      JOIN medication_schedules ms ON ms.family_member_id = fm.id
      WHERE ms.id = medication_adherence.medication_schedule_id
      AND (fm.primary_user_id = auth.uid() OR fm.member_user_id = auth.uid())
    )
  );

-- Parental Consents: Only parents/guardians can manage
CREATE POLICY "parental_consents_policy" ON parental_consents
  FOR ALL USING (parent_guardian_id = auth.uid());

-- Consent Audit Log: Only parents/guardians can view
CREATE POLICY "consent_audit_policy" ON consent_audit_log
  FOR SELECT USING (parent_guardian_id = auth.uid());

-- Family Permissions: Primary user can manage
CREATE POLICY "family_permissions_policy" ON family_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.id = family_permissions.family_member_id 
      AND fm.primary_user_id = auth.uid()
    )
  );

-- Shared Carts: Family members can access
CREATE POLICY "family_shared_carts_policy" ON family_shared_carts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.id = family_shared_carts.family_member_id 
      AND fm.primary_user_id = auth.uid()
    )
  );

-- Shared Cart Permissions: Primary user can manage
CREATE POLICY "shared_cart_permissions_policy" ON shared_cart_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.id = shared_cart_permissions.family_member_id 
      AND fm.primary_user_id = auth.uid()
    )
  );

-- Notifications: User can view their notifications
CREATE POLICY "family_notifications_policy" ON family_notifications
  FOR ALL USING (user_id = auth.uid());

-- Medical Records: Family members can view if permitted
CREATE POLICY "family_medical_conditions_policy" ON family_medical_conditions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.id = family_medical_conditions.family_member_id 
      AND fm.primary_user_id = auth.uid()
    )
  );

CREATE POLICY "family_allergies_policy" ON family_allergies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.id = family_allergies.family_member_id 
      AND (fm.primary_user_id = auth.uid() OR fm.is_visible_to_family = true)
    )
  );;