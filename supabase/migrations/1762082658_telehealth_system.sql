-- Migration: telehealth_system
-- Created at: 1762082658

-- Telehealth Consultation System Database Schema
-- Created: 2025-11-02

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
);

-- Consultations Table
CREATE TABLE IF NOT EXISTS consultations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES healthcare_professionals(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  consultation_type VARCHAR(20) NOT NULL DEFAULT 'video' CHECK (consultation_type IN ('video', 'voice', 'chat')),
  reason TEXT,
  symptoms TEXT,
  diagnosis TEXT,
  prescription TEXT,
  notes TEXT,
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_intent_id VARCHAR(255),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  recording_url TEXT,
  recording_duration_seconds INTEGER,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Consultation Messages Table
CREATE TABLE IF NOT EXISTS consultation_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('patient', 'professional', 'system')),
  message_text TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'prescription')),
  file_url TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Professional Availability Table
CREATE TABLE IF NOT EXISTS professional_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID REFERENCES healthcare_professionals(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  booking_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(professional_id, date, start_time)
);

-- Consultation Feedback Table
CREATE TABLE IF NOT EXISTS consultation_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  professional_id UUID REFERENCES healthcare_professionals(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  overall_satisfaction INTEGER CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
  comments TEXT,
  would_recommend BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(consultation_id, user_id)
);

-- Session Recordings Table
CREATE TABLE IF NOT EXISTS session_recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE NOT NULL,
  recording_url TEXT NOT NULL,
  recording_metadata JSONB DEFAULT '{}',
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  recording_started_at TIMESTAMP WITH TIME ZONE,
  recording_ended_at TIMESTAMP WITH TIME ZONE,
  encryption_key TEXT,
  is_encrypted BOOLEAN DEFAULT true,
  retention_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Telehealth Settings Table
CREATE TABLE IF NOT EXISTS telehealth_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  consultation_reminders BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  auto_record_sessions BOOLEAN DEFAULT false,
  preferred_language VARCHAR(5) DEFAULT 'ar',
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  medical_history_access BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_professional_id ON consultations(professional_id);
CREATE INDEX IF NOT EXISTS idx_consultations_scheduled_at ON consultations(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_professional_availability_professional_date ON professional_availability(professional_id, date);
CREATE INDEX IF NOT EXISTS idx_messages_consultation_id ON consultation_messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_feedback_professional_id ON consultation_feedback(professional_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_healthcare_professionals_updated_at BEFORE UPDATE ON healthcare_professionals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_telehealth_settings_updated_at BEFORE UPDATE ON telehealth_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE healthcare_professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE telehealth_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Healthcare Professionals
CREATE POLICY "Healthcare professionals are viewable by everyone" ON healthcare_professionals FOR SELECT USING (is_active = true);
CREATE POLICY "Users can view their own profile" ON healthcare_professionals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Healthcare professionals can update their own profile" ON healthcare_professionals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Healthcare professionals can insert their own profile" ON healthcare_professionals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Consultations
CREATE POLICY "Users can view their own consultations" ON consultations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own consultations" ON consultations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own consultations" ON consultations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Healthcare professionals can view their consultations" ON consultations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM healthcare_professionals 
    WHERE healthcare_professionals.id = consultations.professional_id 
    AND healthcare_professionals.user_id = auth.uid()
  )
);

-- RLS Policies for Messages
CREATE POLICY "Users can view messages from their consultations" ON consultation_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM consultations 
    WHERE consultations.id = consultation_messages.consultation_id 
    AND consultations.user_id = auth.uid()
  )
);
CREATE POLICY "Healthcare professionals can view messages from their consultations" ON consultation_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM consultations c
    JOIN healthcare_professionals hp ON c.professional_id = hp.id
    WHERE c.id = consultation_messages.consultation_id 
    AND hp.user_id = auth.uid()
  )
);
CREATE POLICY "Users can create messages for their consultations" ON consultation_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM consultations 
    WHERE consultations.id = consultation_messages.consultation_id 
    AND consultations.user_id = auth.uid()
  )
);
CREATE POLICY "Healthcare professionals can create messages for their consultations" ON consultation_messages FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM consultations c
    JOIN healthcare_professionals hp ON c.professional_id = hp.id
    WHERE c.id = consultation_messages.consultation_id 
    AND hp.user_id = auth.uid()
  )
);

-- RLS Policies for Availability
CREATE POLICY "Availability is viewable by everyone" ON professional_availability FOR SELECT USING (true);
CREATE POLICY "Healthcare professionals can manage their own availability" ON professional_availability FOR ALL USING (
  EXISTS (
    SELECT 1 FROM healthcare_professionals 
    WHERE healthcare_professionals.id = professional_availability.professional_id 
    AND healthcare_professionals.user_id = auth.uid()
  )
);

-- RLS Policies for Feedback
CREATE POLICY "Users can view their own feedback" ON consultation_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own feedback" ON consultation_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Professionals can view feedback for their consultations" ON consultation_feedback FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM healthcare_professionals 
    WHERE healthcare_professionals.id = consultation_feedback.professional_id 
    AND healthcare_professionals.user_id = auth.uid()
  )
);

