-- Migration: add_barcode_columns_to_products
-- Created at: 1762084440

-- Add barcode-related columns to existing products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS barcode VARCHAR(50),
ADD COLUMN IF NOT EXISTS barcode_format VARCHAR(20) DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS ndc VARCHAR(20), -- National Drug Code
ADD COLUMN IF NOT EXISTS scan_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 5;

-- Add unique constraint on barcode if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_barcode_key') THEN
        ALTER TABLE products ADD CONSTRAINT products_barcode_key UNIQUE (barcode);
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_scan_count ON products(scan_count DESC);
CREATE INDEX IF NOT EXISTS idx_products_last_scanned ON products(last_scanned_at DESC);;