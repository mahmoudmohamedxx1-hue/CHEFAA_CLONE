-- Social Proof System - Database Schema
-- Enhanced reviews, verification, pharmacist recommendations, and trust signals

-- ============================================================================
-- 1. REVIEWS SYSTEM
-- ============================================================================

-- Product reviews table
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Review content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  
  -- Verification status
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  is_verified_reviewer BOOLEAN DEFAULT FALSE,
  is_pharmacist_recommendation BOOLEAN DEFAULT FALSE,
  
  -- Review metadata
  helpful_votes INTEGER DEFAULT 0,
  total_votes INTEGER DEFAULT 0,
  authenticity_score DECIMAL(3,2) DEFAULT 1.0,
  verification_date TIMESTAMPTZ,
  
  -- Status and moderation
  status TEXT DEFAULT 'active', -- 'active', 'hidden', 'under_review', 'flagged'
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Photos and videos
  photos TEXT[], -- Array of image URLs
  videos TEXT[], -- Array of video URLs
  
  -- Reviewer information
  reviewer_name TEXT,
  reviewer_title TEXT, -- e.g., "Pharmacist", "Customer", "Verified Buyer"
  reviewer_location TEXT,
  
  -- Purchase details
  purchased_variant TEXT, -- Size, flavor, etc.
  usage_duration TEXT, -- e.g., "Used for 2 weeks", "Long-term user"
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Review helpfulness votes
CREATE TABLE IF NOT EXISTS review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL, -- 'helpful', 'not_helpful'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Review photos/videos
CREATE TABLE IF NOT EXISTS review_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL, -- 'photo', 'video'
  caption TEXT,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. PHARMACIST RECOMMENDATIONS
-- ============================================================================

-- Healthcare professionals table
CREATE TABLE IF NOT EXISTS healthcare_professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Professional information
  license_number TEXT NOT NULL,
  license_type TEXT NOT NULL, -- 'pharmacist', 'physician', 'nurse', 'dermatologist'
  specialty TEXT,
  license_expiry_date DATE,
  
  -- Practice information
  practice_name TEXT,
  practice_address TEXT,
  practice_phone TEXT,
  
  -- Verification status
  is_verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Rating and experience
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  years_experience INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacist product recommendations
CREATE TABLE IF NOT EXISTS pharmacist_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES healthcare_professionals(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Recommendation details
  recommendation_type TEXT NOT NULL, -- 'product_recommendation', 'general_advice', 'contraindication_warning'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- Medical context
  condition_treated TEXT,
  patient_age_group TEXT, -- 'adults', 'children', 'elderly', 'all'
  dosage_recommendation TEXT,
  duration_recommendation TEXT,
  
  -- Professional rating
  professional_rating INTEGER CHECK (professional_rating >= 1 AND professional_rating <= 5),
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'hidden', 'under_review'
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Evidence and references
  evidence_level TEXT, -- 'clinical_study', 'professional_experience', 'guidelines'
  references TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(professional_id, product_id, recommendation_type)
);

-- ============================================================================
-- 3. TRUST SIGNALS AND CERTIFICATIONS
-- ============================================================================

-- Customer satisfaction tracking
CREATE TABLE IF NOT EXISTS customer_satisfaction_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Rating metrics
  average_rating DECIMAL(2,1),
  total_reviews INTEGER DEFAULT 0,
  verified_reviews INTEGER DEFAULT 0,
  rating_distribution JSONB, -- {"1": 10, "2": 15, "3": 25, "4": 60, "5": 90}
  
  -- Satisfaction indicators
  would_recommend_percentage DECIMAL(5,2),
  satisfaction_score DECIMAL(3,2), -- 0-1 scale
  
  -- Review quality metrics
  reviews_with_photos_percentage DECIMAL(5,2),
  reviews_with_videos_percentage DECIMAL(5,2),
  average_review_length INTEGER,
  
  -- Trend indicators
  rating_trend_30d DECIMAL(3,2), -- -1 to 1 (declining to improving)
  recent_reviews_count INTEGER DEFAULT 0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);

-- Trust badges and certifications
CREATE TABLE IF NOT EXISTS product_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Certification details
  certification_type TEXT NOT NULL, -- 'fda_approved', 'clinically_tested', 'dermatologist_recommended', 'pharmacist_recommended', 'organic', 'natural'
  certification_name TEXT NOT NULL,
  issuing_body TEXT,
  certification_number TEXT,
  certification_date DATE,
  expiry_date DATE,
  
  -- Badge details
  badge_text TEXT,
  badge_description TEXT,
  badge_icon_url TEXT,
  
  -- Verification status
  is_verified BOOLEAN DEFAULT TRUE,
  verification_source TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product popularity metrics
