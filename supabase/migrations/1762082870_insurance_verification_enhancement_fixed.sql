-- Migration: insurance_verification_enhancement_fixed
-- Created at: 1762082870

-- Insurance Verification Enhancement Migration
-- Adds Egyptian insurance providers, copay structures, and claims management

-- ============================================
-- 1. POPULATE EGYPTIAN INSURANCE PROVIDERS
-- ============================================

INSERT INTO insurance_providers (name, name_ar, provider_code, provider_type, contact_phone, contact_email, api_endpoint, coverage_details) VALUES
('Misr Insurance Company', 'شركة مصر للتأمين', 'EG01', 'government', '+20-2-2791-8000', 'info@misr-insurance.gov.eg', 'https://api.misr-insurance.gov.eg', '{
  "medication_coverage": "95%",
  "copay_rules": {"medications": 20, "specialty": 25, "generic": 15},
  "deductible": 1000,
  "max_annual": 50000,
  "prior_auth_required": ["biologics", "immunotherapy", "oncology"],
  "coverage_areas": ["cairo", "alexandria", "giza", "luxor", "aswan"],
  "provider_network": "national"
}'),
('Suez Canal Insurance', 'قناة السويس للتأمين', 'EG02', 'private', '+20-64-334-7700', 'contact@suezcanal-insurance.gov.eg', 'https://api.suezcanal-insurance.gov.eg', '{
  "medication_coverage": "90%",
  "copay_rules": {"medications": 15, "specialty": 20, "generic": 10},
  "deductible": 800,
  "max_annual": 45000,
  "prior_auth_required": ["specialty_drugs", "expensive_medications"],
  "coverage_areas": ["port_said", "suez", "cairo", "alexandria"],
  "provider_network": "regional"
}'),
('Wathaq Insurance', 'وثاق للتأمين', 'EG03', 'corporate', '+20-2-2274-5500', 'info@wathaq-insurance.com', 'https://api.wathaq-insurance.com', '{
  "medication_coverage": "85%",
  "copay_rules": {"medications": 25, "specialty": 30, "generic": 20},
  "deductible": 1200,
  "max_annual": 60000,
  "prior_auth_required": ["experimental", "non_formulary"],
  "coverage_areas": ["all_governorates"],
  "provider_network": "national"
}'),
('Egyptian Medical Insurance', 'المصرية للتأمين الطبي', 'EG04', 'private', '+20-2-2574-9900', 'service@egyptian-medical.com', 'https://api.egyptian-medical.com', '{
  "medication_coverage": "80%",
  "copay_rules": {"medications": 30, "specialty": 35, "generic": 25},
  "deductible": 1500,
  "max_annual": 70000,
  "prior_auth_required": ["oncology", "specialty_drugs", "biologics"],
  "coverage_areas": ["cairo", "alexandria", "giza", "sharqia", "dakahlia"],
  "provider_network": "private_network"
}'),
('Taawun Insurance', 'التوفيق للتأمين', 'EG05', 'private', '+20-2-2258-4400', 'support@taawun-insurance.gov.eg', 'https://api.taawun-insurance.gov.eg', '{
  "medication_coverage": "88%",
  "copay_rules": {"medications": 18, "specialty": 23, "generic": 13},
  "deductible": 900,
  "max_annual": 48000,
  "prior_auth_required": ["specialty_medications"],
  "coverage_areas": ["cairo", "alexandria", "giza", "qalyubia", "monufia"],
  "provider_network": "national"
}'),
('Pharaonic Insurance', 'الفرعونية للتأمين', 'EG06', 'corporate', '+20-2-2262-1100', 'info@pharaonic-insurance.gov.eg', 'https://api.pharaonic-insurance.gov.eg', '{
  "medication_coverage": "92%",
  "copay_rules": {"medications": 22, "specialty": 27, "generic": 17},
  "deductible": 1100,
  "max_annual": 55000,
  "prior_auth_required": ["experimental_drugs", "high_cost_specialty"],
  "coverage_areas": ["upper_egypt", "cairo", "alexandria"],
  "provider_network": "cultural_heritage"
}'),
('Misr-Sichuan Insurance', 'شركة مصر、四川 للتأمين', 'EG07', 'international', '+20-2-2415-7700', 'international@misr-sichuan.gov.eg', 'https://api.misr-sichuan.gov.eg', '{
  "medication_coverage": "75%",
  "copay_rules": {"medications": 35, "specialty": 40, "generic": 30},
  "deductible": 2000,
  "max_annual": 80000,
  "prior_auth_required": ["growth_hormone", "insulin_analog", "biologics"],
  "coverage_areas": ["all_governorates", "international_travel"],
  "provider_network": "international"
}'),
('Egyptian Union of Insurance Companies', 'اتحاد شركات التأمين المصرية', 'EG08', 'government', '+20-2-2275-3300', 'support@ecu-insurance.gov.eg', 'https://api.ecu-insurance.gov.eg', '{
  "medication_coverage": "96%",
  "copay_rules": {"medications": 12, "specialty": 18, "generic": 8},
  "deductible": 700,
  "max_annual": 40000,
  "prior_auth_required": ["minimal_restrictions"],
  "coverage_areas": ["all_governorates"],
  "provider_network": "union_network"
}'),
('Egyptian Takaful Company', 'شركة التكافل المصرية', 'EG09', 'corporate', '+20-2-2735-5500', 'care@egyptian-takaful.com', 'https://api.egyptian-takaful.com', '{
  "medication_coverage": "87%",
  "copay_rules": {"medications": 28, "specialty": 33, "generic": 23},
  "deductible": 1300,
  "max_annual": 65000,
  "prior_auth_required": ["controlled_substances", "opioids", "specialty"],
  "coverage_areas": ["cairo", "alexandria", "giza", "fayoum", "beni_suef"],
  "provider_network": "islamic_finance"
}'),
('Cairo Insurance Company', 'القاهرة للتأمين', 'EG10', 'private', '+20-2-2791-6000', 'service@cairo-insurance.gov.eg', 'https://api.cairo-insurance.gov.eg', '{
  "medication_coverage": "90%",
  "copay_rules": {"medications": 20, "specialty": 25, "generic": 15},
  "deductible": 1000,
  "max_annual": 50000,
  "prior_auth_required": ["standard_restrictions"],
  "coverage_areas": ["cairo_governorate", "giza", "qalyubia"],
  "provider_network": "metro_cairol"
}');

