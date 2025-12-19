-- Create partner pharmacies table (extended from existing pharmacies table)
ALTER TABLE pharmacies 
ADD COLUMN IF NOT EXISTS partner_id VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS license_number VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS monthly_orders INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_delivery_time INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS insurance_accepted JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS certification_photos TEXT[],
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create inventory synchronization logs table
CREATE TABLE IF NOT EXISTS inventory_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(255),
    product_name_ar VARCHAR(255),
    stock_quantity INTEGER DEFAULT 0,
    price DECIMAL(10, 2),
    last_updated TIMESTAMP DEFAULT NOW(),
    sync_status VARCHAR(20) DEFAULT 'pending',
    sync_source VARCHAR(50) DEFAULT 'api',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create prescription routing history table
CREATE TABLE IF NOT EXISTS prescription_routing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID,
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    patient_id UUID,
    medication_name VARCHAR(255) NOT NULL,
    medication_name_ar VARCHAR(255),
    dosage VARCHAR(100),
    quantity INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    routed_at TIMESTAMP DEFAULT NOW(),
    estimated_ready_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    delivery_address TEXT,
    delivery_fee DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create quality assurance records table
CREATE TABLE IF NOT EXISTS quality_assurance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    inspection_type VARCHAR(50) NOT NULL,
    inspector_name VARCHAR(255),
    inspection_date DATE,
    score DECIMAL(3,2),
    max_score DECIMAL(3,2) DEFAULT 100.00,
    categories JSONB DEFAULT '{}',
    issues_found TEXT[],
    corrective_actions TEXT[],
    follow_up_date DATE,
    certificate_valid_until DATE,
    status VARCHAR(20) DEFAULT 'active',
    report_file_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS pharmacy_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    metric_date DATE DEFAULT CURRENT_DATE,
    total_orders INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    customer_complaints INTEGER DEFAULT 0,
    response_time_avg INTEGER DEFAULT 0, -- in minutes
    delivery_time_avg INTEGER DEFAULT 0, -- in minutes
    inventory_accuracy DECIMAL(5,2) DEFAULT 0, -- percentage
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(pharmacy_id, metric_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pharmacies_partner_id ON pharmacies(partner_id);
CREATE INDEX IF NOT EXISTS idx_pharmacies_location ON pharmacies(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pharmacies_verified ON pharmacies(verified);
CREATE INDEX IF NOT EXISTS idx_inventory_sync_logs_pharmacy_id ON inventory_sync_logs(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_inventory_sync_logs_product_id ON inventory_sync_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_prescription_routing_pharmacy_id ON prescription_routing_history(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_prescription_routing_status ON prescription_routing_history(status);
CREATE INDEX IF NOT EXISTS idx_quality_assurance_pharmacy_id ON quality_assurance_records(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_pharmacy_date ON pharmacy_performance_metrics(pharmacy_id, metric_date);

-- Insert sample Egyptian partner pharmacies with realistic data
INSERT INTO pharmacies (name, name_ar, address, city, district, phone, email, license_number, latitude, longitude, verified, quality_score, monthly_orders, average_delivery_time, insurance_accepted, payment_methods, services) VALUES 
('El Ezaby Pharmacy', 'صيدليات العزبى', '15 شارع النيل، المعادي، القاهرة', 'Cairo', 'El-Mohandessin', '+20-2-2758-1234', 'contact@elezabypharmacy.com', 'EG-PH-001-2023', 29.9611, 31.2619, true, 4.8, 1250, 25, '["NBE Insurance", "CIB Insurance", "Allianz Insurance"]', '["Cash", "Credit Card", "Debit Card", "Mobile Payment"]', '["Prescription Filling", "Home Delivery", "24/7 Service", "Insurance Claim"]'),
('Seif Pharmacies', 'صيدليات سيف', '42 طريق النصر، مدينة نصر، القاهرة', 'Cairo', 'Nasr City', '+20-2-2275-6789', 'info@seifpharmacies.com', 'EG-PH-002-2023', 30.0500, 31.3500, true, 4.6, 980, 30, '["Delta Insurance", "Future Insurance", "Misr Insurance"]', '["Cash", "Credit Card", "Debit Card"]', '["Prescription Filling", "Home Delivery", "Medical Consultation", "Insurance Claim"]'),
('Oman Pharmacy', 'صيدليات عمان', '78 شارع الكورنيش، الإسكندرية', 'Alexandria', 'Smoha', '+20-3-4876-5432', 'omanpharm@gmail.com', 'EG-PH-003-2023', 31.2001, 29.9187, true, 4.7, 850, 20, '["Takaful Insurance", "Misr Insurance", "Allianz Insurance"]', '["Cash", "Credit Card", "Debit Card", "Mobile Payment"]', '["Prescription Filling", "Home Delivery", "24/7 Service", "Insurance Claim", "Blood Pressure Monitoring"]'),
('Dawaa El Hayat', 'دواء الحياة', '25 شارع الجامعة، الزقازيق، الشرقية', 'Zagazig', 'University Street', '+20-55-230-5678', 'info@dawaaelhayaat.com', 'EG-PH-004-2023', 30.5877, 31.5011, true, 4.5, 650, 35, '["Delta Insurance", "Takaful Insurance"]', '["Cash", "Credit Card", "Debit Card"]', '["Prescription Filling", "Home Delivery", "Medical Equipment", "Insurance Claim"]'),
('El Safa Pharmacy', 'صيدلية الصفا', '16 شارع الجمهورية، المنصورة، الدقهلية', 'Mansoura', 'Republic Street', '+20-50-220-3456', 'elsafapharm@gmail.com', 'EG-PH-005-2023', 31.0409, 31.3785, true, 4.4, 520, 40, '["Misr Insurance", "Delta Insurance"]', '["Cash", "Credit Card"]', '["Prescription Filling", "Home Delivery", "Insurance Claim", "Diabetes Care"]'),
('New El Nile Pharmacy', 'صيدلية النيل الجديدة', '90 شارع الكورنيش، طنطا، الغربية', 'Tanta', 'Corniche Road', '+20-40-330-7890', 'newnilepharm@yahoo.com', 'EG-PH-006-2023', 30.7885, 30.9950, true, 4.3, 480, 45, '["Future Insurance", "Takaful Insurance"]', '["Cash", "Credit Card", "Debit Card"]', '["Prescription Filling", "Home Delivery", "Medical Consultation", "Insurance Claim"]'),
('El Helal Pharmacy', 'صيدلية الهلال', '12 شارع المطار، أسوان', 'Aswan', 'Airport Road', '+20-97-230-4567', 'helalpharm@outlook.com', 'EG-PH-007-2023', 24.0889, 32.8998, true, 4.2, 380, 50, '["Misr Insurance", "Delta Insurance", "Allianz Insurance"]', '["Cash", "Credit Card"]', '["Prescription Filling", "Home Delivery", "Emergency Service", "Insurance Claim"]'),
('Care Plus Pharmacy', 'صيدلية كير بلاس', '55 شارع عمر المختار، دمنهور، البحيرة', 'Damanhour', 'Omar El Mokhtar', '+20-45-350-6789', 'carepluspharm@gmail.com', 'EG-PH-008-2023', 31.0401, 30.4688, true, 4.6, 720, 28, '["Delta Insurance", "CIB Insurance", "Future Insurance"]', '["Cash", "Credit Card", "Debit Card", "Mobile Payment"]', '["Prescription Filling", "Home Delivery", "24/7 Service", "Insurance Claim", "Vaccination"]'),
('MediCare Egypt', 'ميديكير مصر', '33 شارع الجمهورية، الأقصر', 'Luxor', 'Republic Street', '+20-95-220-2345', 'medicareegypt@gmail.com', 'EG-PH-009-2023', 25.6872, 32.6396, true, 4.5, 580, 32, '["Takaful Insurance", "Misr Insurance", "Allianz Insurance"]', '["Cash", "Credit Card", "Debit Card"]', '["Prescription Filling", "Home Delivery", "Medical Equipment", "Insurance Claim"]'),
('Health First Pharmacy', 'صيدلية الصحة أولاً', '89 شارع الكورنيش، الإسماعيلية', 'Ismailia', 'Corniche Street', '+20-64-391-5678', 'healthfirstpharm@yahoo.com', 'EG-PH-010-2023', 30.6043, 32.2723, true, 4.4, 490, 38, '["Delta Insurance", "Future Insurance", "CIB Insurance"]', '["Cash", "Credit Card", "Debit Card", "Mobile Payment"]', '["Prescription Filling", "Home Delivery", "Insurance Claim", "Health Screening"]'),
('Al Salam Pharmacy', 'صيدلية السلام', '44 شارع القاهرة، الجيزة', 'Giza', 'Cairo Street', '+20-2-3501-2345', 'alsalampharm@outlook.com', 'EG-PH-011-2023', 30.0444, 31.2357, true, 4.7, 890, 26, '["NBE Insurance", "Allianz Insurance", "Misr Insurance"]', '["Cash", "Credit Card", "Debit Card", "Mobile Payment"]', '["Prescription Filling", "Home Delivery", "24/7 Service", "Insurance Claim", "Beauty Care"]'),
('Trust Pharmacy', 'صيدلية الثقة', '67 شارع سعد زغلول، بورسعيد', 'Port Said', 'Saad Zaghloul Street', '+20-66-320-4567', 'trustpharm@gmail.com', 'EG-PH-012-2023', 31.2653, 32.3018, true, 4.3, 420, 42, '["Delta Insurance", "Takaful Insurance"]', '["Cash", "Credit Card", "Debit Card"]', '["Prescription Filling", "Home Delivery", "Insurance Claim", "Maritime Medicine"]');

-- Insert sample quality assurance records
INSERT INTO quality_assurance_records (pharmacy_id, inspection_type, inspector_name, inspection_date, score, max_score, categories, issues_found, corrective_actions, follow_up_date, certificate_valid_until, status, report_file_url) 
SELECT 
    p.id,
    'Annual License Renewal',
    'Dr. Ahmed Hassan',
    '2024-10-15',
    4.8,
    5.0,
    '{"prescription_handling": 4.9, "medication_storage": 4.7, "customer_service": 4.8, "inventory_management": 4.6}',
    '{}',
    '{}',
    NULL,
    '2025-10-15',
    'active',
    'https://storage.example.com/qa-reports/annual-2024.pdf'
FROM pharmacies p
WHERE p.name LIKE '%El Ezaby%'
LIMIT 1;

-- Insert sample performance metrics for the last 30 days
INSERT INTO pharmacy_performance_metrics (pharmacy_id, metric_date, total_orders, completed_orders, cancelled_orders, average_rating, customer_complaints, response_time_avg, delivery_time_avg, inventory_accuracy, revenue_generated)
SELECT 
    p.id,
    date_series.date,
    FLOOR(RANDOM() * 50 + 20)::INTEGER,
    FLOOR(RANDOM() * 45 + 18)::INTEGER,
    FLOOR(RANDOM() * 5 + 1)::INTEGER,
    ROUND((RANDOM() * 1 + 4)::NUMERIC, 2),
    FLOOR(RANDOM() * 3)::INTEGER,
    FLOOR(RANDOM() * 30 + 10)::INTEGER,
    FLOOR(RANDOM() * 25 + 20)::INTEGER,
    ROUND((RANDOM() * 10 + 85)::NUMERIC, 2),
    ROUND((RANDOM() * 5000 + 2000)::NUMERIC, 2)
FROM pharmacies p
CROSS JOIN (
    SELECT date_series.date
    FROM generate_series(
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE,
        INTERVAL '1 day'
    ) AS date_series
) date_series
WHERE p.verified = true
LIMIT 360; -- 12 pharmacies * 30 days

-- Enable RLS (Row Level Security) for all new tables
ALTER TABLE inventory_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_routing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_assurance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pharmacy network tables
-- Public read access for verified pharmacies
CREATE POLICY "Allow public read access to verified pharmacies" 
ON pharmacies FOR SELECT 
USING (verified = true);

CREATE POLICY "Allow public read access to inventory logs" 
ON inventory_sync_logs FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM pharmacies 
    WHERE pharmacies.id = inventory_sync_logs.pharmacy_id 
    AND pharmacies.verified = true
));

CREATE POLICY "Allow public read access to quality records" 
ON quality_assurance_records FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM pharmacies 
    WHERE pharmacies.id = quality_assurance_records.pharmacy_id 
    AND pharmacies.verified = true
));

CREATE POLICY "Allow public read access to performance metrics" 
ON pharmacy_performance_metrics FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM pharmacies 
    WHERE pharmacies.id = pharmacy_performance_metrics.pharmacy_id 
    AND pharmacies.verified = true
));

