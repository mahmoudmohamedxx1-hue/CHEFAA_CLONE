-- Educational Video System Tables
-- This migration creates the database structure for the educational video library system

-- Educational Videos Table
CREATE TABLE IF NOT EXISTS educational_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255),
    description TEXT,
    description_ar TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER NOT NULL, -- in seconds
    category VARCHAR(50) NOT NULL,
    medical_level VARCHAR(20) NOT NULL CHECK (medical_level IN ('beginner', 'intermediate', 'advanced')),
    instructor_name VARCHAR(255),
    instructor_name_ar VARCHAR(255),
    language VARCHAR(5) DEFAULT 'en' CHECK (language IN ('ar', 'en')),
    views_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    total_likes INTEGER DEFAULT 0,
    total_dislikes INTEGER DEFAULT 0,
    total_shares INTEGER DEFAULT 0,
    has_transcript BOOLEAN DEFAULT FALSE,
    transcript_url TEXT,
    related_products JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    seo_title VARCHAR(255),
    seo_description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    tags TEXT[],
    tags_ar TEXT[],
    featured_thumbnail_url TEXT,
    completion_rate DECIMAL(5,2) DEFAULT 0, -- percentage
    total_watch_time INTEGER DEFAULT 0, -- in seconds
    created_by UUID REFERENCES auth.users(id),
    
    -- Add indexes for better performance
    CONSTRAINT check_category CHECK (category IN (
        'medication-guides', 
        'how-to-use', 
        'health-tips', 
        'emergency-procedures', 
        'nutrition-wellness', 
        'medical-devices'
    ))
);

-- Video Tags Table (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS video_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES educational_videos(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_name_ar VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Progress Tracking Table
CREATE TABLE IF NOT EXISTS video_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES educational_videos(id) ON DELETE CASCADE,
    current_time INTEGER DEFAULT 0, -- in seconds
    duration INTEGER NOT NULL, -- in seconds
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    last_watched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one progress record per user per video
    UNIQUE(user_id, video_id)
);

-- Video Analytics Table (for tracking views, engagement, etc.)
CREATE TABLE IF NOT EXISTS video_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES educational_videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('view', 'like', 'dislike', 'share', 'comment', 'complete')),
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    country VARCHAR(2),
    city VARCHAR(100),
    device_type VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Comments Table
CREATE TABLE IF NOT EXISTS video_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID REFERENCES educational_videos(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES video_comments(id) ON DELETE CASCADE, -- for replies
    comment TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video Favorites/Bookmarks Table
CREATE TABLE IF NOT EXISTS video_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    video_id UUID REFERENCES educational_videos(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one favorite per user per video
    UNIQUE(user_id, video_id)
);

-- Video Categories Table (for more flexible categorization)
CREATE TABLE IF NOT EXISTS video_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100),
    description TEXT,
    description_ar TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO video_categories (name, name_ar, description, icon, sort_order) VALUES
('Medication Guides', 'أدلة الأدوية', 'Instructions and guides for proper medication usage', 'medication', 1),
('How to Use', 'طريقة الاستخدام', 'Step-by-step guides for medical devices and procedures', 'guide', 2),
('Health Tips', 'نصائح صحية', 'General health and wellness tips', 'health', 3),
('Emergency Procedures', 'إجراءات الطوارئ', 'Life-saving emergency procedures and first aid', 'emergency', 4),
('Nutrition & Wellness', 'التغذية والعافية', 'Nutrition guidance and wellness advice', 'nutrition', 5),
('Medical Devices', 'الأجهزة الطبية', 'How to use and maintain medical devices', 'device', 6)
ON CONFLICT DO NOTHING;

