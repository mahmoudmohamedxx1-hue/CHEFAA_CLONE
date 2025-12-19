-- Phase 3: AR Education & Clinical Trial Matching (TrialGPT)
-- Migration: 20251103_phase3_ar_education_clinical_trials.sql

-- ============================================================================
-- AR-Powered Patient Education Suite
-- ============================================================================

-- AR Content Library: 3D models, animations, and educational assets
CREATE TABLE IF NOT EXISTS ar_content_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type VARCHAR(50) NOT NULL, -- '3d_model', 'animation', 'tutorial', 'simulation'
  medication_id UUID, -- optional link to medication
  title VARCHAR(255) NOT NULL,
  description TEXT,
  asset_url TEXT NOT NULL, -- URL to 3D model or animation file
  thumbnail_url TEXT,
  molecular_formula TEXT, -- for molecular visualizations
  difficulty_level VARCHAR(20), -- 'beginner', 'intermediate', 'advanced'
  duration_minutes INTEGER,
  languages JSONB DEFAULT '["en", "ar"]'::jsonb,
  metadata JSONB, -- additional properties (file size, format, etc.)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Education Progress: Track learning completion and achievements
CREATE TABLE IF NOT EXISTS user_education_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES ar_content_library(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completion_status VARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
  time_spent_minutes INTEGER DEFAULT 0,
  quiz_score INTEGER, -- score on educational quiz (0-100)
  certificate_earned BOOLEAN DEFAULT false,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- Medication Tutorials: Step-by-step guides for drug administration
CREATE TABLE IF NOT EXISTS medication_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(100), -- 'inhaler', 'insulin_pen', 'injection', 'pill', 'patch'
  tutorial_type VARCHAR(50) NOT NULL, -- 'administration', 'storage', 'safety', 'side_effects'
  steps JSONB NOT NULL, -- array of step objects with text, images, AR markers
  ar_markers JSONB, -- AR tracking markers and 3D positions
  estimated_duration_minutes INTEGER,
  difficulty_level VARCHAR(20) DEFAULT 'beginner',
  safety_warnings TEXT[],
  common_mistakes TEXT[],
  tips TEXT[],
  video_url TEXT,
  interactive_ar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AR Session Analytics: Track AR feature usage
CREATE TABLE IF NOT EXISTS ar_session_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES ar_content_library(id),
  session_duration_seconds INTEGER NOT NULL,
  device_type VARCHAR(50), -- 'mobile', 'tablet', 'desktop', 'ar_headset'
  interactions_count INTEGER DEFAULT 0,
  completion_achieved BOOLEAN DEFAULT false,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AI-Driven Clinical Trial Matching (TrialGPT)
-- ============================================================================

-- Clinical Trials: Comprehensive trial database
CREATE TABLE IF NOT EXISTS clinical_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_identifier VARCHAR(100) UNIQUE NOT NULL, -- NCT number or similar
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  phase VARCHAR(20), -- 'Phase I', 'Phase II', 'Phase III', 'Phase IV'
  status VARCHAR(50) DEFAULT 'recruiting', -- 'recruiting', 'active', 'completed', 'suspended'
  condition TEXT NOT NULL, -- primary condition being studied
  conditions_list TEXT[], -- array of related conditions
  intervention_type VARCHAR(100), -- 'drug', 'device', 'behavioral', 'other'
  intervention_name VARCHAR(255),
  sponsor VARCHAR(255),
  locations JSONB, -- array of trial location objects
  eligibility_criteria JSONB NOT NULL, -- structured eligibility requirements
  inclusion_criteria TEXT[],
  exclusion_criteria TEXT[],
  age_minimum INTEGER,
  age_maximum INTEGER,
  gender VARCHAR(20), -- 'all', 'male', 'female'
  enrollment_count INTEGER,
  start_date DATE,
  completion_date DATE,
  primary_outcome TEXT,
  secondary_outcomes TEXT[],
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  trial_url TEXT,
  safety_info TEXT,
  compensation_available BOOLEAN DEFAULT false,
  compensation_details TEXT,
  matching_score_multiplier DECIMAL(3,2) DEFAULT 1.0, -- for prioritizing certain trials
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trial Matches: AI-powered patient-trial matching results
CREATE TABLE IF NOT EXISTS trial_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_id UUID NOT NULL REFERENCES clinical_trials(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_confidence VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
  matching_factors JSONB, -- reasons for match (condition, age, location, etc.)
  eligibility_assessment JSONB, -- detailed breakdown of eligibility
  recommended_priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  user_interest_level VARCHAR(20), -- 'not_interested', 'considering', 'very_interested'
  viewed_at TIMESTAMPTZ,
  bookmarked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, trial_id)
);

