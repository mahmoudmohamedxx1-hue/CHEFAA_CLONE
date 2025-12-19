-- Phase 4: Professional Services Integration Database Schema
-- Comprehensive healthcare services infrastructure

-- ============================================
-- 1. TELEHEALTH CONSULTATIONS
-- ============================================

-- Consultation types and settings
CREATE TABLE IF NOT EXISTS consultation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL, -- 15, 30, 60 minutes
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT FALSE,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('pharmacist', 'doctor', 'specialist')),
  requires_prescription BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Consultation bookings
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  consultation_type_id UUID REFERENCES consultation_types(id),
  provider_id UUID REFERENCES auth.users(id), -- pharmacist/doctor user
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'canceled', 'no_show')),
  consultation_mode TEXT DEFAULT 'video' CHECK (consultation_mode IN ('video', 'audio', 'chat')),
  meeting_link TEXT, -- Video call URL
  meeting_id TEXT, -- External meeting ID
  notes TEXT, -- Provider notes
  prescription_generated UUID REFERENCES prescription_verifications(id),
  patient_concerns TEXT, -- Patient's reason for consultation
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMPTZ,
  payment_amount DECIMAL(10,2),
  payment_status TEXT DEFAULT 'pending',
  recording_url TEXT, -- Secure recording storage
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider availability schedule
CREATE TABLE IF NOT EXISTS provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INSURANCE INTEGRATION
-- ============================================

-- Insurance providers database
CREATE TABLE IF NOT EXISTS insurance_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  provider_code TEXT UNIQUE NOT NULL,
  provider_type TEXT CHECK (provider_type IN ('private', 'government', 'corporate', 'international')),
  contact_phone TEXT,
  contact_email TEXT,
  api_endpoint TEXT, -- For real-time verification
  is_active BOOLEAN DEFAULT TRUE,
  coverage_details JSONB, -- Coverage rules and limits
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
  verified_by TEXT, -- API or manual
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. MEDICAL RECORDS SYSTEM
-- ============================================

-- Patient medical conditions
CREATE TABLE IF NOT EXISTS patient_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  condition_name TEXT NOT NULL,
  condition_code TEXT, -- ICD-10 code
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
  reaction TEXT, -- What happens when exposed
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening')),
  diagnosed_date DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medication history (encrypted)
CREATE TABLE IF NOT EXISTS medication_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT, -- e.g., "twice daily", "as needed"
  start_date DATE NOT NULL,
  end_date DATE,
  prescribed_by TEXT, -- Doctor name
  prescription_id UUID REFERENCES prescription_verifications(id),
  order_id UUID REFERENCES orders(id),
  purpose TEXT, -- Why prescribed
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
  ordered_by TEXT, -- Doctor name
  document_url TEXT, -- PDF/image of results
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. FAMILY ACCOUNTS
-- ============================================

-- Family account relationships
CREATE TABLE IF NOT EXISTS family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id UUID NOT NULL REFERENCES auth.users(id), -- Primary account holder
  member_user_id UUID REFERENCES auth.users(id), -- If member has own account
  first_name TEXT NOT NULL,
  last_name TEXT,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  relationship TEXT CHECK (relationship IN ('self', 'spouse', 'child', 'parent', 'sibling', 'other')),
  national_id TEXT, -- For identification
  has_separate_account BOOLEAN DEFAULT FALSE,
  consent_given BOOLEAN DEFAULT FALSE, -- For minors
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
  frequency TEXT NOT NULL, -- e.g., "8:00, 20:00"
  schedule_times TIME[], -- Array of times
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
  prescription_id UUID NOT NULL REFERENCES prescription_verifications(id),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. PHARMACY NETWORK
-- ============================================