-- RLS Policies for Recordings
CREATE POLICY "Users can view recordings of their consultations" ON session_recordings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM consultations 
    WHERE consultations.id = session_recordings.consultation_id 
    AND consultations.user_id = auth.uid()
  )
);
CREATE POLICY "Healthcare professionals can view recordings of their consultations" ON session_recordings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM consultations c
    JOIN healthcare_professionals hp ON c.professional_id = hp.id
    WHERE c.id = session_recordings.consultation_id 
    AND hp.user_id = auth.uid()
  )
);

-- RLS Policies for Settings
CREATE POLICY "Users can manage their own settings" ON telehealth_settings FOR ALL USING (auth.uid() = user_id);

-- Insert sample healthcare professionals
INSERT INTO healthcare_professionals (
  user_id, full_name, specialization, license_number, phone, email, 
  hourly_rate, rating, bio, years_experience, education, certifications, is_verified, is_active
) VALUES 
(
  '00000000-0000-0000-0000-000000000001'::uuid,
  'د. أحمد محمد علي',
  'صيدلي مرخص',
  'PHARM001234',
  '+201234567890',
  'ahmed.pharm@chefaa.com',
  150.00,
  4.8,
  'صيدلي مرخص مع خبرة 15 عاماً في الاستشارات الدوائية والعلاجية',
  15,
  ARRAY['بكالوريوس صيدلة - جامعة القاهرة 2009', 'ماجستير صيدلة سريرية - جامعة عين شمس 2012'],
  ARRAY['شهادة صيدلي مرخص - وزارة الصحة المصرية', 'شهادة الاستشارات الصيدلانية - الكلية المصرية للصيدلة'],
  true,
  true
),
(
  '00000000-0000-0000-0000-000000000002'::uuid,
  'د. فاطمة حسن أحمد',
  'صيدلي إكلينيكي',
  'PHARM005678',
  '+201987654321',
  'fatima.clinical@chefaa.com',
  200.00,
  4.9,
  'صيدلي إكلينيكي متخصصة في الطب الباطني والأمراض المزمنة',
  12,
  ARRAY['بكالوريوس صيدلة - جامعة الإسكندرية 2013', 'دبلوم طب باطني - المعهد القومي للبحوث 2016'],
  ARRAY['شهادة الصيدلة الإكلينيكية - نقابة الصيدلة المصرية', 'شهادة إدارة الأمراض المزمنة'],
  true,
  true
),
(
  '00000000-0000-0000-0000-000000000003'::uuid,
  'د. محمد سعد الدين',
  'طبيب عام',
  'MD001890',
  '+201556677889',
  'mohamed.general@chefaa.com',
  300.00,
  4.7,
  'طبيب عام مع تخصص في طب الأسرة والأمراض الشائعة',
  18,
  ARRAY['بكالوريوس طب وجراحة - جامعة القاهرة 2007', 'ماجستير طب العائلة - جامعة الأزهر 2010'],
  ARRAY['رخصة مزاولة الطب - وزارة الصحة المصرية', 'شهادة طب الأسرة المعتمد'],
  true,
  true
);

-- Insert sample professional availability
INSERT INTO professional_availability (professional_id, date, start_time, end_time, is_available)
SELECT 
  hp.id,
  '2025-11-03'::date,
  '09:00'::time,
  '17:00'::time,
  true
FROM healthcare_professionals hp
LIMIT 3;

-- Update the next day
INSERT INTO professional_availability (professional_id, date, start_time, end_time, is_available)
SELECT 
  hp.id,
  '2025-11-04'::date,
  '09:00'::time,
  '17:00'::time,
  true
FROM healthcare_professionals hp
LIMIT 3;

-- Insert telehealth settings for sample users
INSERT INTO telehealth_settings (user_id) VALUES 
('00000000-0000-0000-0000-000000000001'::uuid),
('00000000-0000-0000-0000-000000000002'::uuid),
('00000000-0000-0000-0000-000000000003'::uuid);

-- Create function to check professional availability
CREATE OR REPLACE FUNCTION check_professional_availability(
  p_professional_id UUID,
  p_scheduled_at TIMESTAMP WITH TIME ZONE,
  p_duration_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  requested_start_time TIME;
  requested_end_time TIME;
  overlapping_count INTEGER;
BEGIN
  requested_start_time := (p_scheduled_at AT TIME ZONE 'UTC')::time;
  requested_end_time := (p_scheduled_at AT TIME ZONE 'UTC' + (p_duration_minutes || ' minutes')::interval)::time;
  
  SELECT COUNT(*) INTO overlapping_count
  FROM consultations c
  WHERE c.professional_id = p_professional_id
    AND c.status IN ('scheduled', 'in_progress')
    AND (
      (p_scheduled_at >= c.scheduled_at 
       AND p_scheduled_at < c.scheduled_at + (c.duration_minutes || ' minutes')::interval)
      OR 
      (p_scheduled_at + (p_duration_minutes || ' minutes')::interval > c.scheduled_at 
       AND p_scheduled_at < c.scheduled_at + (c.duration_minutes || ' minutes')::interval)
      OR
      (p_scheduled_at <= c.scheduled_at 
       AND p_scheduled_at + (p_duration_minutes || ' minutes')::interval >= c.scheduled_at + (c.duration_minutes || ' minutes')::interval)
    );
  
  RETURN overlapping_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;;