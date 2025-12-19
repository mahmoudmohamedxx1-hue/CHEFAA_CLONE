-- Sample Data for Educational Video System
-- This file contains sample videos and related data for testing and demonstration

-- Insert sample educational videos
INSERT INTO educational_videos (
    id, title, title_ar, description, description_ar, video_url, thumbnail_url, 
    duration, category, medical_level, instructor_name, instructor_name_ar, 
    language, views_count, rating, has_transcript, related_products, tags, tags_ar,
    seo_title, seo_description, published, featured, created_by
) VALUES 
(
    uuid_generate_v4(),
    'How to Use Panadol 500mg Safely',
    'طريقة الاستخدام الآمن لبانادول 500 مجم',
    'Complete guide on proper Panadol usage, dosage, and safety precautions for effective pain relief and fever reduction.',
    'دليل شامل للاستخدام الآمن لبانادول والجرعات واحتياطات الأمان لتخفيف الألم وخفض الحمى بشكل فعال.',
    '/videos/panadol_usage_guide.mp4',
    '/images/panadol_video_thumbnail.jpg',
    180,
    'medication-guides',
    'beginner',
    'Dr. Sarah Ahmed',
    'د. سارة أحمد',
    'en',
    15420,
    4.8,
    true,
    '["panadol-500mg-box", "panadol-syrup", "panadol-suppository"]',
    '["pain relief", "paracetamol", "safety", "dosage", "fever"]',
    '["تخفيف الألم", "باراسيتامول", "الأمان", "الجرعة", "حمى"]',
    'Panadol Usage Guide - Safe Pain Relief and Fever Management',
    'Learn how to safely use Panadol 500mg for effective pain relief and fever reduction. Professional medical guidance included.',
    true,
    true,
    NULL
),
(
    uuid_generate_v4(),
    'Proper Inhaler Technique for Asthma Patients',
    'تقنية استخدام البخاخ التنفسي لمرضى الربو',
    'Step-by-step guide to using respiratory inhalers correctly for maximum effectiveness in asthma management.',
    'دليل خطوة بخطوة لاستخدام بخاخات الجهاز التنفسي بشكل صحيح لتحقيق أقصى فاعلية في إدارة الربو.',
    '/videos/inhaler_technique.mp4',
    '/images/inhaler_technique_thumbnail.jpg',
    240,
    'medical-devices',
    'intermediate',
    'Dr. Mohamed Hassan',
    'د. محمد حسن',
    'en',
    8930,
    4.9,
    true,
    '["rescue-inhaler", "controller-inhaler", "spacer-device"]',
    '["inhaler", "respiratory", "technique", "asthma", "breathing"]',
    '["بخاخ", "تنفس", "تقنية", "ربو", "تنفس"]',
    'Proper Inhaler Technique - Asthma Management Guide',
    'Master the correct inhaler technique for effective asthma management. Professional demonstration and tips.',
    true,
    true,
    NULL
),
(
    uuid_generate_v4(),
    'Emergency CPR and Life-Saving Procedures',
    'إجراءات الإسعافات الأولية والإنعاش القلبي الرئوي',
    'Life-saving CPR techniques and emergency procedures everyone should know for cardiac emergencies.',
    'تقنيات إنعاش القلب والرئة المنقذة للحياة وإجراءات الطوارئ التي يجب على الجميع معرفتها للطوارئ القلبية.',
    '/videos/cpr_procedures.mp4',
    '/images/cpr_emergency_thumbnail.jpg',
    360,
    'emergency-procedures',
    'advanced',
    'Dr. Amina Khalil',
    'د. آمنة خليل',
    'en',
    23150,
    4.9,
    true,
    '["cpr-kit", "aed-device", "first-aid-kit"]',
    '["CPR", "emergency", "first aid", "life saving", "cardiac arrest"]',
    '["إنعاش", "طوارئ", "إسعافات أولية", "إنقاذ حياة", "سكتة قلبية"]',
    'Emergency CPR Training - Life-Saving Skills Guide',
    'Learn essential CPR and emergency life-saving procedures. Professional training for cardiac emergencies.',
    true,
    true,
    NULL
),
(
    uuid_generate_v4(),
    'Healthy Eating for Diabetes Management',
    'التغذية الصحية لإدارة مرض السكري',
    'Comprehensive guide to nutrition for diabetes patients and blood sugar control through proper diet.',
    'دليل شامل للتغذية لمرضى السكري والسيطرة على مستوى السكر في الدم من خلال النظام الغذائي المناسب.',
    '/videos/diabetes_nutrition.mp4',
    '/images/diabetes_nutrition_thumbnail.jpg',
    420,
    'nutrition-wellness',
    'intermediate',
    'Dr. Omar Farouk',
    'د. عمر فاروق',
    'en',
    12670,
    4.7,
    true,
    '["glucose-meter", "diabetic-foods", "sugar-substitutes"]',
    '["diabetes", "nutrition", "diet", "blood sugar", "healthy eating"]',
    '["سكري", "تغذية", "نظام غذائي", "سكر الدم", "تغذية صحية"]',
    'Diabetes Nutrition Guide - Healthy Eating for Blood Sugar Control',
    'Complete guide to nutrition for diabetes management. Learn healthy eating habits for blood sugar control.',
    true,
    true,
    NULL
),
(
    uuid_generate_v4(),
    'Daily Skincare Routine with CeraVe Products',
    'روتين العناية اليومية بالبشرة مع منتجات سيرافي',
    'Complete skincare routine using CeraVe products for healthy, radiant skin and proper skin care.',
    'روتين شامل للعناية بالبشرة باستخدام منتجات سيرافي للحصول على بشرة صحية ومشرقة والعناية المناسبة بالبشرة.',
    '/videos/cerave_skincare_routine.mp4',
    '/images/cerave_skincare_thumbnail.jpg',
    300,
    'health-tips',
    'beginner',
    'Dr. Layla Mansour',
    'د. ليلى منصور',
    'en',
    18900,
    4.6,
    true,
    '["cerave-cleanser", "cerave-moisturizer", "cerave-serum"]',
    '["skincare", "CeraVe", "daily routine", "beauty", "skin health"]',
    '["عناية بالبشرة", "سيرافي", "روتين يومي", "جمال", "صحة البشرة"]',
    'Daily Skincare Routine - CeraVe Products Guide',
    'Learn the proper daily skincare routine using CeraVe products for healthy, glowing skin.',
    true,
    false,
    NULL
),
(
    uuid_generate_v4(),
    'How to Use Blood Pressure Monitor at Home',
    'كيفية استخدام جهاز قياس ضغط الدم في المنزل',
    'How to correctly use digital blood pressure monitors at home for accurate readings and health monitoring.',
    'كيفية استخدام أجهزة قياس ضغط الدم الرقمية في المنزل بشكل صحيح للحصول على قراءات دقيقة ومراقبة صحية.',
    '/videos/bp_monitor_usage.mp4',
    '/images/bp_monitor_thumbnail.jpg',
    200,
    'medical-devices',
    'beginner',
    'Dr. Karim Ibrahim',
    'د. كريم إبراهيم',
    'en',
    7340,
    4.8,
    true,
    '["digital-bp-monitor", "bp-cuff", "blood-pressure-log"]',
    '["blood pressure", "monitor", "home health", "measurement", "hypertension"]',
    '["ضغط الدم", "جهاز قياس", "صحة منزلية", "قياس", "ارتفاع ضغط"]',
    'Home Blood Pressure Monitoring - Proper Usage Guide',
    'Learn how to use blood pressure monitors correctly at home for accurate health monitoring.',
    true,
    false,
    NULL
),
(
    uuid_generate_v4(),
    'Antibiotic Safety and Proper Usage',
    'سلامة المضادات الحيوية والاستخدام الصحيح',
    'Essential information about antibiotic use, resistance prevention, and safe medication practices.',
    'معلومات أساسية عن استخدام المضادات الحيوية ومنع مقاومة البكتيريا وممارسات الأدوية الآمنة.',
    '/videos/antibiotic_safety.mp4',
    '/images/antibiotic_safety_thumbnail.jpg',
    280,
    'medication-guides',
    'intermediate',
    'Dr. Nadine Rashid',
    'د. نادين راشد',
    'en',
    11200,
    4.9,
    true,
    '["antibiotics-variety", "probiotics", "medication-chart"]',
    '["antibiotics", "resistance", "safety", "infection", "medication"]',
    '["مضادات حيوية", "مقاومة", "أمان", "عدوى", "دواء"]',
    'Antibiotic Safety Guide - Proper Usage and Resistance Prevention',
    'Learn about safe antibiotic use and preventing resistance. Essential medication safety information.',
    true,
    true,
    NULL
),
(
    uuid_generate_v4(),
    'First Aid for Burns and Cuts',
    'الإسعافات الأولية للحروق والجروح',
    'Basic first aid procedures for treating burns, cuts, and minor injuries at home safely.',
    'إجراءات أساسية للإسعافات الأولية لعلاج الحروق والجروح والإصابات الطفيفة في المنزل بأمان.',
    '/videos/first_aid_burns_cuts.mp4',
    '/images/first_aid_thumbnail.jpg',
    220,
    'emergency-procedures',
    'beginner',
    'Dr. Hassan Al-Zahra',
    'د. حسن الزهرة',
    'en',
    9850,
    4.7,
    true,
    '["first-aid-kit", "burn-cream", "bandages"]',
    '["first aid", "burns", "cuts", "wounds", "home treatment"]',
    '["إسعافات أولية", "حروق", "جروح", "جروح", "علاج منزلي"]',
    'First Aid Guide - Burns and Cuts Treatment',
    'Learn essential first aid techniques for burns and cuts. Home treatment safety procedures.',
    true,
    false,
    NULL
),
(
    uuid_generate_v4(),
    'Understanding High Blood Pressure',
    'فهم ارتفاع ضغط الدم',
    'Complete guide to understanding high blood pressure, its causes, symptoms, and management strategies.',
    'دليل شامل لفهم ارتفاع ضغط الدم وأسبابه وأعراضه واستراتيجيات إدارته.',
    '/videos/high_blood_pressure_guide.mp4',
    '/images/hypertension_thumbnail.jpg',
    340,
    'health-tips',
    'intermediate',
    'Dr. Layla Mansour',
    'د. ليلى منصور',
    'en',
    14800,
    4.8,
    true,
    '["bp-monitor", "low-sodium-diet", "exercise-equipment"]',
    '["blood pressure", "hypertension", "heart health", "lifestyle", "prevention"]',
    '["ضغط الدم", "ارتفاع ضغط", "صحة القلب", "نمط حياة", "وقاية"]',
    'High Blood Pressure Guide - Understanding and Management',
    'Complete guide to understanding and managing high blood pressure for better heart health.',
    true,
    false,
    NULL
),
(
    uuid_generate_v4(),
    'Proper Hand Washing Technique',
    'تقنية غسل اليدين الصحيحة',
    'Essential hand hygiene techniques to prevent infections and maintain good health.',
    'تقنيات النظافة الأساسية لليد لمنع العدوى والحفاظ على صحة جيدة.',
    '/videos/handwashing_technique.mp4',
    '/images/handwashing_thumbnail.jpg',
    150,
    'health-tips',
    'beginner',
    'Dr. Omar Farouk',
    'د. عمر فاروق',
    'en',
    22100,
    4.9,
    true,
    '["hand-sanitizer", "antibacterial-soap", "hand-towel"]',
    '["hygiene", "hand washing", "infection control", "health", "prevention"]',
    '["نظافة", "غسل يدين", "مكافحة عدوى", "صحة", "وقاية"]',
    'Proper Hand Washing - Infection Prevention Guide',
    'Learn the correct hand washing technique to prevent infections and maintain health.',
    true,
    false,
    NULL
);

