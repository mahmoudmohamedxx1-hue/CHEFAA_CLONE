-- Migration: phase4_part1_telehealth
-- Created at: 1762075527

-- Phase 4 Part 1: Telehealth Tables

-- Consultation types and settings
CREATE TABLE IF NOT EXISTS consultation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
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
  provider_id UUID REFERENCES auth.users(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'canceled', 'no_show')),
  consultation_mode TEXT DEFAULT 'video' CHECK (consultation_mode IN ('video', 'audio', 'chat')),
  meeting_link TEXT,
  meeting_id TEXT,
  notes TEXT,
  patient_concerns TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date TIMESTAMPTZ,
  payment_amount DECIMAL(10,2),
  payment_status TEXT DEFAULT 'pending',
  recording_url TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider availability schedule
CREATE TABLE IF NOT EXISTS provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consultations_user ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_provider ON consultations(provider_id);
CREATE INDEX IF NOT EXISTS idx_consultations_scheduled ON consultations(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
;