-- Create Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_educational_videos_category ON educational_videos(category);
CREATE INDEX IF NOT EXISTS idx_educational_videos_medical_level ON educational_videos(medical_level);
CREATE INDEX IF NOT EXISTS idx_educational_videos_language ON educational_videos(language);
CREATE INDEX IF NOT EXISTS idx_educational_videos_published ON educational_videos(published);
CREATE INDEX IF NOT EXISTS idx_educational_videos_featured ON educational_videos(featured);
CREATE INDEX IF NOT EXISTS idx_educational_videos_created_at ON educational_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_educational_videos_views ON educational_videos(views_count DESC);
CREATE INDEX IF NOT EXISTS idx_educational_videos_rating ON educational_videos(rating DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_educational_videos_category_published ON educational_videos(category, published);
CREATE INDEX IF NOT EXISTS idx_educational_videos_language_published ON educational_videos(language, published);

-- Indexes for related tables
CREATE INDEX IF NOT EXISTS idx_video_progress_user_video ON video_progress(user_id, video_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_user ON video_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_completed ON video_progress(completed);
CREATE INDEX IF NOT EXISTS idx_video_analytics_video_event ON video_analytics(video_id, event_type);
CREATE INDEX IF NOT EXISTS idx_video_analytics_user ON video_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_video_analytics_created ON video_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_comments_video ON video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_user ON video_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_approved ON video_comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_video_favorites_user ON video_favorites(user_id);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_educational_videos_search ON educational_videos 
USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_educational_videos_search_ar ON educational_videos 
USING gin(to_tsvector('arabic', COALESCE(title_ar, '') || ' ' || COALESCE(description_ar, '')));

-- Enable Row Level Security (RLS)
ALTER TABLE educational_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for educational_videos (public read, admin write)
CREATE POLICY "Public videos are viewable by everyone" 
ON educational_videos FOR SELECT 
USING (is_public = TRUE AND published = TRUE);

CREATE POLICY "Users can view all published videos" 
ON educational_videos FOR SELECT 
USING (published = TRUE);

CREATE POLICY "Authenticated users can view all videos" 
ON educational_videos FOR SELECT 
TO authenticated
USING (TRUE);

CREATE POLICY "Admins can manage videos" 
ON educational_videos FOR ALL 
TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for video_progress
CREATE POLICY "Users can view their own video progress" 
ON video_progress FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own video progress" 
ON video_progress FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video progress" 
ON video_progress FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for video_analytics
CREATE POLICY "Users can view their own analytics" 
ON video_analytics FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" 
ON video_analytics FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for video_comments
CREATE POLICY "Anyone can view approved comments" 
ON video_comments FOR SELECT 
USING (is_approved = TRUE);

CREATE POLICY "Users can view their own comments" 
ON video_comments FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own comments" 
ON video_comments FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON video_comments FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON video_comments FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for video_favorites
CREATE POLICY "Users can view their own favorites" 
ON video_favorites FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
ON video_favorites FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
ON video_favorites FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Create Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Triggers for updated_at
CREATE TRIGGER update_educational_videos_updated_at 
BEFORE UPDATE ON educational_videos 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_progress_updated_at 
BEFORE UPDATE ON video_progress 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_comments_updated_at 
BEFORE UPDATE ON video_comments 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get video statistics
CREATE OR REPLACE FUNCTION get_video_stats(video_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_views', COUNT(*) FILTER (WHERE event_type = 'view'),
        'total_completions', COUNT(*) FILTER (WHERE event_type = 'complete'),
        'average_rating', AVG(rating),
        'total_likes', COUNT(*) FILTER (WHERE event_type = 'like'),
        'total_shares', COUNT(*) FILTER (WHERE event_type = 'share'),
        'completion_rate', CASE 
            WHEN COUNT(*) FILTER (WHERE event_type = 'view') > 0 
            THEN ROUND((COUNT(*) FILTER (WHERE event_type = 'complete')::DECIMAL / COUNT(*) FILTER (WHERE event_type = 'view')) * 100, 2)
            ELSE 0 
        END
    ) INTO result
    FROM video_analytics
    WHERE video_id = video_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update video views count
CREATE OR REPLACE FUNCTION increment_video_views(video_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE educational_videos 
    SET views_count = views_count + 1 
    WHERE id = video_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;