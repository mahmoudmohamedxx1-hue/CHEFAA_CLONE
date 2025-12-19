-- Migration: update_medication_products_to_medications_category
-- Created at: 1762178269

-- Update all medication products to have 'medications' as their category
UPDATE products 
SET category = 'medications'
WHERE category IN (
    'Pain Relief',
    'Vitamins & Supplements',
    'Cough & Cold Medications',
    'Stomach & Bowel Medications',
    'Allergy Medications'
);

-- Log the update
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count 
    FROM products 
    WHERE category = 'medications';
    
    RAISE NOTICE 'Updated % products to medications category', updated_count;
END
$$;;