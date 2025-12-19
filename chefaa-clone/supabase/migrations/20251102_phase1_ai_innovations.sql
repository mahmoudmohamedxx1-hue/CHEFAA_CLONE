-- Phase 1: World-Class AI Innovations for Pharmaceutical E-commerce
-- AI-Powered Clinical Safety Co-Pilot & Computer Vision Pill Identification

-- =====================================================
-- 1. DRUG INTERACTIONS DATABASE
-- =====================================================

-- Advanced drug interactions table with detailed metadata
CREATE TABLE IF NOT EXISTS drug_interactions_advanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_a_name TEXT NOT NULL,
    drug_a_rxnorm_code TEXT,
    drug_b_name TEXT NOT NULL,
    drug_b_rxnorm_code TEXT,
    interaction_type TEXT NOT NULL, -- major, moderate, minor
    severity_score INTEGER CHECK (severity_score BETWEEN 1 AND 10),
    clinical_effects TEXT,
    mechanism TEXT,
    management_strategy TEXT,
    evidence_level TEXT, -- high, moderate, low
    source_references TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast drug pair lookups
CREATE INDEX idx_drug_interactions_drugs ON drug_interactions_advanced(drug_a_name, drug_b_name);
CREATE INDEX idx_drug_interactions_severity ON drug_interactions_advanced(severity_score DESC);

-- =====================================================
-- 2. SAFETY ANALYSIS RESULTS
-- =====================================================

-- Store AI-powered safety analysis results
CREATE TABLE IF NOT EXISTS safety_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    medication_list JSONB NOT NULL, -- Array of medication objects
    analysis_results JSONB NOT NULL, -- Detailed analysis with interactions, warnings, scores
    overall_risk_score INTEGER CHECK (overall_risk_score BETWEEN 0 AND 100),
    risk_level TEXT CHECK (risk_level IN ('safe', 'caution', 'warning', 'danger')),
    recommendations TEXT[],
    alternative_suggestions JSONB,
    analysis_duration_ms INTEGER,
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast user and order lookups
CREATE INDEX idx_safety_analysis_user ON safety_analysis(user_id, analyzed_at DESC);
CREATE INDEX idx_safety_analysis_order ON safety_analysis(order_id);
CREATE INDEX idx_safety_analysis_risk ON safety_analysis(risk_level, analyzed_at DESC);

-- =====================================================
-- 3. PILL IDENTIFICATION DATABASE
-- =====================================================

