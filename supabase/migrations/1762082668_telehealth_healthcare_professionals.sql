-- Migration: telehealth_healthcare_professionals
-- Created at: 1762082668

-- Healthcare Professionals Table
CREATE TABLE IF NOT EXISTS healthcare_professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  specialization VARCHAR(100) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  hourly_rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
  rating DECIMAL(3, 2) CHECK (rating >= 0 AND rating <= 5),
  bio TEXT,
  profile_image_url TEXT,
  years_experience INTEGER DEFAULT 0,
  education TEXT[],
  certifications TEXT[],
  languages TEXT[] DEFAULT ARRAY['ar', 'en'],
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  consultation_count INTEGER DEFAULT 0,
  availability JSONB DEFAULT '{
    "monday": {"start": "09:00", "end": "17:00"},
    "tuesday": {"start": "09:00", "end": "17:00"},
    "wednesday": {"start": "09:00", "end": "17:00"},
    "thursday": {"start": "09:00", "end": "17:00"},
    "friday": {"start": "09:00", "end": "17:00"},
    "saturday": {"start": "10:00", "end": "14:00"},
    "sunday": {"start": "10:00", "end": "14:00"}
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);;