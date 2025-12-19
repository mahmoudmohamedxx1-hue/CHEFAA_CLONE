-- Migration: barcode_scanner_system
-- Created at: 1762084410

-- Barcode Scanner Database Tables
-- Creates tables for barcode scanning functionality, analytics, and product management

-- Create products table if not exists
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    barcode VARCHAR(50) UNIQUE,
    barcode_format VARCHAR(20) DEFAULT 'Unknown',
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(100),
    image_url TEXT,
    price DECIMAL(10,2),
    available BOOLEAN DEFAULT true,
    prescription_required BOOLEAN DEFAULT false,
    active_ingredients TEXT[],
    strength VARCHAR(50),
    dosage_form VARCHAR(50),
    manufacturer VARCHAR(100),
    ndc VARCHAR(20), -- National Drug Code
    storage_conditions TEXT,
    warning_text TEXT,
    batch_number VARCHAR(50),
    expiry_date DATE,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    scan_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create barcode scan analytics table
CREATE TABLE IF NOT EXISTS barcode_scan_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID, -- References auth.users(id) if user is logged in
    barcode VARCHAR(50) NOT NULL,
    barcode_format VARCHAR(20) DEFAULT 'Unknown',
    scan_result VARCHAR(20) DEFAULT 'success', -- success, not_found, error
    scan_method VARCHAR(20) DEFAULT 'camera', -- camera, manual, upload
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    context JSONB, -- Additional scan context (location, device info, etc.)
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET
);

-- Create unknown barcode reports table
CREATE TABLE IF NOT EXISTS unknown_barcodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR(50) NOT NULL,
    barcode_format VARCHAR(20) DEFAULT 'Unknown',
    user_id UUID,
    context TEXT,
    scanned_image_url TEXT, -- If user uploaded an image
    manual_entry_text TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address INET,
    status VARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved, rejected
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT
);

-- Create user barcode scan history table
CREATE TABLE IF NOT EXISTS user_barcode_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- References auth.users(id)
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    barcode VARCHAR(50) NOT NULL,
    scan_count INTEGER DEFAULT 1,
    first_scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_favorite BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Create scan locations table (for analytics)