-- Comprehensive pill database for computer vision identification
CREATE TABLE IF NOT EXISTS pill_database (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_name TEXT NOT NULL,
    ndc_code TEXT, -- National Drug Code
    rxnorm_code TEXT,
    imprint TEXT, -- Text/numbers on pill
    color TEXT,
    shape TEXT, -- round, oval, capsule, etc.
    size_mm DECIMAL(5,2),
    image_url TEXT NOT NULL,
    image_hash TEXT, -- For visual similarity search
    manufacturer TEXT,
    dosage TEXT,
    active_ingredients TEXT[],
    description TEXT,
    is_prescription BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast pill lookups
CREATE INDEX idx_pill_database_name ON pill_database(medication_name);
CREATE INDEX idx_pill_database_imprint ON pill_database(imprint);
CREATE INDEX idx_pill_database_color_shape ON pill_database(color, shape);
CREATE INDEX idx_pill_database_hash ON pill_database(image_hash);

-- Full-text search index for medication names
CREATE INDEX idx_pill_database_name_search ON pill_database USING gin(to_tsvector('english', medication_name));

-- =====================================================
-- 4. PILL VERIFICATION SESSIONS
-- =====================================================

-- Audit trail for pill verification activities
CREATE TABLE IF NOT EXISTS verification_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_hash TEXT,
    identified_pill_id UUID REFERENCES pill_database(id) ON DELETE SET NULL,
    confidence_score DECIMAL(5,2) CHECK (confidence_score BETWEEN 0 AND 100),
    matches JSONB, -- Array of potential matches with scores
    verification_status TEXT CHECK (verification_status IN ('identified', 'uncertain', 'not_found', 'manual_review')),
    prescription_match BOOLEAN,
    user_confirmed BOOLEAN DEFAULT false,
    verification_duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics and user history
CREATE INDEX idx_verification_sessions_user ON verification_sessions(user_id, created_at DESC);
CREATE INDEX idx_verification_sessions_pill ON verification_sessions(identified_pill_id);
CREATE INDEX idx_verification_sessions_status ON verification_sessions(verification_status);

-- =====================================================
-- 5. USER GENETIC MARKERS (Optional Enhancement)
-- =====================================================

-- Store user genetic markers for personalized drug response prediction
CREATE TABLE IF NOT EXISTS user_genetic_markers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    marker_type TEXT NOT NULL, -- CYP2D6, CYP2C19, etc.
    marker_value TEXT,
    implications JSONB, -- Drug metabolism implications
    source TEXT, -- genetic_test, self_reported
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure one marker type per user
CREATE UNIQUE INDEX idx_user_genetic_markers_unique ON user_genetic_markers(user_id, marker_type);

-- =====================================================
-- 6. MEDICATION SAFETY ALERTS
-- =====================================================

-- Track and manage safety alerts for users
CREATE TABLE IF NOT EXISTS medication_safety_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL, -- interaction, allergy, contraindication, dosage
    severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
    medication_names TEXT[],
    alert_message TEXT NOT NULL,
    recommendation TEXT,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for active alerts
CREATE INDEX idx_medication_safety_alerts_user ON medication_safety_alerts(user_id, acknowledged, created_at DESC);
CREATE INDEX idx_medication_safety_alerts_severity ON medication_safety_alerts(severity, acknowledged);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE drug_interactions_advanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pill_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_genetic_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_safety_alerts ENABLE ROW LEVEL SECURITY;

-- Drug interactions: Public read access (for safety checking)
CREATE POLICY "Public read drug interactions" ON drug_interactions_advanced
    FOR SELECT USING (true);

-- Safety analysis: Users can only see their own analyses
CREATE POLICY "Users view own safety analyses" ON safety_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own safety analyses" ON safety_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

-- Pill database: Public read access (for identification)
CREATE POLICY "Public read pill database" ON pill_database
    FOR SELECT USING (true);

-- Verification sessions: Users can only see their own sessions
CREATE POLICY "Users view own verification sessions" ON verification_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own verification sessions" ON verification_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

-- Genetic markers: Users can only see and manage their own markers
CREATE POLICY "Users view own genetic markers" ON user_genetic_markers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own genetic markers" ON user_genetic_markers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own genetic markers" ON user_genetic_markers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own genetic markers" ON user_genetic_markers
    FOR DELETE USING (auth.uid() = user_id);

-- Safety alerts: Users can only see their own alerts
CREATE POLICY "Users view own safety alerts" ON medication_safety_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own safety alerts" ON medication_safety_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Insert safety alerts via edge function" ON medication_safety_alerts
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get drug interactions for a list of medications
CREATE OR REPLACE FUNCTION get_drug_interactions(medication_names TEXT[])
RETURNS TABLE (
    drug_a TEXT,
    drug_b TEXT,
    interaction_type TEXT,
    severity_score INTEGER,
    clinical_effects TEXT,
    management_strategy TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dia.drug_a_name,
        dia.drug_b_name,
        dia.interaction_type,
        dia.severity_score,
        dia.clinical_effects,
        dia.management_strategy
    FROM drug_interactions_advanced dia
    WHERE 
        (dia.drug_a_name = ANY(medication_names) AND dia.drug_b_name = ANY(medication_names))
        OR (dia.drug_b_name = ANY(medication_names) AND dia.drug_a_name = ANY(medication_names))
    ORDER BY dia.severity_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to search pills by characteristics
CREATE OR REPLACE FUNCTION search_pills(
    p_imprint TEXT DEFAULT NULL,
    p_color TEXT DEFAULT NULL,
    p_shape TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    medication_name TEXT,
    imprint TEXT,
    color TEXT,
    shape TEXT,
    image_url TEXT,
    confidence_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pd.id,
        pd.medication_name,
        pd.imprint,
        pd.color,
        pd.shape,
        pd.image_url,
        CASE
            WHEN pd.imprint = p_imprint AND pd.color = p_color AND pd.shape = p_shape THEN 100.0
            WHEN pd.imprint = p_imprint AND pd.color = p_color THEN 85.0
            WHEN pd.imprint = p_imprint AND pd.shape = p_shape THEN 80.0
            WHEN pd.color = p_color AND pd.shape = p_shape THEN 70.0
            WHEN pd.imprint = p_imprint THEN 75.0
            WHEN pd.color = p_color THEN 50.0
            WHEN pd.shape = p_shape THEN 45.0
            ELSE 30.0
        END AS confidence_score
    FROM pill_database pd
    WHERE 
        (p_imprint IS NULL OR pd.imprint ILIKE '%' || p_imprint || '%')
        OR (p_color IS NULL OR pd.color ILIKE '%' || p_color || '%')
        OR (p_shape IS NULL OR pd.shape ILIKE '%' || p_shape || '%')
    ORDER BY confidence_score DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA: Sample Drug Interactions
-- =====================================================

INSERT INTO drug_interactions_advanced (drug_a_name, drug_b_name, interaction_type, severity_score, clinical_effects, mechanism, management_strategy, evidence_level) VALUES
    ('Warfarin', 'Aspirin', 'major', 9, 'Increased risk of bleeding', 'Both affect blood clotting mechanisms', 'Monitor INR closely, consider alternative pain reliever', 'high'),
    ('Lisinopril', 'Potassium Supplements', 'major', 8, 'Hyperkalemia (high potassium)', 'Both increase potassium levels', 'Monitor potassium levels, reduce supplement dosage', 'high'),
    ('Metformin', 'Alcohol', 'moderate', 6, 'Risk of lactic acidosis', 'Alcohol affects lactate metabolism', 'Limit alcohol consumption, monitor symptoms', 'moderate'),
    ('Omeprazole', 'Clopidogrel', 'major', 8, 'Reduced antiplatelet effect', 'Omeprazole inhibits CYP2C19 enzyme', 'Use alternative PPI like pantoprazole', 'high'),
    ('Simvastatin', 'Grapefruit Juice', 'major', 7, 'Increased statin levels, muscle toxicity risk', 'Grapefruit inhibits CYP3A4 enzyme', 'Avoid grapefruit, use alternative statin', 'high'),
    ('Levothyroxine', 'Calcium Carbonate', 'moderate', 5, 'Reduced thyroid hormone absorption', 'Calcium binds to levothyroxine', 'Take medications 4 hours apart', 'moderate'),
    ('Fluoxetine', 'Tramadol', 'major', 8, 'Serotonin syndrome risk', 'Both increase serotonin levels', 'Monitor for symptoms, consider alternative pain reliever', 'high'),
    ('Digoxin', 'Amiodarone', 'major', 9, 'Digoxin toxicity', 'Amiodarone increases digoxin levels', 'Reduce digoxin dose by 50%, monitor levels', 'high'),
    ('Methotrexate', 'Ibuprofen', 'moderate', 6, 'Increased methotrexate toxicity', 'NSAIDs reduce methotrexate clearance', 'Monitor methotrexate levels, use acetaminophen instead', 'moderate'),
    ('Ciprofloxacin', 'Theophylline', 'moderate', 7, 'Increased theophylline levels', 'Ciprofloxacin inhibits theophylline metabolism', 'Monitor theophylline levels, reduce dose if needed', 'moderate');

-- =====================================================
-- SEED DATA: Sample Pill Database
-- =====================================================

INSERT INTO pill_database (medication_name, imprint, color, shape, size_mm, image_url, manufacturer, dosage, active_ingredients, description, is_prescription) VALUES
    ('Panadol Extra', 'P EXTRA', 'White', 'Capsule', 18.5, '/images/pills/panadol-extra.jpg', 'GSK', '500mg Paracetamol + 65mg Caffeine', ARRAY['Paracetamol', 'Caffeine'], 'Extra strength pain relief with caffeine boost', false),
    ('Aspirin 100mg', 'BAYER', 'White', 'Round', 8.0, '/images/pills/aspirin-100.jpg', 'Bayer', '100mg', ARRAY['Acetylsalicylic Acid'], 'Low-dose aspirin for cardiovascular protection', false),
    ('Lisinopril 10mg', 'L 10', 'Pink', 'Round', 7.0, '/images/pills/lisinopril-10.jpg', 'Generic', '10mg', ARRAY['Lisinopril'], 'ACE inhibitor for blood pressure control', true),
    ('Metformin 500mg', 'M 500', 'White', 'Oval', 13.0, '/images/pills/metformin-500.jpg', 'Generic', '500mg', ARRAY['Metformin HCl'], 'Diabetes medication', true),
    ('Omeprazole 20mg', 'OM 20', 'Purple', 'Capsule', 19.0, '/images/pills/omeprazole-20.jpg', 'Generic', '20mg', ARRAY['Omeprazole'], 'Proton pump inhibitor for acid reflux', true),
    ('Simvastatin 20mg', 'S 20', 'Beige', 'Oval', 9.5, '/images/pills/simvastatin-20.jpg', 'Generic', '20mg', ARRAY['Simvastatin'], 'Statin for cholesterol management', true),
    ('Levothyroxine 50mcg', 'L 50', 'White', 'Round', 6.0, '/images/pills/levothyroxine-50.jpg', 'Generic', '50mcg', ARRAY['Levothyroxine Sodium'], 'Thyroid hormone replacement', true),
    ('Vitamin D3 1000 IU', 'VD3', 'Yellow', 'Capsule', 15.0, '/images/pills/vitamin-d3.jpg', 'Nature Made', '1000 IU', ARRAY['Cholecalciferol'], 'Vitamin D supplement', false),
    ('Calcium Carbonate 500mg', 'CAL 500', 'White', 'Oval', 16.0, '/images/pills/calcium-500.jpg', 'Generic', '500mg', ARRAY['Calcium Carbonate'], 'Calcium supplement', false),
    ('Ibuprofen 400mg', 'I 400', 'Orange', 'Round', 10.0, '/images/pills/ibuprofen-400.jpg', 'Generic', '400mg', ARRAY['Ibuprofen'], 'NSAID pain reliever and anti-inflammatory', false);

-- Migration complete
-- Next steps: Deploy edge functions (ai-safety-analysis, pill-identification)
