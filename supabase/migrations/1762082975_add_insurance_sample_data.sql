-- Migration: add_insurance_sample_data
-- Created at: 1762082975

-- Sample insurance data for Egyptian providers

-- Update existing provider to use proper details
UPDATE insurance_providers SET 
  name = 'Cairo Insurance Company',
  name_ar = 'القاهرة للتأمين',
  provider_code = 'EG10',
  provider_type = 'private',
  contact_phone = '+20-2-2791-6000',
  contact_email = 'service@cairo-insurance.gov.eg',
  api_endpoint = 'https://api.cairo-insurance.gov.eg',
  coverage_details = '{
    "medication_coverage": "90%",
    "copay_rules": {"medications": 20, "specialty": 25, "generic": 15},
    "deductible": 1000,
    "max_annual": 50000,
    "prior_auth_required": ["standard_restrictions"],
    "coverage_areas": ["cairo_governorate", "giza", "qalyubia"],
    "provider_network": "metro_cairo"
  }'
WHERE provider_code = 'EGH001';

-- Add coverage plans for Egyptian providers
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
    WHEN ip.provider_code = 'EG08' THEN 96
    WHEN ip.provider_code = 'EG01' THEN 95
    WHEN ip.provider_code = 'EG02' THEN 90
    WHEN ip.provider_code = 'EG06' THEN 92
    WHEN ip.provider_code = 'EG05' THEN 88
    WHEN ip.provider_code = 'EG09' THEN 87
    WHEN ip.provider_code = 'EG03' THEN 85
    WHEN ip.provider_code = 'EG04' THEN 80
    WHEN ip.provider_code = 'EG07' THEN 75
    ELSE 90
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
    ELSE 90
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
    ELSE 85
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
WHERE ip.provider_code LIKE 'EG%'
ON CONFLICT (provider_id, plan_name) DO NOTHING;

-- Add formulary data for common medications
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

-- Create storage bucket for insurance cards if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('insurance-cards', 'insurance-cards', true)
ON CONFLICT (id) DO NOTHING;;