-- Insert sample video tags
INSERT INTO video_tags (video_id, tag_name, tag_name_ar) 
SELECT 
    v.id, 
    unnest(v.tags) as tag_name,
    unnest(v.tags_ar) as tag_name_ar
FROM educational_videos v
WHERE array_length(v.tags, 1) > 0;

-- Insert sample video comments
INSERT INTO video_comments (id, video_id, user_id, comment, rating, is_approved)
SELECT 
    uuid_generate_v4(),
    v.id,
    NULL, -- Will be populated with actual user IDs when users are created
    CASE 
        WHEN v.category = 'medication-guides' THEN 'Very helpful video! The instructions were clear and easy to follow.'
        WHEN v.category = 'emergency-procedures' THEN 'Essential knowledge that everyone should know. Thank you for the detailed explanation.'
        WHEN v.category = 'health-tips' THEN 'Great tips for maintaining good health. I will definitely implement these practices.'
        ELSE 'Excellent educational content. More videos like this would be very useful.'
    END,
    CASE 
        WHEN random() < 0.8 THEN 5
        WHEN random() < 0.95 THEN 4
        ELSE 3
    END,
    true
FROM educational_videos v
LIMIT 30; -- Add some sample comments

-- Insert sample video favorites (for demonstration)
-- Note: These would need actual user IDs in a real scenario
-- INSERT INTO video_favorites (user_id, video_id) 
-- SELECT 
--     '00000000-0000-0000-0000-000000000000'::uuid, -- Placeholder user ID
--     v.id
-- FROM educational_videos v
-- WHERE random() < 0.3; -- 30% of videos will be favorited

