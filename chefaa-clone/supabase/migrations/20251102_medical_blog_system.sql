-- Medical Blog System Database Schema
-- Created: 2025-11-02

-- Blog Categories Table
CREATE TABLE blog_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    description_ar TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Posts Table
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    title_ar VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    excerpt TEXT,
    excerpt_ar TEXT,
    content TEXT NOT NULL,
    content_ar TEXT,
    author_id UUID REFERENCES auth.users(id),
    category_id UUID REFERENCES blog_categories(id),
    
    -- SEO Fields
    meta_title VARCHAR(500),
    meta_title_ar VARCHAR(500),
    meta_description TEXT,
    meta_description_ar TEXT,
    meta_keywords TEXT,
    meta_keywords_ar TEXT,
    canonical_url TEXT,
    
    -- Content Management
    featured_image_url TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, published, scheduled, archived
    is_featured BOOLEAN DEFAULT false,
    is_medical_verified BOOLEAN DEFAULT false,
    reading_time_minutes INTEGER,
    
    -- Publication
    published_at TIMESTAMP WITH TIME ZONE,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Comments Table
CREATE TABLE blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_email VARCHAR(255) NOT NULL,
    author_website VARCHAR(255),
    content TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, spam
    parent_id UUID REFERENCES blog_comments(id),
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Tags Table
CREATE TABLE blog_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    name_ar VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    description_ar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Post Tags Junction Table
CREATE TABLE blog_post_tags (
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Related Products Table (for internal linking)
CREATE TABLE blog_related_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    product_id VARCHAR(255) NOT NULL, -- References products table
    product_name VARCHAR(500) NOT NULL,
    product_name_ar VARCHAR(500),
    product_price DECIMAL(10,2),
    product_image_url TEXT,
    link_url TEXT NOT NULL,
    relevance_score DECIMAL(3,2) DEFAULT 1.0, -- 0.0 to 1.0
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Analytics Table
CREATE TABLE blog_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(255),
    event_type VARCHAR(100), -- view, like, share, comment, read_time
    event_data JSONB,
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medical Content Verification Table
CREATE TABLE medical_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    medical_professional_id UUID,
    verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
    medical_notes TEXT,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog SEO Optimization Functions
CREATE OR REPLACE FUNCTION update_blog_post_reading_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Estimate reading time based on word count (average 200 words per minute)
    NEW.reading_time_minutes = GREATEST(1, LENGTH(NEW.content) / 200);
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic reading time calculation
CREATE TRIGGER update_blog_post_reading_time_trigger
    BEFORE INSERT OR UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_blog_post_reading_time();

-- Update post view count function
CREATE OR REPLACE FUNCTION increment_post_views(post_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE blog_posts 
    SET views_count = views_count + 1 
    WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql;

-- Search blog posts function
CREATE OR REPLACE FUNCTION search_blog_posts(
    search_query TEXT,
    language_code TEXT DEFAULT 'en',
    category_slug TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    title_ar VARCHAR,
    slug VARCHAR,
    excerpt TEXT,
    excerpt_ar TEXT,
    featured_image_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    reading_time_minutes INTEGER,
    views_count INTEGER,
    category_name VARCHAR,
    category_name_ar VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.id,
        CASE WHEN language_code = 'ar' THEN bp.title_ar ELSE bp.title END as title,
        CASE WHEN language_code = 'ar' THEN bp.title_ar ELSE bp.title END as title_ar,
        bp.slug,
        CASE WHEN language_code = 'ar' THEN bp.excerpt_ar ELSE bp.excerpt END as excerpt,
        CASE WHEN language_code = 'ar' THEN bp.excerpt_ar ELSE bp.excerpt END as excerpt_ar,
        bp.featured_image_url,
        bp.published_at,
        bp.reading_time_minutes,
        bp.views_count,
        bc.name as category_name,
        bc.name_ar as category_name_ar
    FROM blog_posts bp
    LEFT JOIN blog_categories bc ON bp.category_id = bc.id
    WHERE bp.status = 'published'
    AND (category_slug IS NULL OR bc.slug = category_slug)
    AND (
        CASE WHEN language_code = 'ar'
        THEN (bp.title_ar ILIKE '%' || search_query || '%' OR bp.excerpt_ar ILIKE '%' || search_query || '%' OR bp.content_ar ILIKE '%' || search_query || '%')
        ELSE (bp.title ILIKE '%' || search_query || '%' OR bp.excerpt ILIKE '%' || search_query || '%' OR bp.content ILIKE '%' || search_query || '%')
        END
    )
    ORDER BY bp.published_at DESC
    LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Get related posts function
CREATE OR REPLACE FUNCTION get_related_posts(
    post_uuid UUID,
    limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    title_ar VARCHAR,
    slug VARCHAR,
    excerpt TEXT,
    excerpt_ar TEXT,
    featured_image_url TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    similarity_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.id,
        bp.title,
        bp.title_ar,
        bp.slug,
        bp.excerpt,
        bp.excerpt_ar,
        bp.featured_image_url,
        bp.published_at,
        -- Calculate similarity based on shared tags and category
        CASE 
            WHEN bp.category_id = (SELECT category_id FROM blog_posts WHERE id = post_uuid) THEN 0.8
            ELSE 0.0
        END +
        COALESCE(
            (SELECT COUNT(*) * 0.2
             FROM blog_post_tags bpt1
             JOIN blog_post_tags bpt2 ON bpt1.tag_id = bpt2.tag_id
             WHERE bpt1.post_id = post_uuid 
             AND bpt2.post_id = bp.id
             GROUP BY bpt1.post_id), 0
        ) as similarity_score
    FROM blog_posts bp
    WHERE bp.id != post_uuid 
    AND bp.status = 'published'
    ORDER BY similarity_score DESC, bp.published_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_search ON blog_posts USING gin(to_tsvector('english', title || ' ' || coalesce(content, '')));
CREATE INDEX idx_blog_posts_search_ar ON blog_posts USING gin(to_tsvector('simple', title_ar || ' ' || coalesce(content_ar, '')));

CREATE INDEX idx_blog_comments_post_id ON blog_comments(post_id);
CREATE INDEX idx_blog_comments_status ON blog_comments(status);

CREATE INDEX idx_blog_analytics_post_id ON blog_analytics(post_id);
CREATE INDEX idx_blog_analytics_event_type ON blog_analytics(event_type);
CREATE INDEX idx_blog_analytics_created_at ON blog_analytics(created_at);

CREATE INDEX idx_blog_categories_slug ON blog_categories(slug);
CREATE INDEX idx_blog_tags_slug ON blog_tags(slug);

-- Row Level Security Policies
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_related_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_verifications ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public read access for published blog posts" ON blog_posts
    FOR SELECT USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY "Public read access for blog categories" ON blog_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access for approved comments" ON blog_comments
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Public read access for blog tags" ON blog_tags
    FOR SELECT USING (true);

CREATE POLICY "Public read access for blog analytics" ON blog_analytics
    FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Admin full access to blog posts" ON blog_posts
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR auth.uid() = author_id);

CREATE POLICY "Admin full access to blog categories" ON blog_categories
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access to blog comments" ON blog_comments
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access to blog tags" ON blog_tags
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admin full access to medical verifications" ON medical_verifications
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert default blog categories
INSERT INTO blog_categories (name, name_ar, slug, description, description_ar) VALUES
('Health Conditions', 'الحالات الصحية', 'health-conditions', 'Information about common health conditions and diseases', 'معلومات عن الأمراض والحالات الصحية الشائعة'),
('Medications', 'الأدوية', 'medications', 'Medication guides, drug interactions, and safety information', 'دليل الأدوية، التفاعلات الدوائية، ومعلومات السلامة'),
('Prevention', 'الوقاية', 'prevention', 'Health prevention tips and preventive care strategies', 'نصائح الوقاية من الأمراض واستراتيجيات الرعاية الوقائية'),
('Wellness', 'العافية', 'wellness', 'General wellness, nutrition, and healthy lifestyle tips', 'العافية العامة، التغذية، ونصائح نمط الحياة الصحي');

-- Insert sample blog tags
INSERT INTO blog_tags (name, name_ar, slug, description, description_ar) VALUES
('Health Tips', 'نصائح صحية', 'health-tips', 'General health improvement tips', 'نصائح عامة لتحسين الصحة'),
('Nutrition', 'التغذية', 'nutrition', 'Nutrition and dietary guidance', 'التغذية وإرشادات النظام الغذائي'),
('Exercise', 'التمارين', 'exercise', 'Physical activity and exercise guidance', 'النشاط البدني وتمارين اللياقة'),
('Mental Health', 'الصحة النفسية', 'mental-health', 'Mental wellness and psychological health', 'الصحة النفسية والعافية النفسية'),
('Chronic Diseases', 'الأمراض المزمنة', 'chronic-diseases', 'Information about chronic conditions', 'معلومات عن الأمراض المزمنة'),
('Medications', 'الأدوية', 'medications', 'Medication-related content', 'محتوى متعلق بالأدوية'),
('Safety', 'السلامة', 'safety', 'Health and medication safety tips', 'نصائح السلامة في الصحة والأدوية'),
('Senior Health', 'صحة كبار السن', 'senior-health', 'Health guidance for elderly individuals', 'إرشادات صحية لكبار السن'),
('Women Health', 'صحة المرأة', 'women-health', 'Women-specific health information', 'معلومات صحية خاصة بالنساء'),
('Children Health', 'صحة الأطفال', 'children-health', 'Pediatric health and child care', 'صحة الأطفال ورعاية الأطفال'),
('Emergency Care', 'الرعاية الطارئة', 'emergency-care', 'Emergency medical care guidance', 'إرشادات الرعاية الطبية الطارئة'),
('Pharmacy', 'الصيدلة', 'pharmacy', 'Pharmacy services and medication management', 'خدمات الصيدلة وإدارة الأدوية');

-- Insert sample medical blog posts
INSERT INTO blog_posts (
    title, title_ar, slug, excerpt, excerpt_ar, content, content_ar,
    category_id, status, is_featured, published_at, meta_title, meta_title_ar,
    meta_description, meta_description_ar, featured_image_url
) VALUES 
(
    'Understanding Diabetes: Types, Symptoms, and Management',
    'فهم مرض السكري: الأنواع والأعراض والإدارة',
    'understanding-diabetes-types-symptoms-management',
    'A comprehensive guide to understanding diabetes, its types, symptoms, and effective management strategies for better health outcomes.',
    'دليل شامل لفهم مرض السكري وأنواعه وأعراضه واستراتيجيات الإدارة الفعالة لنتائج صحية أفضل.',
    '# Understanding Diabetes: Types, Symptoms, and Management

## What is Diabetes?
Diabetes is a chronic condition that affects how your body processes blood sugar (glucose). Glucose is essential for your health as it''s an important source of energy for the cells that make up your muscles and tissues.

## Types of Diabetes

### Type 1 Diabetes
- **Autoimmune condition**: The body attacks insulin-producing cells
- **Usually diagnosed in children and young adults**
- **Requires lifelong insulin therapy**

### Type 2 Diabetes
- **Most common form**: Accounts for 90-95% of diabetes cases
- **Body doesn''t use insulin efficiently**
- **Often preventable through lifestyle changes**

### Gestational Diabetes
- **Develops during pregnancy**
- **Usually disappears after childbirth**
- **Increases risk of Type 2 diabetes later in life**

## Common Symptoms
- Increased thirst and frequent urination
- Extreme hunger
- Unexplained weight loss
- Fatigue and irritability
- Blurred vision
- Slow-healing sores

## Management Strategies

### 1. Blood Sugar Monitoring
- Regular glucose testing
- Keep a blood sugar log
- Understand target ranges

### 2. Healthy Eating
- Focus on complex carbohydrates
- Include lean proteins
- Eat plenty of vegetables
- Limit processed foods

### 3. Physical Activity
- Regular exercise helps control blood sugar
- Aim for 150 minutes of moderate activity per week
- Include both aerobic and strength training

### 4. Medication Compliance
- Take medications as prescribed
- Never skip doses
- Communicate with healthcare providers

## When to See a Doctor
- Blood sugar levels consistently outside target range
- Signs of complications
- Frequent infections
- Vision changes

Remember: Diabetes management is a lifelong commitment that requires regular monitoring, healthy lifestyle choices, and consistent medical care.',
    '# فهم مرض السكري: الأنواع والأعراض والإدارة

## ما هو مرض السكري؟
مرض السكري هو حالة مزمنة تؤثر على طريقة معالجة جسمك لسكر الدم (الجلوكوز). الجلوكوز ضروري لصحتك لأنه مصدر مهم للطاقة للخلايا التي تشكل عضلاتك وأنسجتك.

## أنواع السكري

### السكري النوع الأول
- **حالة مناعة ذاتية**: يهاجم الجسم خلايا إنتاج الأنسولين
- **عادة ما يتم تشخيصه في الأطفال والشباب**
- **يتطلب علاج الأنسولين مدى الحياة**

### السكري النوع الثاني
- **الشكل الأكثر شيوعا**: يمثل 90-95% من حالات السكري
- **الجسم لا يستخدم الأنسولين بكفاءة**
- **يمكن الوقاية منه غالبا من خلال تغييرات نمط الحياة**

### سكري الحمل
- **يتطور أثناء الحمل**
- **يختفي عادة بعد الولادة**
- **يزيد خطر الإصابة بالنوع الثاني من السكري في وقت لاحق**

## الأعراض الشائعة
- زيادة العطش والتبول المتكرر
- جوع شديد
- فقدان الوزن غير المبرر
- التعب والتهيج
- تشوش الرؤية
- بطء شفاء الجروح

## استراتيجيات الإدارة

### 1. مراقبة سكر الدم
- فحص منتظم للجلوكوز
- احتفظ بسجل لسكر الدم
- افهم النطاقات المستهدفة

### 2. الأكل الصحي
- ركز على الكربوهيدرات المعقدة
- اشمل البروتينات الخالية من الدهون
- تناول الكثير من الخضروات
- قلل من الأطعمة المصنعة

### 3. النشاط البدني
- التمارين المنتظمة تساعد في التحكم في سكر الدم
- استهدف 150 دقيقة من النشاط المعتدل أسبوعيا
- اشمل كل من التمارين الهوائية وتدريبات القوة

### 4. الامتثال للأدوية
- تناول الأدوية كما هو موصوف
- لا تتخطى الجرعات أبدا
- تواصل مع مقدمي الرعاية الصحية

## متى ترى الطبيب
- مستويات سكر الدم خارج النطاق المستهدف باستمرار
- علامات المضاعفات
- عدوى متكررة
- تغيرات في الرؤية

تذكر: إدارة مرض السكري التزام مدى الحياة يتطلب مراقبة منتظمة وخيارات نمط حياة صحي ورعاية طبية ثابتة.',
    (SELECT id FROM blog_categories WHERE slug = 'health-conditions'),
    'published',
    true,
    NOW(),
    'Understanding Diabetes: Types, Symptoms, and Management | Chefaa',
    'فهم مرض السكري: الأنواع والأعراض والإدارة | شفاء',
    'Comprehensive guide to diabetes types, symptoms, management strategies, and when to seek medical help.',
    'دليل شامل لأنواع مرض السكري والأعراض واستراتيجيات الإدارة ومتى نطلب المساعدة الطبية.',
    '/images/diabetes-management-guide.jpg'
),
(
    'Safe Medication Storage and Disposal Guidelines',
    'إرشادات تخزين والتخلص من الأدوية بشكل آمن',
    'safe-medication-storage-disposal-guidelines',
    'Learn proper medication storage techniques and safe disposal methods to protect your family and environment.',
    'تعلم تقنيات تخزين الأدوية المناسبة وطرق التخلص الآمن لحماية عائلتك والبيئة.',
    '# Safe Medication Storage and Disposal Guidelines

## Why Proper Storage Matters
Proper medication storage is crucial for maintaining drug effectiveness and preventing accidental poisoning, especially in households with children or elderly individuals.

## Storage Guidelines

### Temperature Control
- **Room temperature**: 68-77°F (20-25°C) for most medications
- **Cool, dry place**: Avoid bathrooms and kitchens
- **Avoid direct sunlight**: Store in original containers
- **Check expiration dates**: Replace expired medications

### Special Storage Requirements
- **Refrigerated medications**: Store at 36-46°F (2-8°C)
- **Never freeze**: Avoid extreme temperature changes
- **Insulin storage**: Follow specific manufacturer guidelines
- **Liquid medications**: Check for precipitation or discoloration

## Medication Disposal

### When to Dispose
- Expired medications
- Medications no longer needed
- Damaged or contaminated medications
- Unused prescription medications

### Safe Disposal Methods

#### 1. FDA-Recommended Disposal
- Mix with undesirable substances (used coffee grounds, cat litter)
- Place in sealed container or bag
- Remove personal information from prescription labels
- Dispose with household trash

#### 2. Take-Back Programs
- Local pharmacy take-back programs
- DEA National Take Back Day events
- Hospital or clinic disposal programs
- Mail-back programs for controlled substances

#### 3. Flushing Guidelines
**Only flush if specifically instructed:**
- Fentanyl patches
- Certain cancer medications
- Some opioid medications

### What NOT to Do
- ❌ Don''t share medications
- ❌ Don''t throw in regular trash without mixing
- ❌ Don''t flush down toilet unless instructed
- ❌ Don''t give to friends or family

## Special Considerations

### Household Safety
- Use child-resistant containers
- Store out of reach of children
- Keep medications in original containers
- Maintain an inventory list

### Travel Safety
- Carry medications in carry-on luggage
- Bring extra supply for trips
- Keep medications at proper temperature
- Carry prescription information

### Emergency Preparedness
- Include medications in emergency kits
- Know your medications and dosages
- Have emergency contact information
- Plan for medication access during emergencies

## Creating a Safe Medicine Cabinet

### Essential Items
- Digital thermometer
- Pain relievers (acetaminophen, ibuprofen)
- Antihistamines
- First aid supplies
- Emergency contact information

### Organization Tips
- Group by family member
- Separate adult and children''s medications
- Keep inventory list updated
- Regular expiration date checks

Remember: Proper medication management protects your family and community while ensuring optimal health outcomes.',
    '# إرشادات تخزين والتخلص من الأدوية بشكل آمن

## لماذا التخزين المناسب مهم
تخزين الأدوية بشكل مناسب أمر بالغ الأهمية للحفاظ على فعالية الدواء ومنع التسمم العرضي، خاصة في المنازل مع الأطفال أو كبار السن.

## إرشادات التخزين

### التحكم في درجة الحرارة
- **درجة حرارة الغرفة**: 68-77°F (20-25°C) لمعظم الأدوية
- **مكان بارد وجاف**: تجنب الحمامات والمطابخ
- **تجنب أشعة الشمس المباشرة**: احفظ في الحاويات الأصلية
- **تحقق من تواريخ الانتهاء**: استبدل الأدوية المنتهية الصلاحية

### متطلبات التخزين الخاصة
- **الأدوية المبردة**: احفظ في 36-46°F (2-8°C)
- **لا تجمد أبدا**: تجنب تغيرات درجة الحرارة القصوى
- **تخزين الأنسولين**: اتبع إرشادات الشركة المصنعة المحددة
- **الأدوية السائلة**: تحقق من الترسبات أو تغير اللون

## التخلص من الأدوية

### متى تتخلص
- الأدوية المنتهية الصلاحية
- الأدوية التي لم تعد مطلوبة
- الأدوية التالفة أو الملوثة
- أدوية الوصفات الطبية غير المستخدمة

### طرق التخلص الآمنة

#### 1. التخلص كما توصي به هيئة الغذاء والدواء الأمريكية (FDA)
- امزج مع مواد غير مرغوب فيها (بقايا القهوة المستخدمة، فضلات القطط)
- ضع في حاوية محكمة الإغلاق أو كيس
- أزل المعلومات الشخصية من ملصقات الوصفات الطبية
- تخلص مع نفايات المنزل

#### 2. برامج الاستعادة
- برامج الاستعادة في الصيدليات المحلية
- فعاليات يوم الاستعادة الوطني للـ DEA
- برامج التخلص في المستشفيات أو العيادات
- برامج الإرسال للعودة للمواد الخاضعة للرقابة

#### 3. إرشادات الغسيل
**اغسل فقط إذا طُلب منك ذلك:**
- رقع الفنتanyl
- أدوية السرطان معينة
- بعض أدوية الأفيونات

### ما لا تفعله
- ❌ لا تشارك الأدوية
- ❌ لا ترمي في القمامة العادية دون خلط
- ❌ لا تغسل في المرحاض إلا إذا طُلب منك ذلك
- ❌ لا تعط للأصدقاء أو العائلة

## اعتبارات خاصة

### سلامة المنزل
- استخدم حاويات مقاومة للأطفال
- احفظ بعيدا عن متناول الأطفال
- احتفظ بالأدوية في حاوياتها الأصلية
- احتفظ بقائمة جرد

### سلامة السفر
- حمل الأدوية في أمتعة اليد
- أحضر إمداد إضافي للرحلات
- احتفظ بالأدوية في درجة حرارة مناسبة
- حمل معلومات الوصفة الطبية

### الاستعداد للطوارئ
- اشمل الأدوية في مجموعات الطوارئ
- اعرف أدويتك والجرعات
- اعرف معلومات الاتصال الطارئ
- خطط للوصول للأدوية أثناء الطوارئ

## إنشاء خزانة أدوية آمنة

### العناصر الأساسية
- مقياس حرارة رقمي
- مسكنات الألم (أسيتامينوفين، إيبوبروفين)
- مضادات الهيستامين
- لوازم الإسعافات الأولية
- معلومات الاتصال الطارئ

### نصائح التنظيم
- جمع حسب أفراد الأسرة
- منفصل عن أدوية البالغين والأطفال
- احتفظ بقائمة جرد محدثة
- فحوصات منتظمة لتاريخ الانتهاء

تذكر: إدارة الأدوية المناسبة تحمي عائلتك ومجتمعك بينما تضمن نتائج صحية مثلى.',
    (SELECT id FROM blog_categories WHERE slug = 'medications'),
    'published',
    true,
    NOW() - INTERVAL '1 day',
    'Safe Medication Storage and Disposal Guidelines | Chefaa',
    'إرشادات تخزين والتخلص من الأدوية بشكل آمن | شفاء',
    'Learn proper medication storage techniques, safe disposal methods, and create a secure medicine cabinet for your family.',
    'تعلم تقنيات تخزين الأدوية المناسبة وطرق التخلص الآمن وأنشئ خزانة أدوية آمنة لعائلتك.',
    '/images/medication-storage-safety.jpg'
),
(
    'Heart Health: Prevention Tips for a Stronger Heart',
    'صحة القلب: نصائح الوقاية لقلب أقوى',
    'heart-health-prevention-tips-stronger-heart',
    'Discover essential heart health tips and lifestyle changes that can prevent cardiovascular diseases and improve your overall well-being.',
    'اكتشف نصائح صحة القلب الأساسية وتغييرات نمط الحياة التي يمكنها منع أمراض القلب والأوعية الدموية وتحسين رفاهك العام.',
    '# Heart Health: Prevention Tips for a Stronger Heart

## Understanding Heart Disease
Heart disease remains the leading cause of death worldwide, but many forms are preventable through lifestyle modifications and early intervention.

## Risk Factors You Can Control

### Diet and Nutrition
- **Reduce saturated fats**: Limit red meat, full-fat dairy
- **Increase fiber**: Fruits, vegetables, whole grains
- **Omega-3 fatty acids**: Fish, walnuts, flaxseeds
- **Limit sodium**: Less than 2,300mg daily
- **Avoid trans fats**: Read food labels carefully

### Physical Activity
- **Aim for 150 minutes** of moderate aerobic activity weekly
- **Include strength training** twice per week
- **Start gradually** if you''re new to exercise
- **Choose activities you enjoy**: Walking, swimming, dancing

### Lifestyle Choices
- **Quit smoking**: Reduces heart disease risk by 50%
- **Limit alcohol**: No more than 1 drink per day for women, 2 for men
- **Manage stress**: Practice relaxation techniques
- **Get adequate sleep**: 7-9 hours nightly

## Warning Signs to Watch For

### Chest Symptoms
- Chest pain or pressure
- Shortness of breath
- Irregular heartbeat

### Other Symptoms
- Fatigue, especially with activity
- Swelling in legs, ankles, or feet
- Dizziness or lightheadedness
- Persistent cough

## Heart-Healthy Foods

### Include More:
- **Leafy greens**: Spinach, kale, arugula
- **Berries**: Blueberries, strawberries, raspberries
- **Fish**: Salmon, mackerel, sardines
- **Nuts and seeds**: Almonds, walnuts, chia seeds
- **Whole grains**: Oats, quinoa, brown rice
- **Legumes**: Beans, lentils, chickpeas

### Limit or Avoid:
- Processed meats
- Sugary drinks and snacks
- Refined carbohydrates
- Excessive alcohol

## Creating Your Heart-Healthy Plan

### Step 1: Assessment
- Know your numbers: Blood pressure, cholesterol, blood sugar
- Schedule regular check-ups
- Discuss family history with your doctor

### Step 2: Action Plan
- Set realistic goals
- Start with small changes
- Build healthy habits gradually
- Track your progress

### Step 3: Consistency
- Make it a lifestyle, not a temporary fix
- Find support systems
- Celebrate small victories
- Stay motivated

## When to Seek Medical Help

### Regular Check-ups
- Annual physical exams
- Blood pressure monitoring
- Cholesterol screening
- Diabetes screening

### Emergency Situations
Call emergency services for:
- Chest pain lasting more than 5 minutes
- Severe shortness of breath
- Signs of heart attack

## The Power of Prevention
Small, consistent changes can significantly reduce your heart disease risk. Start today with one healthy choice, and build from there.

Remember: Your heart health is in your hands. Take control and invest in a healthier future.',
    '# صحة القلب: نصائح الوقاية لقلب أقوى

## فهم أمراض القلب
تبقى أمراض القلب السبب الرئيسي للوفاة في العالم، لكن العديد من أشكالها قابلة للوقاية من خلال تعديلات نمط الحياة والتدخل المبكر.

## عوامل الخطر التي يمكنك التحكم بها

### النظام الغذائي والتغذية
- **قلل من الدهون المشبعة**: قلل من اللحوم الحمراء ومنتجات الألبان كاملة الدسم
- **زيد الألياف**: الفواكه والخضروات والحبوب الكاملة
- **الأحماض الدهنية أوميغا-3**: الأسماك والجوز وبذور الكتان
- **قلل الصوديوم**: أقل من 2300 مجم يومياً
- **تجنب الدهون المتحولة**: اقرأ ملصقات الطعام بعناية

### النشاط البدني
- **استهدف 150 دقيقة** من النشاط الهوائي المعتدل أسبوعياً
- **اشمل تدريب القوة** مرتين أسبوعياً
- **ابدأ تدريجياً** إذا كنت جديداً في التمارين
- **اختر الأنشطة التي تستمتع بها**: المشي والسباحة والرقص

### خيارات نمط الحياة
- **قلع التدخين**: يقلل خطر أمراض القلب بنسبة 50%
- **قلل الكحول**: ليس أكثر من مشروب واحد يومياً للنساء و 2 للرجال
- **إدارة التوتر**:مارس تقنيات الاسترخاء
- **احصل على نوم كافٍ**: 7-9 ساعات ليلاً

## علامات التحذير التي يجب مراقبتها

### أعراض الصدر
- ألم أو ضغط في الصدر
- ضيق في التنفس
- عدم انتظام ضربات القلب

### أعراض أخرى
- التعب، خاصة مع النشاط
- تورم في الساقين أو الكاحلين أو القدمين
- دوخة أو خفة في الرأس
- سعال مستمر

## الأطعمة المفيدة للقلب

### اشمل أكثر:
- **الخضروات الورقية**: السبانخ واللفت والجرجير
- **التوت**: التوت الأزرق والفراولة والتوت الأحمر
- **الأسماك**: السلمون والماكريل والسردين
- **المكسرات والبذور**: اللوز والجوز وبذور الشيا
- **الحبوب الكاملة**: الشوفان والكينوا والأرز البني
- **البقوليات**: الفول والعدس والحمص

### قلل أو تجنب:
- اللحوم المصنعة
- المشروبات والوجبات الخفيفة السكرية
- الكربوهيدرات المكررة
- الكحول المفرط

## خطة صحية القلب

### الخطوة 1: التقييم
- اعرف أرقامك: ضغط الدم والكوليسترول وسكر الدم
- جدولة فحوصات منتظمة
- ناقش التاريخ العائلي مع طبيبك

### الخطوة 2: خطة العمل
- ضع أهدافاً واقعية
- ابدأ بتغييرات صغيرة
- ابن عادات صحية تدريجياً
- تتبع تقدمك

### الخطوة 3: الاتساق
- اجعله نمط حياة، وليس إصلاحاً مؤقتاً
- أنظمة دعم للعثور
- احتفل بالانتصارات الصغيرة
- أبقى متحفزاً

## متى نطلب المساعدة الطبية

### الفحوصات المنتظمة
- فحوصات طبية سنوية
- مراقبة ضغط الدم
- فحص الكوليسترول
- فحص السكري

### حالات الطوارئ
اتصل بخدمات الطوارئ لـ:
- ألم في الصدر يستمر أكثر من 5 دقائق
- ضيق شديد في التنفس
- علامات نوبة قلبية

## قوة الوقاية
التغييرات الصغيرة والثابتة يمكنها أن تقلل بشكل كبير خطر أمراض القلب. ابدأ اليوم باختيار صحي واحد، وابن من هناك.

تذكر: صحة القلب في يديك.失控 واستثمر في مستقبل صحي.',
    (SELECT id FROM blog_categories WHERE slug = 'prevention'),
    'published',
    false,
    NOW() - INTERVAL '2 days',
    'Heart Health: Prevention Tips for a Stronger Heart | Chefaa',
    'صحة القلب: نصائح الوقاية لقلب أقوى | شفاء',
    'Discover essential heart health tips, heart-healthy foods, and lifestyle changes to prevent cardiovascular disease.',
    'اكتشف نصائح صحة القلب الأساسية والأطعمة المفيدة للقلب وتغييرات نمط الحياة لمنع أمراض القلب والأوعية الدموية.',
    '/images/heart-health-prevention.jpg'
);

-- Add sample tags to blog posts
INSERT INTO blog_post_tags (post_id, tag_id) VALUES
((SELECT id FROM blog_posts WHERE slug = 'understanding-diabetes-types-symptoms-management'), (SELECT id FROM blog_tags WHERE slug = 'chronic-diseases')),
((SELECT id FROM blog_posts WHERE slug = 'understanding-diabetes-types-symptoms-management'), (SELECT id FROM blog_tags WHERE slug = 'health-tips')),
((SELECT id FROM blog_posts WHERE slug = 'safe-medication-storage-disposal-guidelines'), (SELECT id FROM blog_tags WHERE slug = 'medications')),
((SELECT id FROM blog_posts WHERE slug = 'safe-medication-storage-disposal-guidelines'), (SELECT id FROM blog_tags WHERE slug = 'safety')),
((SELECT id FROM blog_posts WHERE slug = 'heart-health-prevention-tips-stronger-heart'), (SELECT id FROM blog_tags WHERE slug = 'health-tips')),
((SELECT id FROM blog_posts WHERE slug = 'heart-health-prevention-tips-stronger-heart'), (SELECT id FROM blog_tags WHERE slug = 'nutrition')),
((SELECT id FROM blog_posts WHERE slug = 'heart-health-prevention-tips-stronger-heart'), (SELECT id FROM blog_tags WHERE slug = 'exercise'));

-- Create table for blog post media/attachments
CREATE TABLE blog_post_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    media_type VARCHAR(50), -- image, video, audio, document
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    alt_text TEXT,
    alt_text_ar TEXT,
    caption TEXT,
    caption_ar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for blog_post_media
ALTER TABLE blog_post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for blog post media" ON blog_post_media
    FOR SELECT USING (true);

CREATE POLICY "Admin full access to blog post media" ON blog_post_media
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Add indexes for blog_post_media
CREATE INDEX idx_blog_post_media_post_id ON blog_post_media(post_id);

COMMENT ON TABLE blog_posts IS 'Medical blog posts with SEO optimization and bilingual content support';
COMMENT ON TABLE blog_categories IS 'Medical blog categories for organizing content';
COMMENT ON TABLE blog_comments IS 'User comments on blog posts with moderation system';
COMMENT ON TABLE blog_tags IS 'Medical blog tags for enhanced content discovery';
COMMENT ON TABLE blog_analytics IS 'Analytics data for tracking blog post performance';
COMMENT ON TABLE medical_verifications IS 'Medical content verification by healthcare professionals';