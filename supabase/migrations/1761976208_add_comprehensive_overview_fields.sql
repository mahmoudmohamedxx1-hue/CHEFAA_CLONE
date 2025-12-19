-- Migration: add_comprehensive_overview_fields
-- Created at: 1761976208


-- Add comprehensive overview fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS overview_description TEXT,
ADD COLUMN IF NOT EXISTS key_ingredients JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS benefits JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS active_ingredients JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS therapeutic_indications JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS dosage_administration TEXT,
ADD COLUMN IF NOT EXISTS product_specifications JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS suitability_info TEXT,
ADD COLUMN IF NOT EXISTS warnings_precautions TEXT,
ADD COLUMN IF NOT EXISTS storage_conditions TEXT;

-- Add indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_products_overview_description ON products USING gin(to_tsvector('english', overview_description));
CREATE INDEX IF NOT EXISTS idx_products_key_ingredients ON products USING gin(key_ingredients);
CREATE INDEX IF NOT EXISTS idx_products_benefits ON products USING gin(benefits);

-- Comment on new columns
COMMENT ON COLUMN products.overview_description IS 'Comprehensive product description from overview data';
COMMENT ON COLUMN products.key_ingredients IS 'Array of key ingredients with details';
COMMENT ON COLUMN products.benefits IS 'Array of product benefits';
COMMENT ON COLUMN products.active_ingredients IS 'Array of active pharmaceutical ingredients';
COMMENT ON COLUMN products.therapeutic_indications IS 'Therapeutic uses and indications';
COMMENT ON COLUMN products.dosage_administration IS 'Dosage and administration instructions';
COMMENT ON COLUMN products.product_specifications IS 'Technical specifications';
COMMENT ON COLUMN products.suitability_info IS 'Product suitability information';
COMMENT ON COLUMN products.warnings_precautions IS 'Warnings and precautions';
COMMENT ON COLUMN products.storage_conditions IS 'Storage conditions and handling';
;