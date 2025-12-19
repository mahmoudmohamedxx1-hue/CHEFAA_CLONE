-- Migration: family_accounts_indexes_rls
-- Created at: 1762082662

-- Family Accounts Indexes and RLS Policies

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
DROP POLICY IF EXISTS "family_members_select_policy" ON family_members;
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

DROP POLICY IF EXISTS "family_members_insert_policy" ON family_members;
CREATE POLICY "family_members_insert_policy" ON family_members
  FOR INSERT WITH CHECK (primary_user_id = auth.uid());

DROP POLICY IF EXISTS "family_members_update_policy" ON family_members;
CREATE POLICY "family_members_update_policy" ON family_members
  FOR UPDATE USING (primary_user_id = auth.uid());

-- Emergency Contacts: Only primary user can manage
DROP POLICY IF EXISTS "emergency_contacts_policy" ON emergency_contacts;
CREATE POLICY "emergency_contacts_policy" ON emergency_contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.id = emergency_contacts.family_member_id 
      AND fm.primary_user_id = auth.uid()
    )
  );

-- Medication Schedules: Primary user and family members with permission
DROP POLICY IF EXISTS "medication_schedules_policy" ON medication_schedules;
CREATE POLICY "medication_schedules_policy" ON medication_schedules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.id = medication_schedules.family_member_id 
      AND fm.primary_user_id = auth.uid()
    )
  );

-- Medication Adherence: Primary user can view all, family member can insert own
DROP POLICY IF EXISTS "medication_adherence_select_policy" ON medication_adherence;
CREATE POLICY "medication_adherence_select_policy" ON medication_adherence
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      JOIN medication_schedules ms ON ms.family_member_id = fm.id
      WHERE ms.id = medication_adherence.medication_schedule_id
      AND fm.primary_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "medication_adherence_insert_policy" ON medication_adherence;
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
DROP POLICY IF EXISTS "parental_consents_policy" ON parental_consents;
CREATE POLICY "parental_consents_policy" ON parental_consents
  FOR ALL USING (parent_guardian_id = auth.uid());

-- Consent Audit Log: Only parents/guardians can view
DROP POLICY IF EXISTS "consent_audit_policy" ON consent_audit_log;
CREATE POLICY "consent_audit_policy" ON consent_audit_log
  FOR SELECT USING (parent_guardian_id = auth.uid());

-- Family Permissions: Primary user can manage
DROP POLICY IF EXISTS "family_permissions_policy" ON family_permissions;
CREATE POLICY "family_permissions_policy" ON family_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.id = family_permissions.family_member_id 
      AND fm.primary_user_id = auth.uid()
    )
  );

-- Shared Carts: Family members can access
DROP POLICY IF EXISTS "family_shared_carts_policy" ON family_shared_carts;
CREATE POLICY "family_shared_carts_policy" ON family_shared_carts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.id = family_shared_carts.family_member_id 
      AND fm.primary_user_id = auth.uid()
    )
  );

-- Shared Cart Permissions: Primary user can manage
DROP POLICY IF EXISTS "shared_cart_permissions_policy" ON shared_cart_permissions;
CREATE POLICY "shared_cart_permissions_policy" ON shared_cart_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.id = shared_cart_permissions.family_member_id 
      AND fm.primary_user_id = auth.uid()
    )
  );

-- Notifications: User can view their notifications
DROP POLICY IF EXISTS "family_notifications_policy" ON family_notifications;
CREATE POLICY "family_notifications_policy" ON family_notifications
  FOR ALL USING (user_id = auth.uid());

-- Medical Records: Family members can view if permitted
DROP POLICY IF EXISTS "family_medical_conditions_policy" ON family_medical_conditions;
CREATE POLICY "family_medical_conditions_policy" ON family_medical_conditions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.id = family_medical_conditions.family_member_id 
      AND fm.primary_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "family_allergies_policy" ON family_allergies;
CREATE POLICY "family_allergies_policy" ON family_allergies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.id = family_allergies.family_member_id 
      AND fm.primary_user_id = auth.uid()
    )
  );;