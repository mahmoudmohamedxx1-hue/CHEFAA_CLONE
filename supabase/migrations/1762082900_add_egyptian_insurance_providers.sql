-- Migration: add_egyptian_insurance_providers
-- Created at: 1762082900

-- Add missing Egyptian insurance providers

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
}')
ON CONFLICT (provider_code) DO UPDATE SET
  name = EXCLUDED.name,
  name_ar = EXCLUDED.name_ar,
  provider_type = EXCLUDED.provider_type,
  contact_phone = EXCLUDED.contact_phone,
  contact_email = EXCLUDED.contact_email,
  api_endpoint = EXCLUDED.api_endpoint,
  coverage_details = EXCLUDED.coverage_details;;