-- Migration: create_barcode_tables
-- Created at: 1762084454

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scan_analytics_product_id ON barcode_scan_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_scan_analytics_user_id ON barcode_scan_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_analytics_scanned_at ON barcode_scan_analytics(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_analytics_barcode ON barcode_scan_analytics(barcode);

CREATE INDEX IF NOT EXISTS idx_unknown_barcodes_barcode ON unknown_barcodes(barcode);
CREATE INDEX IF NOT EXISTS idx_unknown_barcodes_reported_at ON unknown_barcodes(reported_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON user_barcode_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_last_scanned ON user_barcode_history(last_scanned_at DESC);;