-- ============================================
-- 2. INSURANCE CLAIMS MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_insurance_id UUID NOT NULL REFERENCES user_insurance(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  claim_number TEXT UNIQUE NOT NULL,
  claim_amount DECIMAL(10,2) NOT NULL,
  approved_amount DECIMAL(10,2),
  patient_responsibility DECIMAL(10,2),
  claim_status TEXT DEFAULT 'pending' CHECK (claim_status IN (
    'pending', 'processing', 'approved', 'partially_approved', 'rejected', 'cancelled'
  )),
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  processing_date TIMESTAMPTZ,
  approval_date TIMESTAMPTZ,
  rejection_reason TEXT,
  reviewer_notes TEXT,
  reimbursement_method TEXT CHECK (reimbursement_method IN (
    'direct_billing', 'reimbursement_check', 'bank_transfer', 'pharmacy_credit'
  )),
  supporting_documents TEXT[],
  prior_authorization_required BOOLEAN DEFAULT FALSE,
  prior_authorization_number TEXT,
  processed_by TEXT,
  appeal_submitted BOOLEAN DEFAULT FALSE,
  appeal_date TIMESTAMPTZ,
  final_decision TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claims processing history
CREATE TABLE IF NOT EXISTS insurance_claims_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES insurance_claims(id) ON DELETE CASCADE,
  status_from TEXT,
  status_to TEXT NOT NULL,
  changed_by TEXT,
  change_reason TEXT,
  notes TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. COVERAGE PLANS AND STRUCTURES
-- ============================================

CREATE TABLE IF NOT EXISTS insurance_coverage_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES insurance_providers(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  plan_name_ar TEXT NOT NULL,
  plan_type TEXT CHECK (plan_type IN ('basic', 'standard', 'premium', 'family', 'senior')),
  medication_coverage_percentage INTEGER CHECK (medication_coverage_percentage BETWEEN 50 AND 100),
  generic_medication_coverage INTEGER DEFAULT 90,
  brand_medication_coverage INTEGER DEFAULT 80,
  specialty_medication_coverage INTEGER DEFAULT 60,
  deductible_amount DECIMAL(10,2) DEFAULT 0,
  max_annual_benefit DECIMAL(10,2),
  copay_structure JSONB,
  formulary_tier JSONB,
  restrictions TEXT[],
  monthly_premium DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  effective_date DATE,
  termination_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced formulary system
CREATE TABLE IF NOT EXISTS insurance_formulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES insurance_providers(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  medication_name_ar TEXT,
  generic_name TEXT,
  brand_name TEXT,
  therapeutic_class TEXT,
  tier_level INTEGER DEFAULT 1 CHECK (tier_level BETWEEN 1 AND 5),
  requires_prior_auth BOOLEAN DEFAULT FALSE,
  step_therapy_required BOOLEAN DEFAULT FALSE,
  quantity_limit INTEGER,
  quantity_limit_period TEXT,
  copay_amount DECIMAL(10,2),
  coinsurance_percentage INTEGER,
  special_instructions TEXT,
  alternative_medications TEXT[],
  is_covered BOOLEAN DEFAULT TRUE,
  coverage_start_date DATE DEFAULT CURRENT_DATE,
  coverage_end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. PRIOR AUTHORIZATION SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS insurance_prior_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_insurance_id UUID NOT NULL REFERENCES user_insurance(id) ON DELETE CASCADE,
  claim_id UUID REFERENCES insurance_claims(id),
  medication_name TEXT NOT NULL,
  medication_name_ar TEXT,
  indication TEXT,
  requested_quantity INTEGER,
  duration_days INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'under_review', 'approved', 'denied', 'expired', 'cancelled'
  )),
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  decision_date TIMESTAMPTZ,
  decision_made_by TEXT,
  decision_reason TEXT,
  approval_number TEXT UNIQUE,
  expiration_date DATE,
  reviewer_notes TEXT,
  clinical_criteria_met BOOLEAN,
  supporting_documentation TEXT[],
  appeals_allowed BOOLEAN DEFAULT TRUE,
  appeals_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. REAL-TIME VERIFICATION LOGS
-- ============================================

ALTER TABLE insurance_verifications ADD COLUMN IF NOT EXISTS verification_reference TEXT;
ALTER TABLE insurance_verifications ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;
ALTER TABLE insurance_verifications ADD COLUMN IF NOT EXISTS api_endpoint_used TEXT;
ALTER TABLE insurance_verifications ADD COLUMN IF NOT EXISTS fallback_used BOOLEAN DEFAULT FALSE;

-- ============================================
-- 6. COPAY CALCULATION ENGINE
-- ============================================

CREATE TABLE IF NOT EXISTS insurance_copay_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_insurance_id UUID NOT NULL REFERENCES user_insurance(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  verification_id UUID REFERENCES insurance_verifications(id),
  total_order_amount DECIMAL(10,2) NOT NULL,
  deductible_applied DECIMAL(10,2) DEFAULT 0,
  copay_percentage_applied DECIMAL(5,2),
  insurance_coverage DECIMAL(10,2) NOT NULL,
  patient_responsibility DECIMAL(10,2) NOT NULL,
  medication_breakdown JSONB,
  calculation_details JSONB,
  calculation_timestamp TIMESTAMPTZ DEFAULT NOW(),
  is_final BOOLEAN DEFAULT FALSE,
  calculated_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. PERFORMANCE INDEXES
-- ============================================

-- Claims indexes
CREATE INDEX IF NOT EXISTS idx_insurance_claims_user ON insurance_claims(user_insurance_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_order ON insurance_claims(order_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_number ON insurance_claims(claim_number);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_date ON insurance_claims(submission_date);

-- Coverage plans indexes
CREATE INDEX IF NOT EXISTS idx_coverage_plans_provider ON insurance_coverage_plans(provider_id);
CREATE INDEX IF NOT EXISTS idx_coverage_plans_type ON insurance_coverage_plans(plan_type);
CREATE INDEX IF NOT EXISTS idx_coverage_plans_active ON insurance_coverage_plans(is_active);

-- Formulary indexes
CREATE INDEX IF NOT EXISTS idx_formulary_provider ON insurance_formulary(provider_id);
CREATE INDEX IF NOT EXISTS idx_formulary_medication ON insurance_formulary(medication_name);
CREATE INDEX IF NOT EXISTS idx_formulary_tier ON insurance_formulary(tier_level);
CREATE INDEX IF NOT EXISTS idx_formulary_coverage ON insurance_formulary(is_covered);

-- Prior auth indexes
CREATE INDEX IF NOT EXISTS idx_prior_auth_user ON insurance_prior_authorizations(user_insurance_id);
CREATE INDEX IF NOT EXISTS idx_prior_auth_status ON insurance_prior_authorizations(status);
CREATE INDEX IF NOT EXISTS idx_prior_auth_claim ON insurance_prior_authorizations(claim_id);

-- Copay calculations indexes
CREATE INDEX IF NOT EXISTS idx_copay_calculations_user ON insurance_copay_calculations(user_insurance_id);
CREATE INDEX IF NOT EXISTS idx_copay_calculations_order ON insurance_copay_calculations(order_id);
CREATE INDEX IF NOT EXISTS idx_copay_calculations_timestamp ON insurance_copay_calculations(calculation_timestamp);

-- Claims history indexes
CREATE INDEX IF NOT EXISTS idx_claims_history_claim ON insurance_claims_history(claim_id);
CREATE INDEX IF NOT EXISTS idx_claims_history_date ON insurance_claims_history(changed_at);

-- ============================================
-- 8. SAMPLE DATA - COVERAGE PLANS
-- ============================================

INSERT INTO insurance_coverage_plans (provider_id, plan_name, plan_name_ar, plan_type, medication_coverage_percentage, generic_medication_coverage, brand_medication_coverage, specialty_medication_coverage, deductible_amount, max_annual_benefit, copay_structure, monthly_premium, is_active, effective_date) 
SELECT 
  ip.id,
  CASE ip.provider_code
    WHEN 'EG01' THEN 'Basic Coverage'
    WHEN 'EG02' THEN 'Standard Plan'
    WHEN 'EG03' THEN 'Premium Care'
    WHEN 'EG04' THEN 'Medical Plus'
    WHEN 'EG05' THEN 'Family Plan'
    WHEN 'EG06' THEN 'Corporate Basic'
    WHEN 'EG07' THEN 'International Care'
    WHEN 'EG08' THEN 'Union Standard'
    WHEN 'EG09' THEN 'Takaful Care'
    WHEN 'EG10' THEN 'Cairo Plus'
  END,
  CASE ip.provider_code
    WHEN 'EG01' THEN 'التغطية الأساسية'
    WHEN 'EG02' THEN 'الخطة القياسية'
    WHEN 'EG03' THEN 'الرعاية المتميزة'
    WHEN 'EG04' THEN 'الطبي بلس'
    WHEN 'EG05' THEN 'خطة الأسرة'
    WHEN 'EG06' THEN 'الأساسي للشركات'
    WHEN 'EG07' THEN 'الرعاية الدولية'
    WHEN 'EG08' THEN 'القيادية النقابية'
    WHEN 'EG09' THEN 'رعاية التكافل'
    WHEN 'EG10' THEN 'القاهرة بلس'
  END,
  CASE 
    WHEN ip.provider_code IN ('EG01', 'EG06') THEN 'basic'
    WHEN ip.provider_code IN ('EG02', 'EG05', 'EG08', 'EG10') THEN 'standard'
    WHEN ip.provider_code IN ('EG03', 'EG04') THEN 'premium'
    WHEN ip.provider_code IN ('EG07') THEN 'family'
    WHEN ip.provider_code IN ('EG09') THEN 'senior'
  END,
  CASE 
    WHEN ip.provider_code = 'EG08' THEN 96 -- ECU highest coverage
    WHEN ip.provider_code = 'EG01' THEN 95
    WHEN ip.provider_code = 'EG02' THEN 90
    WHEN ip.provider_code = 'EG06' THEN 92
    WHEN ip.provider_code = 'EG05' THEN 88
    WHEN ip.provider_code = 'EG09' THEN 87
    WHEN ip.provider_code = 'EG03' THEN 85
    WHEN ip.provider_code = 'EG04' THEN 80
    WHEN ip.provider_code = 'EG07' THEN 75
    ELSE 80
  END,
  CASE ip.provider_code
    WHEN 'EG08' THEN 98
    WHEN 'EG01' THEN 95
    WHEN 'EG02' THEN 92
    WHEN 'EG06' THEN 94
    WHEN 'EG05' THEN 90
    WHEN 'EG09' THEN 89
    WHEN 'EG03' THEN 88
    WHEN 'EG04' THEN 85
    WHEN 'EG07' THEN 82
    ELSE 85
  END,
  CASE ip.provider_code
    WHEN 'EG08' THEN 95
    WHEN 'EG01' THEN 92
    WHEN 'EG02' THEN 88
    WHEN 'EG06' THEN 90
    WHEN 'EG05' THEN 85
    WHEN 'EG09' THEN 84
    WHEN 'EG03' THEN 82
    WHEN 'EG04' THEN 78
    WHEN 'EG07' THEN 72
    ELSE 80
  END,
  CASE ip.provider_code
    WHEN 'EG08' THEN 85
    WHEN 'EG01' THEN 80
    WHEN 'EG02' THEN 75
    WHEN 'EG06' THEN 78
    WHEN 'EG05' THEN 72
    WHEN 'EG09' THEN 70
    WHEN 'EG03' THEN 68
    WHEN 'EG04' THEN 65
    WHEN 'EG07' THEN 60
    ELSE 70
  END,
  CASE ip.provider_code
    WHEN 'EG08' THEN 700.00
    WHEN 'EG02' THEN 800.00
    WHEN 'EG05' THEN 900.00
    WHEN 'EG01' THEN 1000.00
    WHEN 'EG10' THEN 1000.00
    WHEN 'EG06' THEN 1100.00
    WHEN 'EG09' THEN 1300.00
    WHEN 'EG03' THEN 1200.00
    WHEN 'EG04' THEN 1500.00
    WHEN 'EG07' THEN 2000.00
    ELSE 1000.00
  END,
  CASE ip.provider_code
    WHEN 'EG07' THEN 80000.00
    WHEN 'EG09' THEN 65000.00
    WHEN 'EG03' THEN 60000.00
    WHEN 'EG04' THEN 70000.00
    WHEN 'EG06' THEN 55000.00
    WHEN 'EG01' THEN 50000.00
    WHEN 'EG10' THEN 50000.00
    WHEN 'EG05' THEN 48000.00
    WHEN 'EG02' THEN 45000.00
    WHEN 'EG08' THEN 40000.00
    ELSE 50000.00
  END,
  jsonb_build_object(
    'tier1', CASE 
      WHEN ip.provider_code = 'EG08' THEN 5
      WHEN ip.provider_code IN ('EG01', 'EG02', 'EG05', 'EG10') THEN 10
      WHEN ip.provider_code IN ('EG06', 'EG03') THEN 15
      WHEN ip.provider_code IN ('EG09', 'EG04') THEN 20
      WHEN ip.provider_code = 'EG07' THEN 25
      ELSE 15
    END,
    'tier2', CASE 
      WHEN ip.provider_code = 'EG08' THEN 10
      WHEN ip.provider_code IN ('EG01', 'EG02') THEN 15
      WHEN ip.provider_code IN ('EG05', 'EG06') THEN 20
      WHEN ip.provider_code IN ('EG10', 'EG03') THEN 25
      WHEN ip.provider_code IN ('EG09', 'EG04') THEN 30
      WHEN ip.provider_code = 'EG07' THEN 35
      ELSE 20
    END,
    'tier3', CASE 
      WHEN ip.provider_code IN ('EG08') THEN 15
      WHEN ip.provider_code IN ('EG01', 'EG02') THEN 20
      WHEN ip.provider_code IN ('EG05', 'EG06') THEN 25
      WHEN ip.provider_code IN ('EG10', 'EG03') THEN 30
      WHEN ip.provider_code IN ('EG09', 'EG04') THEN 35
      WHEN ip.provider_code = 'EG07' THEN 40
      ELSE 25
    END
  ),
  CASE ip.provider_code
    WHEN 'EG08' THEN 150.00
    WHEN 'EG01' THEN 120.00
    WHEN 'EG02' THEN 110.00
    WHEN 'EG05' THEN 105.00
    WHEN 'EG06' THEN 115.00
    WHEN 'EG10' THEN 125.00
    WHEN 'EG03' THEN 135.00
    WHEN 'EG09' THEN 140.00
    WHEN 'EG04' THEN 145.00
    WHEN 'EG07' THEN 160.00
    ELSE 120.00
  END,
  true,
  '2024-01-01'
FROM insurance_providers ip
WHERE ip.provider_code LIKE 'EG%';

-- ============================================
-- 9. SAMPLE FORMULARY DATA
-- ============================================

INSERT INTO insurance_formulary (provider_id, medication_name, medication_name_ar, generic_name, therapeutic_class, tier_level, requires_prior_auth, copay_amount, is_covered)
SELECT 
  ip.id,
  med.name,
  med.name_ar,
  med.generic_name,
  med.therapeutic_class,
  CASE 
    WHEN med.category = 'generic' THEN 1
    WHEN med.category = 'preferred_brand' THEN 2
    WHEN med.category = 'non_preferred_brand' THEN 3
    WHEN med.category = 'specialty' THEN 4
    ELSE 2
  END,
  CASE 
    WHEN med.price > 1000 THEN true
    WHEN med.therapeutic_class IN ('oncology', 'immunology', 'endocrinology') THEN true
    ELSE false
  END,
  CASE 
    WHEN ip.provider_code = 'EG08' THEN 5.00
    WHEN ip.provider_code IN ('EG01', 'EG02', 'EG05', 'EG10') THEN 10.00
    WHEN ip.provider_code IN ('EG06', 'EG03') THEN 15.00
    WHEN ip.provider_code IN ('EG09', 'EG04') THEN 20.00
    WHEN ip.provider_code = 'EG07' THEN 25.00
    ELSE 15.00
  END,
  true
FROM insurance_providers ip
CROSS JOIN (
  VALUES 
    ('Paracetamol', 'باراسيتامول', 'paracetamol', 'analgesic', 'generic', 450.00),
    ('Ibuprofen', 'إيبوبروفين', 'ibuprofen', 'nsaid', 'generic', 320.00),
    ('Amoxicillin', 'أموكسيسيللين', 'amoxicillin', 'antibiotic', 'generic', 180.00),
    ('Omeprazole', 'أوميبرازول', 'omeprazole', 'ppi', 'generic', 220.00),
    ('Atorvastatin', 'أتورفاستاتين', 'atorvastatin', 'statin', 'preferred_brand', 890.00),
    ('Lisinopril', 'ليسينوبريل', 'lisinopril', 'ace_inhibitor', 'generic', 160.00),
    ('Metformin', 'ميتفورمين', 'metformin', 'antidiabetic', 'generic', 280.00),
    ('Amlodipine', 'أملوديبين', 'amlodipine', 'calcium_channel_blocker', 'generic', 190.00),
    ('Sertraline', 'سيرترالين', 'sertraline', 'ssri', 'generic', 340.00),
    ('Prednisone', 'بريدنيزون', 'prednisone', 'corticosteroid', 'generic', 120.00)
) AS med(name, name_ar, generic_name, therapeutic_class, category, price)
WHERE ip.provider_code LIKE 'EG%'
  AND random() < 0.8;

-- ============================================
-- 10. TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_insurance_claims_updated_at BEFORE UPDATE ON insurance_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prior_authorizations_updated_at BEFORE UPDATE ON insurance_prior_authorizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_formulary_updated_at BEFORE UPDATE ON insurance_formulary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 11. STORED PROCEDURES
-- ============================================

CREATE OR REPLACE FUNCTION calculate_medication_copay(
  p_provider_code TEXT,
  p_medication_tier INTEGER,
  p_medication_price DECIMAL(10,2),
  p_plan_type TEXT DEFAULT 'standard'
) RETURNS DECIMAL(10,2) AS $$
DECLARE
  copay_percentage DECIMAL(5,2);
  copay_amount DECIMAL(10,2);
  min_copay DECIMAL(10,2) := 5.00;
  max_copay DECIMAL(10,2) := 50.00;
BEGIN
  SELECT cp.copay_structure->>'tier' || p_medication_tier INTO copay_amount
  FROM insurance_coverage_plans cp
  JOIN insurance_providers ip ON cp.provider_id = ip.id
  WHERE ip.provider_code = p_provider_code
    AND cp.plan_type = p_plan_type
    AND cp.is_active = true
  LIMIT 1;
  
  IF copay_amount IS NOT NULL THEN
    RETURN GREATEST(LEAST(copay_amount, max_copay), min_copay);
  END IF;
  
  copay_percentage := CASE 
    WHEN p_medication_tier = 1 THEN 10.0
    WHEN p_medication_tier = 2 THEN 20.0
    WHEN p_medication_tier = 3 THEN 30.0
    WHEN p_medication_tier = 4 THEN 40.0
    ELSE 25.0
  END;
  
  RETURN GREATEST(LEAST(p_medication_price * (copay_percentage / 100), max_copay), min_copay);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Enable RLS on new tables
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_coverage_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_formulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_prior_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_copay_calculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own insurance claims" ON insurance_claims
  FOR SELECT USING (user_insurance_id IN (
    SELECT id FROM user_insurance WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view coverage plans for their providers" ON insurance_coverage_plans
  FOR SELECT USING (provider_id IN (
    SELECT provider_id FROM user_insurance WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view formulary for their providers" ON insurance_formulary
  FOR SELECT USING (provider_id IN (
    SELECT provider_id FROM user_insurance WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own prior authorizations" ON insurance_prior_authorizations
  FOR SELECT USING (user_insurance_id IN (
    SELECT id FROM user_insurance WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their own copay calculations" ON insurance_copay_calculations
  FOR SELECT USING (user_insurance_id IN (
    SELECT id FROM user_insurance WHERE user_id = auth.uid()
  ));;