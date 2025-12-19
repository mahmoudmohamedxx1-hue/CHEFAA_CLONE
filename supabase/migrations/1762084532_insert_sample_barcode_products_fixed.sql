-- Migration: insert_sample_barcode_products_fixed
-- Created at: 1762084532

-- Insert sample products with barcodes using proper category IDs
-- Get category IDs
DO $$
DECLARE
    medications_cat_id UUID := '00b6ecb8-30f9-43c6-9e3c-4e9bfbabde77';
    vitamins_cat_id UUID := '1771c4d1-9a6a-49d4-96d5-779f3329c402';
    medical_supplies_cat_id UUID := '02ee9fdb-6273-44d5-8211-42346a66cbeb';
BEGIN
    INSERT INTO products (name, name_ar, slug, price, category_id, brand, barcode, barcode_format, ndc, prescription_required, active_ingredients, formulation, description, description_ar) VALUES
    ('Panadol 500mg Paracetamol Tablets', 'بنادول 500mg أقراص باراسيتامول', 'panadol-500mg-paracetamol', 8.99, medications_cat_id, 'Panadol', '5012345678900', 'EAN-13', '00673-0123-12', false, '["Paracetamol 500mg"]', 'Tablet', 'Fast-acting pain relief for headache, fever, and mild to moderate pain', 'مسكن سريع المفعول للصداع والحمى والألم الخفيف إلى المتوسط'),
    ('Panadol Extra 500mg/65mg Tablets', 'بنادول اكسترا 500mg/65mg أقراص', 'panadol-extra-500mg-65mg', 12.99, medications_cat_id, 'Panadol', '5012345678901', 'EAN-13', '00673-0124-12', false, '["Paracetamol 500mg", "Caffeine 65mg"]', 'Tablet', 'Extra strength pain relief with caffeine for enhanced effectiveness', 'مسكن الألم عالي القوة مع الكافيين لفعالية محسنة'),
    ('Advil Ibuprofen 200mg Tablets', 'أدفيل ايبوبروفين 200mg أقراص', 'advil-ibuprofen-200mg', 15.99, medications_cat_id, 'Advil', '3012345678902', 'EAN-13', '0573-0010-12', false, '["Ibuprofen 200mg"]', 'Tablet', 'Non-steroidal anti-inflammatory drug for pain relief and inflammation', 'دواء مضاد للالتهاب غير ستيرويدي لتخفيف الألم والالتهاب'),
    ('Aspirin Low Dose 81mg Tablets', 'أسبرين جرعة منخفضة 81mg أقراص', 'aspirin-low-dose-81mg', 6.99, medications_cat_id, 'Aspirin', '3012345678903', 'EAN-13', '0573-0088-12', false, '["Aspirin 81mg"]', 'Tablet', 'Low-dose aspirin for cardiovascular protection', 'أسبرين بجرعة منخفضة لحماية القلب والأوعية الدموية'),
    ('Antihistamine 10mg Tablets', 'مضاد الهيستامين 10mg أقراص', 'antihistamine-10mg', 9.99, medications_cat_id, 'Generic', '4012345678904', 'EAN-13', '12345-067-12', false, '["Cetirizine Hydrochloride 10mg"]', 'Tablet', '24-hour allergy relief for hay fever, hives, and itching', 'تخفيف الحساسية لمدة 24 ساعة لحمى القش والشرى والحكة'),
    ('Vitamin C 500mg Tablets', 'فيتامين C 500mg أقراص', 'vitamin-c-500mg', 7.99, vitamins_cat_id, 'Nature''s Best', '5012345678905', 'EAN-13', '23456-078-12', false, '["Ascorbic Acid 500mg"]', 'Tablet', 'Essential vitamin C supplement for immune system support', 'مكمل فيتامين C الأساسي لدعم جهاز المناعة'),
    ('Lantus Insulin Glargine 100 Units/mL', 'لانتوس انسولين جارجين 100 وحدة/مل', 'lantus-insulin-glargine-100', 125.99, medications_cat_id, 'Lantus', '6012345678906', 'EAN-13', '0002-7887-01', true, '["Insulin Glargine"]', 'Injection', 'Long-acting insulin for diabetes management', 'انسولين مديد المفعول لإدارة مرض السكري'),
    ('Metformin 500mg Tablets', 'ميتفورمين 500mg أقراص', 'metformin-500mg', 14.99, medications_cat_id, 'Generic', '7012345678907', 'EAN-13', '34567-089-12', true, '["Metformin Hydrochloride 500mg"]', 'Tablet', 'Diabetes medication to control blood sugar levels', 'دواء السكري للتحكم في مستويات السكر في الدم'),
    ('Lisinopril 10mg Tablets', 'ليسينوبريل 10mg أقراص', 'lisinopril-10mg', 11.99, medications_cat_id, 'Generic', '8012345678908', 'EAN-13', '45678-090-12', true, '["Lisinopril 10mg"]', 'Tablet', 'ACE inhibitor for high blood pressure and heart failure', 'مثبط إنزيم الأنجيوتنسين لارتفاع ضغط الدم وفشل القلب'),
    ('Omeprazole 20mg Capsules', 'أوميبرازول 20mg كبسولات', 'omeprazole-20mg', 18.99, medications_cat_id, 'Prilosec', '9012345678909', 'EAN-13', '56789-091-12', true, '["Omeprazole 20mg"]', 'Capsule', 'Proton pump inhibitor for acid reflux and ulcers', 'مثبط مضخة البروتون لحموضة المعدة والقرحة')
    ON CONFLICT (barcode) DO UPDATE SET
        name = EXCLUDED.name,
        name_ar = EXCLUDED.name_ar,
        price = EXCLUDED.price,
        brand = EXCLUDED.brand,
        ndc = EXCLUDED.ndc,
        prescription_required = EXCLUDED.prescription_required,
        active_ingredients = EXCLUDED.active_ingredients,
        formulation = EXCLUDED.formulation,
        description = EXCLUDED.description,
        description_ar = EXCLUDED.description_ar;
END $$;;