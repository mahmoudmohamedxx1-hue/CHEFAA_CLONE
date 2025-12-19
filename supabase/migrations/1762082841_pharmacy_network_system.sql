-- Migration: pharmacy_network_system
-- Created at: 1762082841

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
));;