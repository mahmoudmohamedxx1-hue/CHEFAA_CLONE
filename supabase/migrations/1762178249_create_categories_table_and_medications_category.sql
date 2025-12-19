-- Migration: create_categories_table_and_medications_category
-- Created at: 1762178249

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    parent_category_id UUID,
    icon_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create public read access policy
CREATE POLICY "Public read access for categories" ON categories
  FOR SELECT USING (true);

-- Create medications category
INSERT INTO categories (name, name_ar, slug, description, display_order) 
VALUES ('Medications', 'الأدوية', 'medications', 'All types of medications including pain relief, vitamins, cough & cold, stomach & bowel, and allergy medications', 1)
ON CONFLICT (slug) DO NOTHING;

-- Create other main categories if they don't exist
INSERT INTO categories (name, name_ar, slug, description, display_order) VALUES
('Daily Essentials', 'الأساسيات اليومية', 'daily-essentials', 'Daily essential products for healthcare', 2),
('Baby Care', 'رعاية الطفل', 'baby-care', 'Baby care products and essentials', 3),
('Personal Care', 'العناية الشخصية', 'personal-care', 'Personal care and hygiene products', 4),
('Medical Supplies', 'الأدوات الطبية', 'medical-supplies', 'Medical supplies and equipment', 5)
ON CONFLICT (slug) DO NOTHING;;