-- Migration: medical_blog_system
-- Created at: 1762085669

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
('Pharmacy', 'الصيدلة', 'pharmacy', 'Pharmacy services and medication management', 'خدمات الصيدلة وإدارة الأدوية');;