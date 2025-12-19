-- Phase 2: Enhanced E-commerce Features - Database Schema
-- Analytics, Recommendations, Cart Abandonment, Bulk Orders, Search Enhancement

-- ============================================================================
-- 1. USER ANALYTICS TRACKING
-- ============================================================================

-- User sessions and page views
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  device_type TEXT,
  browser TEXT,
  location TEXT,
  ip_address INET,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_page_views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page view tracking
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  dwell_time INTEGER, -- seconds
  scroll_depth INTEGER, -- percentage
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product interaction tracking
CREATE TABLE IF NOT EXISTS product_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- 'view', 'quick_view', 'add_to_cart', 'wishlist', 'click'
  interaction_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Click heatmap data
CREATE TABLE IF NOT EXISTS click_heatmap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT NOT NULL,
  element_selector TEXT,
  click_x INTEGER,
  click_y INTEGER,
  viewport_width INTEGER,
  viewport_height INTEGER,
  device_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. SMART RECOMMENDATIONS
-- ============================================================================

-- Product co-purchase patterns
CREATE TABLE IF NOT EXISTS product_copurchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_a_id UUID REFERENCES products(id) ON DELETE CASCADE,
  product_b_id UUID REFERENCES products(id) ON DELETE CASCADE,
  copurchase_count INTEGER DEFAULT 1,
  confidence_score DECIMAL(3,2) DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_a_id, product_b_id)
);

-- User product preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  preference_score DECIMAL(3,2) DEFAULT 0, -- 0-1 scale
  view_count INTEGER DEFAULT 0,
  last_viewed TIMESTAMPTZ,
  purchased BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================================
-- 3. CART ABANDONMENT TRACKING
-- ============================================================================

-- Abandoned carts
CREATE TABLE IF NOT EXISTS abandoned_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  cart_data JSONB NOT NULL, -- Store full cart contents
  cart_total DECIMAL(10,2),
  abandoned_at TIMESTAMPTZ DEFAULT NOW(),
  recovery_status TEXT DEFAULT 'pending', -- 'pending', 'email_sent', 'recovered', 'expired'
  recovery_attempts INTEGER DEFAULT 0,
  last_reminder_sent TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cart recovery campaigns
CREATE TABLE IF NOT EXISTS cart_recovery_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  abandoned_cart_id UUID REFERENCES abandoned_carts(id) ON DELETE CASCADE,
  campaign_type TEXT NOT NULL, -- 'email_1h', 'email_24h', 'email_3d', 'sms'
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  recovered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. BULK ORDERING SYSTEM
-- ============================================================================

-- Bulk order requests
CREATE TABLE IF NOT EXISTS bulk_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name TEXT,
  organization_type TEXT, -- 'hospital', 'clinic', 'pharmacy', 'corporate'
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  order_data JSONB NOT NULL, -- Array of {product_id, quantity, custom_price}
  total_items INTEGER,
  estimated_total DECIMAL(10,2),
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'processing', 'completed', 'rejected'
  approval_notes TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT, -- 'weekly', 'monthly', 'quarterly'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bulk order templates
CREATE TABLE IF NOT EXISTS bulk_order_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_data JSONB NOT NULL, -- Saved product list with quantities
  last_used TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. ENHANCED SEARCH TRACKING
-- ============================================================================

-- Search query analytics
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  query_type TEXT DEFAULT 'text', -- 'text', 'voice', 'autocomplete'
  results_count INTEGER,
  result_clicked BOOLEAN DEFAULT FALSE,
  clicked_position INTEGER,
  clicked_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search auto-complete suggestions
CREATE TABLE IF NOT EXISTS search_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_text TEXT NOT NULL UNIQUE,
  search_count INTEGER DEFAULT 1,
  click_through_rate DECIMAL(3,2) DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);

-- Page views
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_url ON page_views(page_url);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);

-- Product interactions
CREATE INDEX IF NOT EXISTS idx_product_interactions_product_id ON product_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_interactions_user_id ON product_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_product_interactions_type ON product_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_product_interactions_created_at ON product_interactions(created_at DESC);

-- Click heatmap
CREATE INDEX IF NOT EXISTS idx_click_heatmap_page_url ON click_heatmap(page_url);
CREATE INDEX IF NOT EXISTS idx_click_heatmap_created_at ON click_heatmap(created_at DESC);

-- Product copurchases
CREATE INDEX IF NOT EXISTS idx_copurchases_product_a ON product_copurchases(product_a_id);
CREATE INDEX IF NOT EXISTS idx_copurchases_product_b ON product_copurchases(product_b_id);
CREATE INDEX IF NOT EXISTS idx_copurchases_score ON product_copurchases(confidence_score DESC);