CREATE TABLE IF NOT EXISTS product_popularity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Popularity metrics
  views_last_30d INTEGER DEFAULT 0,
  views_last_7d INTEGER DEFAULT 0,
  views_last_24h INTEGER DEFAULT 0,
  
  purchases_last_30d INTEGER DEFAULT 0,
  purchases_last_7d INTEGER DEFAULT 0,
  
  wishlists_last_30d INTEGER DEFAULT 0,
  cart_additions_last_30d INTEGER DEFAULT 0,
  
  -- Trending indicators
  is_trending BOOLEAN DEFAULT FALSE,
  trending_score DECIMAL(8,2) DEFAULT 0,
  category_rank INTEGER,
  
  -- Customer engagement
  average_cart_to_purchase_rate DECIMAL(3,2), -- 0-1 scale
  return_customer_percentage DECIMAL(5,2),
  
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);

-- ============================================================================
-- 4. REVIEW MODERATION AND QUALITY CONTROL
-- ============================================================================

-- Review moderation queue
CREATE TABLE IF NOT EXISTS review_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
  
  -- Moderation details
  moderation_type TEXT NOT NULL, -- 'auto_flag', 'user_report', 'quality_check', 'verification_check'
  reason TEXT NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  
  -- AI/ML detection results
  ai_fraud_score DECIMAL(3,2), -- 0-1 scale (higher = more likely fake)
  sentiment_analysis JSONB,
  language_detection TEXT,
  content_classification TEXT[],
  
  -- Reviewer assignment
  assigned_moderator UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'in_review', 'approved', 'rejected', 'escalated'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

-- Fake review detection algorithms results
CREATE TABLE IF NOT EXISTS review_fraud_detection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
  
  -- Detection algorithms
  linguistic_pattern_score DECIMAL(3,2), -- Analysis of writing patterns
  temporal_pattern_score DECIMAL(3,2), -- Time-based suspicious patterns
  reviewer_history_score DECIMAL(3,2), -- Reviewer's previous behavior
  correlation_score DECIMAL(3,2), -- Correlation with other suspicious reviews
  
  -- Combined fraud score
  overall_fraud_score DECIMAL(3,2), -- 0-1 scale
  
  -- Detection metadata
  detection_timestamp TIMESTAMPTZ DEFAULT NOW(),
  algorithm_version TEXT,
  false_positive_probability DECIMAL(3,2),
  
  -- Manual override
  manual_review_required BOOLEAN DEFAULT FALSE,
  override_reason TEXT
);

-- ============================================================================
-- 5. CUSTOMER TESTIMONIALS AND SUCCESS STORIES
-- ============================================================================

-- Featured customer testimonials
CREATE TABLE IF NOT EXISTS customer_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  
  -- Testimonial content
  customer_name TEXT NOT NULL,
  customer_age INTEGER,
  customer_location TEXT,
  testimonial_title TEXT,
  testimonial_content TEXT NOT NULL,
  
  -- Customer situation
  condition_treated TEXT,
  before_situation TEXT,
  after_situation TEXT,
  time_to_results TEXT,
  
  -- Verification and consent
  has_consent BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMPTZ,
  is_anonymized BOOLEAN DEFAULT FALSE,
  
  -- Media
  customer_photo_url TEXT,
  before_photo_url TEXT,
  after_photo_url TEXT,
  
  -- Status
  is_featured BOOLEAN DEFAULT FALSE,
  is_approved BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  
  -- SEO and marketing
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Product reviews indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_verified ON product_reviews(is_verified_purchase, is_verified_reviewer);
CREATE INDEX IF NOT EXISTS idx_product_reviews_pharmacist ON product_reviews(is_pharmacist_recommendation);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_featured ON product_reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created_at ON product_reviews(created_at DESC);

-- Review votes indexes
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON review_votes(user_id);