-- Insert sample video analytics
INSERT INTO video_analytics (video_id, user_id, event_type, event_data, created_at)
SELECT 
    v.id,
    NULL, -- Will be populated with actual user IDs
    CASE 
        WHEN random() < 0.7 THEN 'view'
        WHEN random() < 0.85 THEN 'like'
        WHEN random() < 0.95 THEN 'complete'
        ELSE 'share'
    END,
    json_build_object('duration', v.duration, 'source', 'web'),
    NOW() - (random() * INTERVAL '30 days')
FROM educational_videos v
CROSS JOIN generate_series(1, 5) -- Generate 5 analytics events per video
WHERE random() < 0.8; -- 80% chance of generating analytics for each video

-- Update video statistics based on sample analytics
UPDATE educational_videos SET
    views_count = (
        SELECT COUNT(*) FROM video_analytics 
        WHERE video_id = educational_videos.id AND event_type = 'view'
    ),
    total_likes = (
        SELECT COUNT(*) FROM video_analytics 
        WHERE video_id = educational_videos.id AND event_type = 'like'
    ),
    total_shares = (
        SELECT COUNT(*) FROM video_analytics 
        WHERE video_id = educational_videos.id AND event_type = 'share'
    ),
    completion_rate = CASE 
        WHEN (
            SELECT COUNT(*) FROM video_analytics 
            WHERE video_id = educational_videos.id AND event_type = 'view'
        ) > 0 
        THEN ROUND((
            SELECT COUNT(*) FROM video_analytics 
            WHERE video_id = educational_videos.id AND event_type = 'complete'
        )::DECIMAL / (
            SELECT COUNT(*) FROM video_analytics 
            WHERE video_id = educational_videos.id AND event_type = 'view'
        ) * 100, 2)
        ELSE 0
    END,
    total_watch_time = (
        SELECT COUNT(*) * educational_videos.duration * 0.7 FROM video_analytics 
        WHERE video_id = educational_videos.id AND event_type = 'view'
    );