CREATE TABLE IF NOT EXISTS scan_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES barcode_scan_analytics(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2), -- GPS accuracy in meters
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create barcode product alternatives table
CREATE TABLE IF NOT EXISTS product_alternatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    alternative_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    similarity_score DECIMAL(3,2) DEFAULT 1.0,
    alternative_type VARCHAR(50) DEFAULT 'generic', -- generic, brand, strength, form
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(primary_product_id, alternative_product_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(available);
CREATE INDEX IF NOT EXISTS idx_products_scan_count ON products(scan_count DESC);

CREATE INDEX IF NOT EXISTS idx_scan_analytics_product_id ON barcode_scan_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_scan_analytics_user_id ON barcode_scan_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_analytics_scanned_at ON barcode_scan_analytics(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_analytics_barcode ON barcode_scan_analytics(barcode);

CREATE INDEX IF NOT EXISTS idx_unknown_barcodes_barcode ON unknown_barcodes(barcode);
CREATE INDEX IF NOT EXISTS idx_unknown_barcodes_reported_at ON unknown_barcodes(reported_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON user_barcode_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_last_scanned ON user_barcode_history(last_scanned_at DESC);

-- Create function to increment scan count
CREATE OR REPLACE FUNCTION increment_scan_count(product_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    UPDATE products 
    SET scan_count = scan_count + 1,
        last_scanned_at = NOW(),
        updated_at = NOW()
    WHERE id = product_id
    RETURNING scan_count INTO current_count;
    
    RETURN current_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user scan history
CREATE OR REPLACE FUNCTION update_user_scan_history(
    p_user_id UUID,
    p_product_id UUID,
    p_barcode VARCHAR(50),
    p_is_favorite BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_barcode_history (
        user_id, 
        product_id, 
        barcode, 
        scan_count, 
        first_scanned_at, 
        last_scanned_at,
        is_favorite
    )
    VALUES (
        p_user_id,
        p_product_id,
        p_barcode,
        1,
        NOW(),
        NOW(),
        COALESCE(p_is_favorite, false)
    )
    ON CONFLICT (user_id, product_id)
    DO UPDATE SET
        scan_count = user_barcode_history.scan_count + 1,
        last_scanned_at = NOW(),
        is_favorite = COALESCE(p_is_favorite, user_barcode_history.is_favorite),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to get popular scanned products
CREATE OR REPLACE FUNCTION get_popular_scanned_products(
    p_limit INTEGER DEFAULT 10,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    product_id UUID,
    name VARCHAR(255),
    barcode VARCHAR(50),
    category VARCHAR(100),
    brand VARCHAR(100),
    scan_count BIGINT,
    recent_scans BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.barcode,
        p.category,
        p.brand,
        p.scan_count,
        COUNT(sa.id) as recent_scans
    FROM products p
    LEFT JOIN barcode_scan_analytics sa ON p.id = sa.product_id 
        AND sa.scanned_at >= NOW() - INTERVAL '1 day' * p_days_back
    GROUP BY p.id, p.name, p.barcode, p.category, p.brand, p.scan_count
    ORDER BY recent_scans DESC, p.scan_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to get barcode scan analytics
CREATE OR REPLACE FUNCTION get_barcode_analytics(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    date DATE,
    total_scans BIGINT,
    successful_scans BIGINT,
    unsuccessful_scans BIGINT,
    unique_barcodes BIGINT,
    unique_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH date_range AS (
        SELECT generate_series(
            COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days'),
            COALESCE(p_end_date, CURRENT_DATE),
            '1 day'::INTERVAL
        )::DATE as scan_date
    ),
    daily_stats AS (
        SELECT 
            DATE(sa.scanned_at) as scan_date,
            COUNT(*) as total_scans,
            COUNT(*) FILTER (WHERE sa.scan_result = 'success') as successful_scans,
            COUNT(*) FILTER (WHERE sa.scan_result != 'success') as unsuccessful_scans,
            COUNT(DISTINCT sa.barcode) as unique_barcodes,
            COUNT(DISTINCT sa.user_id) as unique_users
        FROM barcode_scan_analytics sa
        WHERE sa.scanned_at >= COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days')
            AND sa.scanned_at <= COALESCE(p_end_date, CURRENT_DATE) + INTERVAL '1 day'
        GROUP BY DATE(sa.scanned_at)
    )
    SELECT 
        dr.scan_date,
        COALESCE(ds.total_scans, 0) as total_scans,
        COALESCE(ds.successful_scans, 0) as successful_scans,
        COALESCE(ds.unsuccessful_scans, 0) as unsuccessful_scans,
        COALESCE(ds.unique_barcodes, 0) as unique_barcodes,
        COALESCE(ds.unique_users, 0) as unique_users
    FROM date_range dr
    LEFT JOIN daily_stats ds ON dr.scan_date = ds.scan_date
    ORDER BY dr.scan_date;
END;
$$ LANGUAGE plpgsql;

-- Insert sample products with barcodes
INSERT INTO products (name, description, barcode, barcode_format, category, brand, price, available, prescription_required, active_ingredients, strength, dosage_form, manufacturer, ndc, scan_count) VALUES
('Panadol 500mg Paracetamol Tablets', 'Fast-acting pain relief for headache, fever, and mild to moderate pain', '5012345678900', 'EAN-13', 'Pain Relief', 'Panadol', 8.99, true, false, ARRAY['Paracetamol 500mg'], '500mg', 'Tablet', 'GSK Consumer Healthcare', '00673-0123-12', 0),
('Panadol Extra 500mg/65mg Tablets', 'Extra strength pain relief with caffeine for enhanced effectiveness', '5012345678901', 'EAN-13', 'Pain Relief', 'Panadol', 12.99, true, false, ARRAY['Paracetamol 500mg', 'Caffeine 65mg'], '500mg/65mg', 'Tablet', 'GSK Consumer Healthcare', '00673-0124-12', 0),
('Advil Ibuprofen 200mg Tablets', 'Non-steroidal anti-inflammatory drug for pain relief and inflammation', '3012345678902', 'EAN-13', 'Pain Relief', 'Advil', 15.99, true, false, ARRAY['Ibuprofen 200mg'], '200mg', 'Tablet', 'Pfizer Consumer Healthcare', '0573-0010-12', 0),
('Aspirin Low Dose 81mg Tablets', 'Low-dose aspirin for cardiovascular protection', '3012345678903', 'EAN-13', 'Cardiovascular', 'Aspirin', 6.99, true, false, ARRAY['Aspirin 81mg'], '81mg', 'Tablet', 'Bayer Healthcare', '0573-0088-12', 0),
('Antihistamine 10mg Tablets', '24-hour allergy relief for hay fever, hives, and itching', '4012345678904', 'EAN-13', 'Allergy', 'Generic', 9.99, true, false, ARRAY['Cetirizine Hydrochloride 10mg'], '10mg', 'Tablet', 'Generic Pharmaceutical', '12345-067-12', 0),
('Vitamin C 500mg Tablets', 'Essential vitamin C supplement for immune system support', '5012345678905', 'EAN-13', 'Vitamins', 'Nature''s Best', 7.99, true, false, ARRAY['Ascorbic Acid 500mg'], '500mg', 'Tablet', 'Nature''s Best', '23456-078-12', 0),
('Lantus Insulin Glargine 100 Units/mL', 'Long-acting insulin for diabetes management', '6012345678906', 'EAN-13', 'Diabetes', 'Lantus', 125.99, true, true, ARRAY['Insulin Glargine'], '100 Units/mL', 'Injection', 'Sanofi-Aventis', '0002-7887-01', 0),
('Metformin 500mg Tablets', 'Diabetes medication to control blood sugar levels', '7012345678907', 'EAN-13', 'Diabetes', 'Generic', 14.99, true, true, ARRAY['Metformin Hydrochloride 500mg'], '500mg', 'Tablet', 'Generic Pharmaceutical', '34567-089-12', 0),
('Lisinopril 10mg Tablets', 'ACE inhibitor for high blood pressure and heart failure', '8012345678908', 'EAN-13', 'Cardiovascular', 'Generic', 11.99, true, true, ARRAY['Lisinopril 10mg'], '10mg', 'Tablet', 'Generic Pharmaceutical', '45678-090-12', 0),
('Omeprazole 20mg Capsules', 'Proton pump inhibitor for acid reflux and ulcers', '9012345678909', 'EAN-13', 'Gastrointestinal', 'Prilosec', 18.99, true, true, ARRAY['Omeprazole 20mg'], '20mg', 'Capsule', 'Prilosec', '56789-091-12', 0)
ON CONFLICT (barcode) DO NOTHING;

-- Create RLS (Row Level Security) policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcode_scan_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE unknown_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_barcode_history ENABLE ROW LEVEL SECURITY;

-- Products are readable by all, writable by authenticated users
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (true);

CREATE POLICY "Products are insertable by authenticated users" ON products
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Products are updatable by authenticated users" ON products
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Barcode scan analytics - users can read their own scans
CREATE POLICY "Users can view own barcode scans" ON barcode_scan_analytics
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own barcode scans" ON barcode_scan_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Unknown barcodes - readable by authenticated users
CREATE POLICY "Authenticated users can view unknown barcodes" ON unknown_barcodes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can report unknown barcodes" ON unknown_barcodes
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- User barcode history - users can only access their own
CREATE POLICY "Users can view own barcode history" ON user_barcode_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own barcode history" ON user_barcode_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own barcode history" ON user_barcode_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own barcode history" ON user_barcode_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_history_updated_at 
    BEFORE UPDATE ON user_barcode_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant function permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;;