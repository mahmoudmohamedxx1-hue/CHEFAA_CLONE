-- Migration: telehealth_indexes_and_functions
-- Created at: 1762082698

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
$$ LANGUAGE plpgsql;;