-- Migration: phase4_seed_data
-- Created at: 1762075664

-- Phase 4: Seed Initial Data

-- Consultation Types
INSERT INTO consultation_types (name, name_ar, description, duration_minutes, price, is_free, provider_type, requires_prescription) VALUES
('Medication Consultation', 'استشارة دوائية', 'Free consultation with licensed pharmacist about your medications', 15, 0, true, 'pharmacist', false),
('General Health Consultation', 'استشارة صحية عامة', 'Consult with a doctor about general health concerns', 30, 150, false, 'doctor', false),
('Prescription Review', 'مراجعة الروشتة', 'Pharmacist reviews your prescription and explains medications', 20, 0, true, 'pharmacist', true),
('Specialist Consultation', 'استشارة تخصصية', 'Consult with a medical specialist', 60, 300, false, 'specialist', false),
('Follow-up Consultation', 'استشارة متابعة', 'Follow-up on previous consultation or treatment', 30, 100, false, 'doctor', false),
('Emergency Consultation', 'استشارة طارئة', 'Urgent medical consultation - available 24/7', 15, 200, false, 'doctor', false)
ON CONFLICT DO NOTHING;

-- Insurance Providers (Egyptian companies)
INSERT INTO insurance_providers (name, name_ar, provider_code, provider_type, contact_phone, is_active) VALUES
('Egyptian Healthcare', 'الرعاية الصحية المصرية', 'EGH001', 'government', '+20-2-12345678', true),
('Misr Insurance', 'مصر للتأمين', 'MIS001', 'private', '+20-2-23456789', true),
('AXA Egypt', 'أكسا مصر', 'AXA001', 'private', '+20-2-34567890', true),
('Allianz Egypt', 'أليانز مصر', 'ALL001', 'private', '+20-2-45678901', true),
('MetLife Alico', 'ميت لايف أليكو', 'MET001', 'private', '+20-2-56789012', true),
('Corporate Health Plan', 'خطة الصحة الشركات', 'CHP001', 'corporate', '+20-2-67890123', true),
('Comprehensive Health Insurance', 'التأمين الصحي الشامل', 'CHI001', 'government', '+20-2-78901234', true)
ON CONFLICT (provider_code) DO NOTHING;

-- Common Drug Interactions
INSERT INTO drug_interactions (medication_a, medication_b, interaction_type, description, recommendation) VALUES
('Warfarin', 'Aspirin', 'major', 'Increased risk of bleeding when taken together', 'Avoid combination. Consult doctor if both medications are prescribed.'),
('Metformin', 'Alcohol', 'moderate', 'Increased risk of lactic acidosis', 'Limit alcohol consumption while taking Metformin'),
('Lisinopril', 'Ibuprofen', 'moderate', 'NSAIDs may reduce effectiveness of blood pressure medication', 'Monitor blood pressure closely. Consider alternative pain reliever.'),
('Simvastatin', 'Grapefruit Juice', 'major', 'Grapefruit increases drug levels and risk of side effects', 'Avoid grapefruit and grapefruit juice completely'),
('Levothyroxine', 'Calcium', 'moderate', 'Calcium interferes with thyroid hormone absorption', 'Take medications at least 4 hours apart'),
('Amoxicillin', 'Birth Control Pills', 'moderate', 'Antibiotics may reduce effectiveness of oral contraceptives', 'Use backup contraception during antibiotic treatment'),
('Prednisone', 'NSAIDs', 'major', 'Increased risk of stomach ulcers and bleeding', 'Avoid combination if possible. Take with food if unavoidable.'),
('Digoxin', 'Furosemide', 'moderate', 'Diuretics may alter digoxin levels', 'Monitor digoxin levels and potassium regularly'),
('ACE Inhibitors', 'Potassium Supplements', 'major', 'Risk of dangerous potassium levels', 'Avoid potassium supplements unless specifically prescribed'),
('Clopidogrel', 'Omeprazole', 'moderate', 'PPIs may reduce effectiveness of blood thinner', 'Use alternative PPI or monitor closely')
ON CONFLICT (medication_a, medication_b) DO NOTHING;

-- Sample Partner Pharmacies (Cairo locations)
INSERT INTO partner_pharmacies (name, name_ar, license_number, address, city, phone, operating_hours, is_24_hours, delivery_enabled, accepts_insurance, latitude, longitude) VALUES
('El Ezaby Pharmacy - Zamalek', 'صيدلية العزبي - الزمالك', 'PH-CAI-001', '26 July Street, Zamalek', 'Cairo', '+20-2-27358888', '{"monday": {"open": "08:00", "close": "23:00"}, "tuesday": {"open": "08:00", "close": "23:00"}, "wednesday": {"open": "08:00", "close": "23:00"}, "thursday": {"open": "08:00", "close": "23:00"}, "friday": {"open": "10:00", "close": "23:00"}, "saturday": {"open": "08:00", "close": "23:00"}, "sunday": {"open": "08:00", "close": "23:00"}}'::jsonb, false, true, true, 30.0629, 31.2209),
('Seif Pharmacy - Maadi', 'صيدلية سيف - المعادي', 'PH-CAI-002', 'Road 9, Maadi', 'Cairo', '+20-2-23587777', '{}'::jsonb, true, true, true, 29.9601, 31.2470),
('El Nakhil Pharmacy - Heliopolis', 'صيدلية النخيل - مصر الجديدة', 'PH-CAI-003', 'El Hegaz Street, Heliopolis', 'Cairo', '+20-2-24181000', '{"monday": {"open": "09:00", "close": "22:00"}, "tuesday": {"open": "09:00", "close": "22:00"}, "wednesday": {"open": "09:00", "close": "22:00"}, "thursday": {"open": "09:00", "close": "22:00"}, "friday": {"open": "10:00", "close": "22:00"}, "saturday": {"open": "09:00", "close": "22:00"}, "sunday": {"open": "09:00", "close": "22:00"}}'::jsonb, false, true, true, 30.0808, 31.3161),
('Alpha Pharmacy - 6th October', 'صيدلية ألفا - 6 أكتوبر', 'PH-GIZ-001', 'Mall of Arabia, 6th October City', 'Giza', '+20-2-38350000', '{}'::jsonb, true, true, true, 29.9858, 30.9717),
('Remedix Pharmacy - Dokki', 'صيدلية ريميديكس - الدقي', 'PH-GIZ-002', 'Tahrir Street, Dokki', 'Giza', '+20-2-37615555', '{"monday": {"open": "08:00", "close": "midnight"}, "tuesday": {"open": "08:00", "close": "midnight"}, "wednesday": {"open": "08:00", "close": "midnight"}, "thursday": {"open": "08:00", "close": "midnight"}, "friday": {"open": "09:00", "close": "midnight"}, "saturday": {"open": "08:00", "close": "midnight"}, "sunday": {"open": "08:00", "close": "midnight"}}'::jsonb, false, true, true, 30.0384, 31.2092)
ON CONFLICT (license_number) DO NOTHING;

-- Sample Delivery Drivers
INSERT INTO delivery_drivers (full_name, phone, vehicle_type, is_verified, rating) VALUES
('Ahmed Mohamed', '+20-100-1234567', 'motorcycle', true, 4.8),
('Mahmoud Hassan', '+20-100-2345678', 'motorcycle', true, 4.9),
('Sara Ali', '+20-100-3456789', 'car', true, 5.0),
('Mohamed Ibrahim', '+20-100-4567890', 'motorcycle', true, 4.7),
('Fatima Khaled', '+20-100-5678901', 'bicycle', true, 4.6)
ON CONFLICT DO NOTHING;
;