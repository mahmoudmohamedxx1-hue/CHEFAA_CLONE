-- Migration: phase1_ai_innovations
-- Created at: 1762095538

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
    interaction_type TEXT NOT NULL,
    severity_score INTEGER CHECK (severity_score BETWEEN 1 AND 10),
    clinical_effects TEXT,
    mechanism TEXT,
    management_strategy TEXT,
    evidence_level TEXT,
    references TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drug_interactions_drugs ON drug_interactions_advanced(drug_a_name, drug_b_name);
CREATE INDEX idx_drug_interactions_severity ON drug_interactions_advanced(severity_score DESC);

-- =====================================================
-- 2. SAFETY ANALYSIS RESULTS
-- =====================================================

CREATE TABLE IF NOT EXISTS safety_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    medication_list JSONB NOT NULL,
    analysis_results JSONB NOT NULL,
    overall_risk_score INTEGER CHECK (overall_risk_score BETWEEN 0 AND 100),
    risk_level TEXT CHECK (risk_level IN ('safe', 'caution', 'warning', 'danger')),
    recommendations TEXT[],
    alternative_suggestions JSONB,
    analysis_duration_ms INTEGER,
    analyzed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_safety_analysis_user ON safety_analysis(user_id, analyzed_at DESC);
CREATE INDEX idx_safety_analysis_order ON safety_analysis(order_id);
CREATE INDEX idx_safety_analysis_risk ON safety_analysis(risk_level, analyzed_at DESC);

-- =====================================================
-- 3. PILL IDENTIFICATION DATABASE
-- =====================================================

CREATE TABLE IF NOT EXISTS pill_database (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_name TEXT NOT NULL,
    ndc_code TEXT,
    rxnorm_code TEXT,
    imprint TEXT,
    color TEXT,
    shape TEXT,
    size_mm DECIMAL(5,2),
    image_url TEXT NOT NULL,
    image_hash TEXT,
    manufacturer TEXT,
    dosage TEXT,
    active_ingredients TEXT[],
    description TEXT,
    is_prescription BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pill_database_name ON pill_database(medication_name);
CREATE INDEX idx_pill_database_imprint ON pill_database(imprint);
CREATE INDEX idx_pill_database_color_shape ON pill_database(color, shape);
CREATE INDEX idx_pill_database_hash ON pill_database(image_hash);
CREATE INDEX idx_pill_database_name_search ON pill_database USING gin(to_tsvector('english', medication_name));

-- =====================================================
-- 4. PILL VERIFICATION SESSIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS verification_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_hash TEXT,
    identified_pill_id UUID REFERENCES pill_database(id) ON DELETE SET NULL,
    confidence_score DECIMAL(5,2) CHECK (confidence_score BETWEEN 0 AND 100),
    matches JSONB,
    verification_status TEXT CHECK (verification_status IN ('identified', 'uncertain', 'not_found', 'manual_review')),
    prescription_match BOOLEAN,
    user_confirmed BOOLEAN DEFAULT false,
    verification_duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_verification_sessions_user ON verification_sessions(user_id, created_at DESC);
CREATE INDEX idx_verification_sessions_pill ON verification_sessions(identified_pill_id);
CREATE INDEX idx_verification_sessions_status ON verification_sessions(verification_status);

-- =====================================================
-- 5. USER GENETIC MARKERS (Optional Enhancement)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_genetic_markers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    marker_type TEXT NOT NULL,
    marker_value TEXT,
    implications JSONB,
    source TEXT,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_user_genetic_markers_unique ON user_genetic_markers(user_id, marker_type);

-- =====================================================
-- 6. MEDICATION SAFETY ALERTS
-- =====================================================

CREATE TABLE IF NOT EXISTS medication_safety_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
    medication_names TEXT[],
    alert_message TEXT NOT NULL,
    recommendation TEXT,
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_medication_safety_alerts_user ON medication_safety_alerts(user_id, acknowledged, created_at DESC);
CREATE INDEX idx_medication_safety_alerts_severity ON medication_safety_alerts(severity, acknowledged);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE drug_interactions_advanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE pill_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_genetic_markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_safety_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read drug interactions" ON drug_interactions_advanced
    FOR SELECT USING (true);

CREATE POLICY "Users view own safety analyses" ON safety_analysis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own safety analyses" ON safety_analysis
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Public read pill database" ON pill_database
    FOR SELECT USING (true);

CREATE POLICY "Users view own verification sessions" ON verification_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own verification sessions" ON verification_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() IN ('anon', 'service_role'));

CREATE POLICY "Users view own genetic markers" ON user_genetic_markers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own genetic markers" ON user_genetic_markers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own genetic markers" ON user_genetic_markers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own genetic markers" ON user_genetic_markers
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users view own safety alerts" ON medication_safety_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own safety alerts" ON medication_safety_alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Insert safety alerts via edge function" ON medication_safety_alerts
    FOR INSERT WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

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
    ('Ibuprofen 400mg', 'I 400', 'Orange', 'Round', 10.0, '/images/pills/ibuprofen-400.jpg', 'Generic', '400mg', ARRAY['Ibuprofen'], 'NSAID pain reliever and anti-inflammatory', false);;