-- Add sample video categories with more detailed information
INSERT INTO video_categories (name, name_ar, description, description_ar, icon, sort_order) VALUES
('Pain Management', 'إدارة الألم', 'Videos about pain relief medications and techniques', 'فيديوهات حول أدوية وتخفيف الآلام', 'pain', 1),
('Respiratory Health', 'صحة الجهاز التنفسي', 'Videos about breathing problems and respiratory devices', 'فيديوهات حول مشاكل التنفس وأجهزة التنفس', 'respiratory', 2),
('Cardiac Care', 'رعاية القلب', 'Videos about heart health and cardiovascular procedures', 'فيديوهات حول صحة القلب والإجراءات القلبية', 'heart', 3),
('Digestive Health', 'صحة الجهاز الهضمي', 'Videos about digestive issues and gut health', 'فيديوهات حول مشاكل الهضم وصحة الأمعاء', 'digestive', 4),
('Mental Health', 'الصحة النفسية', 'Videos about mental wellness and psychological support', 'فيديوهات حول العافية النفسية والدعم النفسي', 'mental', 5),
('Pediatric Care', 'رعاية الأطفال', 'Videos about child health and pediatric medications', 'فيديوهات حول صحة الأطفال وأدوية الأطفال', 'child', 6)
ON CONFLICT DO NOTHING;

-- Grant necessary permissions (adjust based on your setup)
-- Note: These are example permissions and should be modified based on your specific needs

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant usage to anon users for reading public content
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON educational_videos TO anon;
GRANT SELECT ON video_categories TO anon;
GRANT SELECT ON video_tags TO anon;
GRANT SELECT ON video_comments TO anon;

-- Grant specific permissions for video progress tracking
GRANT SELECT, INSERT, UPDATE ON video_progress TO authenticated;
GRANT SELECT, INSERT ON video_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON video_favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON video_comments TO authenticated;