-- Trial Applications: Track patient applications to trials
CREATE TABLE IF NOT EXISTS trial_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_id UUID NOT NULL REFERENCES clinical_trials(id) ON DELETE CASCADE,
  match_id UUID REFERENCES trial_matches(id),
  application_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'under_review', 'accepted', 'rejected', 'withdrawn'
  application_data JSONB, -- user-provided information
  consent_given BOOLEAN DEFAULT false,
  consent_timestamp TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ,
  decision_reason TEXT,
  researcher_notes TEXT,
  preferred_location VARCHAR(255),
  availability_notes TEXT,
  medical_records_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trial Participant Experiences: Success stories and testimonials
CREATE TABLE IF NOT EXISTS trial_participant_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES clinical_trials(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  participant_name VARCHAR(100), -- optional, can be anonymous
  testimonial TEXT NOT NULL,
  experience_rating INTEGER CHECK (experience_rating >= 1 AND experience_rating <= 5),
  would_recommend BOOLEAN,
  participation_duration_months INTEGER,
  benefits_experienced TEXT[],
  challenges_faced TEXT[],
  advice_for_others TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Clinical Profile: Extended health information for trial matching
CREATE TABLE IF NOT EXISTS user_clinical_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  primary_conditions TEXT[],
  secondary_conditions TEXT[],
  previous_treatments TEXT[],
  current_medications TEXT[],
  allergies TEXT[],
  genetic_markers JSONB,
  lab_results JSONB,
  medical_history_summary TEXT,
  willing_to_travel BOOLEAN DEFAULT false,
  max_travel_distance_km INTEGER,
  preferred_locations TEXT[],
  available_days_per_week INTEGER,
  time_commitment_hours_per_week INTEGER,
  consent_for_matching BOOLEAN DEFAULT false,
  privacy_level VARCHAR(20) DEFAULT 'standard', -- 'minimal', 'standard', 'comprehensive'
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- AR Content Library Indexes
CREATE INDEX IF NOT EXISTS idx_ar_content_type ON ar_content_library(content_type);
CREATE INDEX IF NOT EXISTS idx_ar_content_medication ON ar_content_library(medication_id);
CREATE INDEX IF NOT EXISTS idx_ar_content_active ON ar_content_library(is_active);

-- User Education Progress Indexes
CREATE INDEX IF NOT EXISTS idx_education_progress_user ON user_education_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_education_progress_content ON user_education_progress(content_id);
CREATE INDEX IF NOT EXISTS idx_education_progress_status ON user_education_progress(completion_status);

-- Clinical Trials Indexes
CREATE INDEX IF NOT EXISTS idx_clinical_trials_status ON clinical_trials(status);
CREATE INDEX IF NOT EXISTS idx_clinical_trials_condition ON clinical_trials(condition);
CREATE INDEX IF NOT EXISTS idx_clinical_trials_phase ON clinical_trials(phase);
CREATE INDEX IF NOT EXISTS idx_clinical_trials_identifier ON clinical_trials(trial_identifier);

-- Trial Matches Indexes
CREATE INDEX IF NOT EXISTS idx_trial_matches_user ON trial_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_matches_trial ON trial_matches(trial_id);
CREATE INDEX IF NOT EXISTS idx_trial_matches_score ON trial_matches(match_score DESC);

-- Trial Applications Indexes
CREATE INDEX IF NOT EXISTS idx_trial_applications_user ON trial_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_applications_trial ON trial_applications(trial_id);
CREATE INDEX IF NOT EXISTS idx_trial_applications_status ON trial_applications(application_status);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE ar_content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_education_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_session_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_participant_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clinical_profile ENABLE ROW LEVEL SECURITY;

-- AR Content Library: Public read for active content
CREATE POLICY "Public can view active AR content"
  ON ar_content_library FOR SELECT
  USING (is_active = true);

-- User Education Progress: Users can only see their own progress
CREATE POLICY "Users can view own education progress"
  ON user_education_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own education progress"
  ON user_education_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own education progress"
  ON user_education_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Medication Tutorials: Public read
CREATE POLICY "Public can view medication tutorials"
  ON medication_tutorials FOR SELECT
  USING (true);

-- AR Session Analytics: Users can only manage their own sessions
CREATE POLICY "Users can insert own AR sessions"
  ON ar_session_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own AR sessions"
  ON ar_session_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- Clinical Trials: Public read for active trials
CREATE POLICY "Public can view active clinical trials"
  ON clinical_trials FOR SELECT
  USING (status IN ('recruiting', 'active'));

-- Trial Matches: Users can only see their own matches
CREATE POLICY "Users can view own trial matches"
  ON trial_matches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own trial matches"
  ON trial_matches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trial matches"
  ON trial_matches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trial Applications: Users can only manage their own applications
CREATE POLICY "Users can view own trial applications"
  ON trial_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trial applications"
  ON trial_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trial applications"
  ON trial_applications FOR UPDATE
  USING (auth.uid() = user_id);

-- Trial Participant Experiences: Public read for public testimonials
CREATE POLICY "Public can view public testimonials"
  ON trial_participant_experiences FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert own testimonials"
  ON trial_participant_experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Clinical Profile: Users can only manage their own profile
CREATE POLICY "Users can view own clinical profile"
  ON user_clinical_profile FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clinical profile"
  ON user_clinical_profile FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clinical profile"
  ON user_clinical_profile FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function: Get recommended AR content for user
CREATE OR REPLACE FUNCTION get_recommended_ar_content(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  content_id UUID,
  title VARCHAR,
  content_type VARCHAR,
  progress_percentage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ac.id,
    ac.title,
    ac.content_type,
    COALESCE(up.progress_percentage, 0) as progress_percentage
  FROM ar_content_library ac
  LEFT JOIN user_education_progress up ON ac.id = up.content_id AND up.user_id = p_user_id
  WHERE ac.is_active = true
  ORDER BY 
    CASE WHEN up.completion_status = 'in_progress' THEN 1
         WHEN up.completion_status IS NULL THEN 2
         ELSE 3 END,
    ac.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate trial match score
CREATE OR REPLACE FUNCTION calculate_trial_match_score(
  p_trial_id UUID,
  p_user_conditions TEXT[],
  p_user_age INTEGER,
  p_user_gender VARCHAR
)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_trial RECORD;
BEGIN
  SELECT * INTO v_trial FROM clinical_trials WHERE id = p_trial_id;
  
  -- Condition match (40 points)
  IF v_trial.condition = ANY(p_user_conditions) THEN
    v_score := v_score + 40;
  ELSIF v_trial.conditions_list && p_user_conditions THEN
    v_score := v_score + 25;
  END IF;
  
  -- Age eligibility (30 points)
  IF (v_trial.age_minimum IS NULL OR p_user_age >= v_trial.age_minimum) AND
     (v_trial.age_maximum IS NULL OR p_user_age <= v_trial.age_maximum) THEN
    v_score := v_score + 30;
  END IF;
  
  -- Gender eligibility (10 points)
  IF v_trial.gender = 'all' OR v_trial.gender = p_user_gender THEN
    v_score := v_score + 10;
  END IF;
  
  -- Trial status (20 points)
  IF v_trial.status = 'recruiting' THEN
    v_score := v_score + 20;
  ELSIF v_trial.status = 'active' THEN
    v_score := v_score + 10;
  END IF;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Seed Data
-- ============================================================================

-- Insert sample AR content
INSERT INTO ar_content_library (content_type, title, description, asset_url, thumbnail_url, difficulty_level, duration_minutes) VALUES
('3d_model', 'Aspirin Molecular Structure', 'Interactive 3D model of aspirin (acetylsalicylic acid) showing molecular bonds', '/ar/models/aspirin-3d.glb', '/ar/thumbnails/aspirin.jpg', 'beginner', 5),
('animation', 'How Blood Pressure Medication Works', 'Animated visualization of ACE inhibitor mechanism in blood vessels', '/ar/animations/ace-inhibitor.mp4', '/ar/thumbnails/bp-med.jpg', 'intermediate', 8),
('tutorial', 'Proper Inhaler Technique', 'Step-by-step AR guide for using a metered-dose inhaler', '/ar/tutorials/inhaler-guide.html', '/ar/thumbnails/inhaler.jpg', 'beginner', 10),
('simulation', 'Insulin Injection Sites', 'Interactive body map showing proper insulin injection rotation sites', '/ar/simulations/insulin-sites.html', '/ar/thumbnails/insulin.jpg', 'intermediate', 12),
('3d_model', 'Heart and Cardiovascular System', 'Detailed 3D model showing how cardiac medications affect the heart', '/ar/models/heart-system.glb', '/ar/thumbnails/heart.jpg', 'advanced', 15);

-- Insert sample medication tutorials
INSERT INTO medication_tutorials (medication_name, device_type, tutorial_type, steps, difficulty_level, estimated_duration_minutes) VALUES
('Albuterol', 'inhaler', 'administration', '[
  {"step": 1, "title": "Shake the inhaler", "description": "Shake the inhaler vigorously for 5 seconds"},
  {"step": 2, "title": "Breathe out fully", "description": "Exhale completely away from the inhaler"},
  {"step": 3, "title": "Position the inhaler", "description": "Place mouthpiece between your lips, forming a tight seal"},
  {"step": 4, "title": "Press and breathe in", "description": "Press down while breathing in slowly and deeply"},
  {"step": 5, "title": "Hold your breath", "description": "Hold breath for 10 seconds, then exhale slowly"}
]'::jsonb, 'beginner', 3),
('Insulin', 'insulin_pen', 'administration', '[
  {"step": 1, "title": "Prepare the pen", "description": "Attach a new needle and dial the dose"},
  {"step": 2, "title": "Prime the pen", "description": "Dial 2 units and press until insulin appears"},
  {"step": 3, "title": "Choose injection site", "description": "Select a site with adequate fat (abdomen, thigh, arm)"},
  {"step": 4, "title": "Clean the area", "description": "Wipe with alcohol swab and let dry"},
  {"step": 5, "title": "Inject insulin", "description": "Pinch skin, insert needle at 90 degrees, press button fully"},
  {"step": 6, "title": "Wait and remove", "description": "Count to 10, then remove needle and dispose safely"}
]'::jsonb, 'intermediate', 5);

-- Insert sample clinical trials
INSERT INTO clinical_trials (
  trial_identifier, title, description, phase, status, condition, conditions_list,
  intervention_type, intervention_name, sponsor, eligibility_criteria, 
  inclusion_criteria, exclusion_criteria, age_minimum, age_maximum, gender, enrollment_count,
  start_date, primary_outcome, contact_email
) VALUES
('NCT05789012', 'Novel Treatment for Type 2 Diabetes', 'Phase III study evaluating a new oral medication for Type 2 Diabetes management with improved efficacy and fewer side effects', 'Phase III', 'recruiting', 'Type 2 Diabetes', ARRAY['diabetes', 'metabolic syndrome'], 'drug', 'DM-2024', 'Global Pharma Research', '{"age": "30-75", "diagnosis": "Type 2 Diabetes", "a1c": ">7.0%"}'::jsonb, 
ARRAY['Diagnosed with Type 2 Diabetes for at least 1 year', 'HbA1c between 7.0% and 10.0%', 'BMI between 25 and 40'], 
ARRAY['Type 1 Diabetes', 'Pregnant or breastfeeding', 'Severe kidney disease'], 30, 75, 'all', 500, '2024-06-01', 'Change in HbA1c from baseline', 'trials@globalpharma.com'),

('NCT05890123', 'Breakthrough Alzheimer\'s Treatment Study', 'Phase II trial for novel immunotherapy targeting amyloid plaques in early-stage Alzheimer\'s disease', 'Phase II', 'recruiting', 'Alzheimer\'s Disease', ARRAY['alzheimers', 'dementia', 'cognitive decline'], 'drug', 'ALZ-IMMUNE-01', 'Neuroscience Institute', '{"age": "55-85", "diagnosis": "Early Alzheimer Disease", "mmse": "20-26"}'::jsonb,
ARRAY['Diagnosed with early-stage Alzheimer Disease', 'MMSE score between 20-26', 'Biomarker confirmation of amyloid pathology', 'Caregiver available for study visits'],
ARRAY['Other forms of dementia', 'History of stroke', 'Current immunosuppressive therapy'], 55, 85, 'all', 300, '2024-08-15', 'Cognitive function improvement measured by ADAS-Cog', 'alzheimer.study@neuro.org'),

('NCT05991234', 'Advanced Heart Failure Device Trial', 'Phase III study of next-generation implantable cardiac device for patients with advanced heart failure', 'Phase III', 'recruiting', 'Heart Failure', ARRAY['heart failure', 'cardiomyopathy', 'cardiac disease'], 'device', 'CardioFlow Pro', 'CardioTech Medical', '{"age": "40-80", "diagnosis": "Heart Failure NYHA Class III-IV", "ef": "<35%"}'::jsonb,
ARRAY['Heart failure NYHA Class III or IV', 'Ejection fraction <35%', 'Stable on optimal medical therapy for 3+ months'],
ARRAY['Recent heart attack (< 3 months)', 'Mechanical heart valve', 'Active infection'], 40, 80, 'all', 200, '2024-09-01', 'Quality of life improvement and reduction in hospitalizations', 'heartfailure@cardiotech.com'),

('NCT06012345', 'Cancer Immunotherapy Combination Study', 'Phase II trial combining novel checkpoint inhibitor with standard chemotherapy for advanced solid tumors', 'Phase II', 'recruiting', 'Advanced Cancer', ARRAY['cancer', 'solid tumor', 'metastatic cancer'], 'drug', 'Immuno-Plus-Chemo', 'Oncology Research Group', '{"age": "18-75", "diagnosis": "Advanced Solid Tumor", "performance": "ECOG 0-1"}'::jsonb,
ARRAY['Histologically confirmed advanced solid tumor', 'Failed at least one prior therapy', 'ECOG performance status 0-1', 'Adequate organ function'],
ARRAY['Brain metastases', 'Autoimmune disease', 'Prior immunotherapy within 6 months'], 18, 75, 'all', 150, '2024-10-01', 'Overall response rate and progression-free survival', 'oncology.trials@cancer.org'),

('NCT06123456', 'Chronic Pain Management Innovation', 'Phase III study of non-opioid pain management system for chronic lower back pain', 'Phase III', 'recruiting', 'Chronic Lower Back Pain', ARRAY['chronic pain', 'back pain', 'musculoskeletal pain'], 'device', 'NeuroStim Pain Relief', 'Pain Solutions Inc', '{"age": "25-70", "diagnosis": "Chronic Lower Back Pain", "duration": ">6 months"}'::jsonb,
ARRAY['Chronic lower back pain for 6+ months', 'Pain score VAS >5/10', 'Failed conservative treatment', 'No prior spinal surgery'],
ARRAY['Cancer-related pain', 'Spinal cord injury', 'Pregnancy', 'Implanted electronic devices'], 25, 70, 'all', 400, '2024-11-01', 'Pain reduction measured by VAS scale', 'pain.study@painsolutions.com');

-- Add 5 more diverse trials for comprehensive demo
INSERT INTO clinical_trials (
  trial_identifier, title, description, phase, status, condition, conditions_list,
  intervention_type, intervention_name, sponsor, eligibility_criteria, 
  inclusion_criteria, exclusion_criteria, age_minimum, age_maximum, gender, enrollment_count,
  start_date, primary_outcome, contact_email
) VALUES
('NCT06234567', 'Asthma Control Breakthrough', 'Phase II study of novel biologic therapy for severe asthma with improved control and reduced exacerbations', 'Phase II', 'recruiting', 'Severe Asthma', ARRAY['asthma', 'respiratory disease'], 'drug', 'BioAir-2024', 'Respiratory Research Center', '{"age": "18-65", "diagnosis": "Severe Asthma", "exacerbations": ">=2 per year"}'::jsonb,
ARRAY['Severe asthma diagnosis', '2+ exacerbations per year despite treatment', 'FEV1 <80% predicted'],
ARRAY['COPD', 'Smoking history >10 pack-years', 'Other lung diseases'], 18, 65, 'all', 250, '2024-12-01', 'Reduction in asthma exacerbations', 'asthma@respiratory.org'),

('NCT06345678', 'Rheumatoid Arthritis Remission Study', 'Phase III trial of combination therapy targeting multiple inflammatory pathways in RA', 'Phase III', 'recruiting', 'Rheumatoid Arthritis', ARRAY['arthritis', 'autoimmune disease', 'joint disease'], 'drug', 'RA-Triple-Therapy', 'Autoimmune Research Institute', '{"age": "18-70", "diagnosis": "Active RA", "duration": ">6 months"}'::jsonb,
ARRAY['Rheumatoid Arthritis for 6+ months', 'Active disease with DAS28 >3.2', 'Failed methotrexate therapy'],
ARRAY['Other autoimmune diseases', 'Recent infections', 'Hepatitis B or C'], 18, 70, 'all', 350, '2025-01-15', 'Achievement of DAS28 remission', 'ra.trials@autoimmune.org'),

('NCT06456789', 'Migraine Prevention Innovation', 'Phase II study of novel CGRP-targeted therapy with extended duration for migraine prevention', 'Phase II', 'recruiting', 'Chronic Migraine', ARRAY['migraine', 'headache disorder'], 'drug', 'MigraineBlock-XR', 'Headache Research Foundation', '{"age": "18-65", "diagnosis": "Chronic Migraine", "frequency": ">=15 days/month"}'::jsonb,
ARRAY['Chronic migraine (15+ headache days per month)', 'Failed 2+ preventive treatments', 'No medication overuse'],
ARRAY['Other primary headache disorders', 'Severe psychiatric illness', 'Recent head trauma'], 18, 65, 'all', 180, '2025-02-01', 'Reduction in monthly migraine days', 'migraine@headache.org');

COMMENT ON TABLE ar_content_library IS 'AR educational content including 3D models, animations, and interactive tutorials';
COMMENT ON TABLE clinical_trials IS 'Comprehensive clinical trial database for TrialGPT matching engine';
COMMENT ON TABLE trial_matches IS 'AI-powered patient-trial matching results with confidence scores';
COMMENT ON TABLE user_education_progress IS 'Tracking user progress through AR educational content';