-- Allow pharmacy owners to manage their own data
CREATE POLICY "Allow pharmacies to manage their own data" 
ON pharmacies FOR ALL 
USING (partner_id = current_setting('app.current_pharmacy_id', true));

CREATE POLICY "Allow pharmacies to manage their inventory logs" 
ON inventory_sync_logs FOR ALL 
USING (EXISTS (
    SELECT 1 FROM pharmacies 
    WHERE pharmacies.id = inventory_sync_logs.pharmacy_id 
    AND pharmacies.partner_id = current_setting('app.current_pharmacy_id', true)
));

CREATE POLICY "Allow pharmacies to manage their routing history" 
ON prescription_routing_history FOR ALL 
USING (EXISTS (
    SELECT 1 FROM pharmacies 
    WHERE pharmacies.id = prescription_routing_history.pharmacy_id 
    AND pharmacies.partner_id = current_setting('app.current_pharmacy_id', true)
));

-- Insert sample inventory synchronization data
INSERT INTO inventory_sync_logs (pharmacy_id, product_id, product_name, product_name_ar, stock_quantity, price, sync_status, sync_source)
SELECT 
    p.id,
    'MED-' || LPAD((ROW_NUMBER() OVER())::text, 6, '0'),
    CASE 
        WHEN ROW_NUMBER() OVER() % 10 = 1 THEN 'Paracetamol 500mg'
        WHEN ROW_NUMBER() OVER() % 10 = 2 THEN 'Ibuprofen 400mg'
        WHEN ROW_NUMBER() OVER() % 10 = 3 THEN 'Amoxicillin 250mg'
        WHEN ROW_NUMBER() OVER() % 10 = 4 THEN 'Cetirizine 10mg'
        WHEN ROW_NUMBER() OVER() % 10 = 5 THEN 'Omeprazole 20mg'
        WHEN ROW_NUMBER() OVER() % 10 = 6 THEN 'Metformin 500mg'
        WHEN ROW_NUMBER() OVER() % 10 = 7 THEN 'Amlodipine 5mg'
        WHEN ROW_NUMBER() OVER() % 10 = 8 THEN 'Atorvastatin 20mg'
        WHEN ROW_NUMBER() OVER() % 10 = 9 THEN 'Salbutamol Inhaler'
        ELSE 'Aspirin 75mg'
    END,
    CASE 
        WHEN ROW_NUMBER() OVER() % 10 = 1 THEN 'باراسيتامول ٥٠٠ مجم'
        WHEN ROW_NUMBER() OVER() % 10 = 2 THEN 'إيبوبروفين ٤٠٠ مجم'
        WHEN ROW_NUMBER() OVER() % 10 = 3 THEN 'أموكسيسيلين ٢٥٠ مجم'
        WHEN ROW_NUMBER() OVER() % 10 = 4 THEN 'سيتريزين ١٠ مجم'
        WHEN ROW_NUMBER() OVER() % 10 = 5 THEN 'أوميبرازول ٢٠ مجم'
        WHEN ROW_NUMBER() OVER() % 10 = 6 THEN 'ميتفورمين ٥٠٠ مجم'
        WHEN ROW_NUMBER() OVER() % 10 = 7 THEN 'أملوديبين ٥ مجم'
        WHEN ROW_NUMBER() OVER() % 10 = 8 THEN 'أتورفاستاتين ٢٠ مجم'
        WHEN ROW_NUMBER() OVER() % 10 = 9 THEN 'سالبوتامول بخاخ'
        ELSE 'أسبرين ٧٥ مجم'
    END,
    FLOOR(RANDOM() * 200 + 10)::INTEGER,
    ROUND((RANDOM() * 50 + 10)::NUMERIC, 2),
    'success',
    'api'
FROM pharmacies p
CROSS JOIN generate_series(1, 50) -- 50 products per pharmacy
WHERE p.verified = true;