-- User preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_product_id ON user_preferences(product_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_score ON user_preferences(preference_score DESC);

-- Abandoned carts
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_user_id ON abandoned_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON abandoned_carts(recovery_status);
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_abandoned_at ON abandoned_carts(abandoned_at DESC);

-- Bulk orders
CREATE INDEX IF NOT EXISTS idx_bulk_orders_user_id ON bulk_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_status ON bulk_orders(status);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_created_at ON bulk_orders(created_at DESC);

-- Search queries
CREATE INDEX IF NOT EXISTS idx_search_queries_query_text ON search_queries(query_text);
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON search_queries(created_at DESC);

-- Search suggestions
CREATE INDEX IF NOT EXISTS idx_search_suggestions_text ON search_suggestions(suggestion_text);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_count ON search_suggestions(search_count DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- User sessions: Users can view their own sessions
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);

-- Page views: Users can insert and view their own
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create page views" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own page views" ON page_views FOR SELECT USING (auth.uid() = user_id);

-- Product interactions: Public insert, users view own
ALTER TABLE product_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create interactions" ON product_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own interactions" ON product_interactions FOR SELECT USING (auth.uid() = user_id);

-- Abandoned carts: Users can view and update their own
ALTER TABLE abandoned_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own abandoned carts" ON abandoned_carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own abandoned carts" ON abandoned_carts FOR UPDATE USING (auth.uid() = user_id);

-- Bulk orders: Users can create and view their own
ALTER TABLE bulk_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create bulk orders" ON bulk_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own bulk orders" ON bulk_orders FOR SELECT USING (auth.uid() = user_id);

-- Bulk order templates: Users can manage their own templates
ALTER TABLE bulk_order_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own templates" ON bulk_order_templates FOR ALL USING (auth.uid() = user_id);

-- Search queries: Public insert for analytics
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can create search queries" ON search_queries FOR INSERT WITH CHECK (true);

-- Search suggestions: Public read
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read suggestions" ON search_suggestions FOR SELECT USING (active = true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Update copurchase counts automatically
CREATE OR REPLACE FUNCTION update_copurchase_patterns()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update copurchase relationships when order is completed
  IF NEW.status = 'completed' THEN
    INSERT INTO product_copurchases (product_a_id, product_b_id, copurchase_count)
    SELECT 
      oi1.product_id as product_a_id,
      oi2.product_id as product_b_id,
      1
    FROM order_items oi1
    JOIN order_items oi2 ON oi1.order_id = oi2.order_id
    WHERE oi1.order_id = NEW.id
      AND oi1.product_id < oi2.product_id
    ON CONFLICT (product_a_id, product_b_id) 
    DO UPDATE SET 
      copurchase_count = product_copurchases.copurchase_count + 1,
      last_updated = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for copurchase tracking
DROP TRIGGER IF EXISTS trigger_update_copurchase ON orders;
CREATE TRIGGER trigger_update_copurchase
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_copurchase_patterns();

-- Get product recommendations based on copurchases
CREATE OR REPLACE FUNCTION get_product_recommendations(
  p_product_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  product_price DECIMAL,
  product_images TEXT[],
  copurchase_count INTEGER,
  confidence_score DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.price,
    p.images,
    pc.copurchase_count,
    pc.confidence_score
  FROM product_copurchases pc
  JOIN products p ON (
    CASE 
      WHEN pc.product_a_id = p_product_id THEN p.id = pc.product_b_id
      ELSE p.id = pc.product_a_id
    END
  )
  WHERE (pc.product_a_id = p_product_id OR pc.product_b_id = p_product_id)
    AND p.stock_quantity > 0
  ORDER BY pc.confidence_score DESC, pc.copurchase_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Track cart abandonment
CREATE OR REPLACE FUNCTION track_cart_abandonment(
  p_user_id UUID,
  p_session_id UUID,
  p_cart_data JSONB,
  p_cart_total DECIMAL
)
RETURNS UUID AS $$
DECLARE
  v_abandoned_cart_id UUID;
BEGIN
  INSERT INTO abandoned_carts (user_id, session_id, cart_data, cart_total)
  VALUES (p_user_id, p_session_id, p_cart_data, p_cart_total)
  RETURNING id INTO v_abandoned_cart_id;
  
  RETURN v_abandoned_cart_id;
END;
$$ LANGUAGE plpgsql;

-- Get trending search suggestions
CREATE OR REPLACE FUNCTION get_search_suggestions(
  p_query TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  suggestion TEXT,
  search_count INTEGER,
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.suggestion_text,
    ss.search_count,
    c.name as category
  FROM search_suggestions ss
  LEFT JOIN categories c ON ss.category_id = c.id
  WHERE ss.active = true
    AND ss.suggestion_text ILIKE p_query || '%'
  ORDER BY ss.priority DESC, ss.search_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_product_recommendations TO anon, authenticated;
GRANT EXECUTE ON FUNCTION track_cart_abandonment TO authenticated;
GRANT EXECUTE ON FUNCTION get_search_suggestions TO anon, authenticated;