-- Healthcare professionals indexes
CREATE INDEX IF NOT EXISTS idx_healthcare_professionals_user_id ON healthcare_professionals(user_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_professionals_license ON healthcare_professionals(license_number, license_type);
CREATE INDEX IF NOT EXISTS idx_healthcare_professionals_verified ON healthcare_professionals(is_verified);

-- Pharmacist recommendations indexes
CREATE INDEX IF NOT EXISTS idx_pharmacist_recommendations_product_id ON pharmacist_recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_pharmacist_recommendations_professional_id ON pharmacist_recommendations(professional_id);
CREATE INDEX IF NOT EXISTS idx_pharmacist_recommendations_type ON pharmacist_recommendations(recommendation_type);
CREATE INDEX IF NOT EXISTS idx_pharmacist_recommendations_status ON pharmacist_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_pharmacist_recommendations_featured ON pharmacist_recommendations(is_featured);

-- Customer satisfaction metrics indexes
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_product_id ON customer_satisfaction_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_rating ON customer_satisfaction_metrics(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_customer_satisfaction_updated ON customer_satisfaction_metrics(updated_at DESC);

-- Product certifications indexes
CREATE INDEX IF NOT EXISTS idx_product_certifications_product_id ON product_certifications(product_id);
CREATE INDEX IF NOT EXISTS idx_product_certifications_type ON product_certifications(certification_type);
CREATE INDEX IF NOT EXISTS idx_product_certifications_verified ON product_certifications(is_verified);

-- Product popularity metrics indexes
CREATE INDEX IF NOT EXISTS idx_product_popularity_product_id ON product_popularity_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_popularity_trending ON product_popularity_metrics(is_trending);
CREATE INDEX IF NOT EXISTS idx_product_popularity_score ON product_popularity_metrics(trending_score DESC);

-- Review moderation indexes
CREATE INDEX IF NOT EXISTS idx_review_moderation_queue_status ON review_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_moderation_queue_priority ON review_moderation_queue(priority);
CREATE INDEX IF NOT EXISTS idx_review_moderation_queue_created ON review_moderation_queue(created_at DESC);

-- Review fraud detection indexes
CREATE INDEX IF NOT EXISTS idx_review_fraud_detection_review_id ON review_fraud_detection(review_id);
CREATE INDEX IF NOT EXISTS idx_review_fraud_detection_score ON review_fraud_detection(overall_fraud_score DESC);

-- Customer testimonials indexes
CREATE INDEX IF NOT EXISTS idx_customer_testimonials_product_id ON customer_testimonials(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_testimonials_featured ON customer_testimonials(is_featured);
CREATE INDEX IF NOT EXISTS idx_customer_testimonials_status ON customer_testimonials(status);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Product reviews: Public read for active reviews, users manage their own
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active reviews" ON product_reviews 
  FOR SELECT USING (status = 'active');
CREATE POLICY "Users can create reviews" ON product_reviews 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON product_reviews 
  FOR UPDATE USING (auth.uid() = user_id);

-- Review votes: Users manage their own votes
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own votes" ON review_votes 
  FOR ALL USING (auth.uid() = user_id);

-- Healthcare professionals: Public read for verified professionals
ALTER TABLE healthcare_professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read verified professionals" ON healthcare_professionals 
  FOR SELECT USING (is_verified = true);
CREATE POLICY "Users can create own profile" ON healthcare_professionals 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON healthcare_professionals 
  FOR UPDATE USING (auth.uid() = user_id);

-- Pharmacist recommendations: Public read for active recommendations
ALTER TABLE pharmacist_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active recommendations" ON pharmacist_recommendations 
  FOR SELECT USING (status = 'active');

-- Customer satisfaction metrics: Public read
ALTER TABLE customer_satisfaction_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read satisfaction metrics" ON customer_satisfaction_metrics 
  FOR SELECT USING (true);

-- Product certifications: Public read
ALTER TABLE product_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read certifications" ON product_certifications 
  FOR SELECT USING (true);

-- Product popularity metrics: Public read
ALTER TABLE product_popularity_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read popularity metrics" ON product_popularity_metrics 
  FOR SELECT USING (true);

-- Review moderation: Admin/moderator access only
ALTER TABLE review_moderation_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Moderators can manage moderation queue" ON review_moderation_queue 
  FOR ALL USING (auth.role() = 'moderator' OR auth.role() = 'admin');

-- Review fraud detection: Admin access only
ALTER TABLE review_fraud_detection ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin access only" ON review_fraud_detection 
  FOR ALL USING (auth.role() = 'admin');

-- Customer testimonials: Public read for approved testimonials
ALTER TABLE customer_testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read approved testimonials" ON customer_testimonials 
  FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can create testimonials" ON customer_testimonials 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Calculate average rating and review statistics
CREATE OR REPLACE FUNCTION update_product_review_metrics(p_product_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO customer_satisfaction_metrics (
    product_id,
    average_rating,
    total_reviews,
    verified_reviews,
    rating_distribution,
    would_recommend_percentage,
    satisfaction_score,
    reviews_with_photos_percentage,
    reviews_with_videos_percentage,
    average_review_length,
    recent_reviews_count
  )
  SELECT 
    p_product_id,
    COALESCE(AVG(rating), 0)::DECIMAL(2,1),
    COUNT(*),
    COUNT(*) FILTER (WHERE is_verified_purchase = true),
    json_object_agg(rating::text, rating_count)::JSONB,
    -- Would recommend percentage (assuming 4-5 star ratings recommend)
    (COUNT(*) FILTER (WHERE rating >= 4) * 100.0 / NULLIF(COUNT(*), 0))::DECIMAL(5,2),
    -- Satisfaction score (normalized to 0-1)
    COALESCE(AVG(rating), 0) / 5.0,
    -- Reviews with photos percentage
    (COUNT(*) FILTER (WHERE array_length(photos, 1) > 0) * 100.0 / NULLIF(COUNT(*), 0))::DECIMAL(5,2),
    -- Reviews with videos percentage
    (COUNT(*) FILTER (WHERE array_length(videos, 1) > 0) * 100.0 / NULLIF(COUNT(*), 0))::DECIMAL(5,2),
    -- Average review length
    AVG(length(content))::INTEGER,
    -- Recent reviews count (last 30 days)
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')
  FROM product_reviews
  WHERE product_id = p_product_id 
    AND status = 'active'
  GROUP BY product_id
  ON CONFLICT (product_id) DO UPDATE SET
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews,
    verified_reviews = EXCLUDED.verified_reviews,
    rating_distribution = EXCLUDED.rating_distribution,
    would_recommend_percentage = EXCLUDED.would_recommend_percentage,
    satisfaction_score = EXCLUDED.satisfaction_score,
    reviews_with_photos_percentage = EXCLUDED.reviews_with_photos_percentage,
    reviews_with_videos_percentage = EXCLUDED.reviews_with_videos_percentage,
    average_review_length = EXCLUDED.average_review_length,
    recent_reviews_count = EXCLUDED.recent_reviews_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Get top trending products
CREATE OR REPLACE FUNCTION get_trending_products(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_price DECIMAL,
  product_images TEXT[],
  trending_score DECIMAL,
  total_reviews INTEGER,
  average_rating DECIMAL(2,1)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.images,
    ppm.trending_score,
    COALESCE(csm.total_reviews, 0),
    COALESCE(csm.average_rating, 0)
  FROM product_popularity_metrics ppm
  JOIN products p ON p.id = ppm.product_id
  LEFT JOIN customer_satisfaction_metrics csm ON csm.product_id = p.id
  WHERE ppm.is_trending = true
    AND p.stock_quantity > 0
  ORDER BY ppm.trending_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get product review summary
CREATE OR REPLACE FUNCTION get_product_review_summary(p_product_id UUID)
RETURNS TABLE (
  total_reviews INTEGER,
  average_rating DECIMAL(2,1),
  verified_reviews INTEGER,
  pharmacist_recommendations INTEGER,
  featured_reviews INTEGER,
  rating_distribution JSONB,
  satisfaction_score DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(csm.total_reviews, 0),
    COALESCE(csm.average_rating, 0),
    COALESCE(csm.verified_reviews, 0),
    COUNT(pr.id) FILTER (WHERE pr.is_pharmacist_recommendation = true),
    COUNT(pr.id) FILTER (WHERE pr.is_featured = true),
    COALESCE(csm.rating_distribution, '{}'::JSONB),
    COALESCE(csm.satisfaction_score, 0)
  FROM products p
  LEFT JOIN customer_satisfaction_metrics csm ON csm.product_id = p.id
  LEFT JOIN product_reviews pr ON pr.product_id = p.id AND pr.status = 'active'
  WHERE p.id = p_product_id
  GROUP BY p.id, csm.total_reviews, csm.average_rating, csm.verified_reviews, csm.rating_distribution, csm.satisfaction_score;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_product_review_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_trending_products TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_product_review_summary TO anon, authenticated;