-- Partner pharmacies
CREATE TABLE IF NOT EXISTS partner_pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  location GEOGRAPHY(POINT), -- GPS coordinates
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  operating_hours JSONB, -- {monday: {open: "08:00", close: "22:00"}, ...}
  is_24_hours BOOLEAN DEFAULT FALSE,
  delivery_enabled BOOLEAN DEFAULT TRUE,
  accepts_insurance BOOLEAN DEFAULT FALSE,
  quality_rating DECIMAL(3,2) DEFAULT 4.5,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacy inventory (real-time sync)
CREATE TABLE IF NOT EXISTS pharmacy_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES partner_pharmacies(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_available INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pharmacy_id, product_id)
);

-- Prescription fulfillment workflow
CREATE TABLE IF NOT EXISTS prescription_fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescription_verifications(id),
  order_id UUID REFERENCES orders(id),
  assigned_pharmacy_id UUID REFERENCES partner_pharmacies(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'preparing', 'ready', 'dispatched', 'delivered')),
  assigned_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  pharmacist_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. DELIVERY TRACKING
-- ============================================

-- Delivery drivers
CREATE TABLE IF NOT EXISTS delivery_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT CHECK (vehicle_type IN ('motorcycle', 'car', 'bicycle', 'van')),
  vehicle_number TEXT,
  license_number TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  current_location GEOGRAPHY(POINT),
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery assignments and tracking
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  driver_id UUID REFERENCES delivery_drivers(id),
  pharmacy_id UUID REFERENCES partner_pharmacies(id),
  delivery_type TEXT DEFAULT 'standard' CHECK (delivery_type IN ('express', 'standard', 'scheduled')),
  pickup_location GEOGRAPHY(POINT),
  delivery_location GEOGRAPHY(POINT),
  estimated_pickup_time TIMESTAMPTZ,
  estimated_delivery_time TIMESTAMPTZ,
  actual_pickup_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'assigned', 'driver_heading_to_pharmacy', 'picked_up', 
    'in_transit', 'arrived', 'delivered', 'failed', 'canceled'
  )),
  tracking_code TEXT UNIQUE,
  delivery_instructions TEXT,
  delivery_photo_url TEXT, -- Photo proof of delivery
  signature_url TEXT, -- Digital signature
  customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
  customer_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time delivery location tracking
CREATE TABLE IF NOT EXISTS delivery_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id),
  location GEOGRAPHY(POINT) NOT NULL,
  speed DECIMAL(5,2), -- km/h
  heading DECIMAL(5,2), -- degrees
  battery_level INTEGER, -- Driver's device battery
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery notifications
CREATE TABLE IF NOT EXISTS delivery_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'assigned', 'picked_up', 'in_transit', 'near_delivery', 'delivered', 'delayed'
  )),
  message TEXT NOT NULL,
  sent_via TEXT[] DEFAULT ARRAY['push'], -- push, sms, email
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Consultations
CREATE INDEX IF NOT EXISTS idx_consultations_user ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_provider ON consultations(provider_id);
CREATE INDEX IF NOT EXISTS idx_consultations_scheduled ON consultations(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);

-- Insurance
CREATE INDEX IF NOT EXISTS idx_user_insurance_user ON user_insurance(user_id);
CREATE INDEX IF NOT EXISTS idx_user_insurance_provider ON user_insurance(provider_id);
CREATE INDEX IF NOT EXISTS idx_insurance_verifications_order ON insurance_verifications(order_id);

-- Medical Records
CREATE INDEX IF NOT EXISTS idx_patient_conditions_user ON patient_conditions(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_user ON patient_allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_history_user ON medication_history(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_user ON lab_results(user_id);

-- Family Accounts
CREATE INDEX IF NOT EXISTS idx_family_members_primary ON family_members(primary_user_id);
CREATE INDEX IF NOT EXISTS idx_medication_schedules_member ON medication_schedules(family_member_id);

-- Pharmacy Network
CREATE INDEX IF NOT EXISTS idx_partner_pharmacies_location ON partner_pharmacies USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_pharmacy ON pharmacy_inventory(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_product ON pharmacy_inventory(product_id);

-- Delivery Tracking
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_delivery_location_delivery ON delivery_location_history(delivery_id);
