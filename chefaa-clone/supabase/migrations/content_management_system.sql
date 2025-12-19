-- Content Management System Migration
-- Creates tables for content blocks, A/B testing, personalization, analytics, and multi-channel content

-- Content Blocks Table
CREATE TABLE IF NOT EXISTS content_blocks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hero', 'banner', 'product_grid', 'testimonial', 'cta', 'promotion')),
  position TEXT NOT NULL CHECK (position IN ('homepage', 'category', 'product_detail', 'search', 'cart')),
  content JSONB NOT NULL DEFAULT '{}',
  schedule JSONB,
  targeting JSONB,
  ab_test_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'scheduled', 'paused', 'expired')),
  performance JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Templates Table
CREATE TABLE IF NOT EXISTS content_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  structure JSONB NOT NULL,
  variables JSONB DEFAULT '[]',
  preview JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Tests Table
CREATE TABLE IF NOT EXISTS ab_tests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  type TEXT NOT NULL CHECK (type IN ('content', 'design', 'functionality', 'promotion')),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'logged_in', 'new_users', 'returning_users', 'segment')),
  segments TEXT[],
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  variants JSONB NOT NULL DEFAULT '[]',
  metrics JSONB NOT NULL DEFAULT '[]',
  allocation JSONB NOT NULL DEFAULT '{}',
  results JSONB,
  winner TEXT,
  confidence DECIMAL(5,2),
  significance BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User A/B Test Sessions Table
CREATE TABLE IF NOT EXISTS user_ab_test_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  test_id TEXT NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted BOOLEAN DEFAULT false,
  metrics JSONB DEFAULT '{}'
);

-- User Profiles Table (for personalization)
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  segments TEXT[] DEFAULT '{}',
  preferences JSONB NOT NULL DEFAULT '{}',
  behavior JSONB NOT NULL DEFAULT '{}',
  demographics JSONB DEFAULT '{}',
  location JSONB DEFAULT '{}',
  device JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personalization Rules Table
CREATE TABLE IF NOT EXISTS personalization_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '[]',
  actions JSONB NOT NULL DEFAULT '[]',
  priority INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Segments Table
CREATE TABLE IF NOT EXISTS user_segments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL DEFAULT '[]',
  size INTEGER DEFAULT 0,
  characteristics TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personalization Events Table
CREATE TABLE IF NOT EXISTS personalization_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  event_type TEXT NOT NULL,
  content_id TEXT,
  product_id TEXT,
  value DECIMAL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Content Analytics Events Table
CREATE TABLE IF NOT EXISTS content_analytics_events (
  id TEXT PRIMARY KEY,
  content_id TEXT,
  user_id TEXT,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Performance Table
CREATE TABLE IF NOT EXISTS content_performance (
  id TEXT PRIMARY KEY,
  content_id TEXT REFERENCES content_blocks(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  unique_impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,4) DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  bounce_rate DECIMAL(5,4) DEFAULT 0,
  avg_time_on_content INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  roi DECIMAL(8,4),
  ranking_position INTEGER,
  total_content INTEGER,
  percentile DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  seo_score DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE
);

-- User Journeys Table
CREATE TABLE IF NOT EXISTS user_journeys (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_id TEXT NOT NULL,
  converted BOOLEAN DEFAULT false,
  revenue_value DECIMAL(10,2) DEFAULT 0,
  device_type TEXT,
  user_location TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Journey Steps Table
CREATE TABLE IF NOT EXISTS journey_steps (
  id TEXT PRIMARY KEY,
  journey_id TEXT REFERENCES user_journeys(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  content_id TEXT,
  action_type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_seconds INTEGER DEFAULT 0
);

-- Conversions Table
CREATE TABLE IF NOT EXISTS conversions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  session_id TEXT,
  value DECIMAL(10,2),
  converted BOOLEAN DEFAULT true,
  conversion_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversion Events Table
CREATE TABLE IF NOT EXISTS conversion_events (
  id TEXT PRIMARY KEY,
  conversion_id TEXT REFERENCES conversions(id) ON DELETE CASCADE,
  content_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  position INTEGER
);

-- Multi-Channel Content Table
CREATE TABLE IF NOT EXISTS multi_channel_content (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  channels TEXT[] NOT NULL,
  content JSONB NOT NULL DEFAULT '[]',
  schedule JSONB,
  targeting JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
  analytics JSONB DEFAULT '{}',
  campaign_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Campaigns Table
CREATE TABLE IF NOT EXISTS content_campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  objective TEXT NOT NULL,
  content_ids TEXT[] DEFAULT '{}',
  budget JSONB NOT NULL DEFAULT '{}',
  timeline JSONB NOT NULL DEFAULT '{}',
  kpis JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'approved', 'launched', 'active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Analytics Summary Table
CREATE TABLE IF NOT EXISTS content_analytics_summary (
  id TEXT PRIMARY KEY,
  content_id TEXT,
  content_name TEXT,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  engagement_rate DECIMAL(5,4) DEFAULT 0,
  conversion_rate DECIMAL(5,4) DEFAULT 0,
  bounce_rate DECIMAL(5,4) DEFAULT 0,
  roi DECIMAL(8,4),
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_blocks_status ON content_blocks(status);
CREATE INDEX IF NOT EXISTS idx_content_blocks_position ON content_blocks(position);
CREATE INDEX IF NOT EXISTS idx_content_blocks_type ON content_blocks(type);
CREATE INDEX IF NOT EXISTS idx_content_blocks_schedule ON content_blocks USING GIN(schedule);

CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_type ON ab_tests(type);
CREATE INDEX IF NOT EXISTS idx_ab_tests_start_date ON ab_tests(start_date);

CREATE INDEX IF NOT EXISTS idx_user_ab_test_sessions_test_id ON user_ab_test_sessions(test_id);
CREATE INDEX IF NOT EXISTS idx_user_ab_test_sessions_user_id ON user_ab_test_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_personalization_events_user_id ON personalization_events(user_id);
CREATE INDEX IF NOT EXISTS idx_personalization_events_event_type ON personalization_events(event_type);
CREATE INDEX IF NOT EXISTS idx_personalization_events_timestamp ON personalization_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_content_analytics_events_content_id ON content_analytics_events(content_id);
CREATE INDEX IF NOT EXISTS idx_content_analytics_events_timestamp ON content_analytics_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_content_performance_content_id ON content_performance(content_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_date ON content_performance(date);

CREATE INDEX IF NOT EXISTS idx_user_journeys_user_id ON user_journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_journeys_started_at ON user_journeys(started_at);

CREATE INDEX IF NOT EXISTS idx_journey_steps_journey_id ON journey_steps(journey_id);
CREATE INDEX IF NOT EXISTS idx_journey_steps_timestamp ON journey_steps(timestamp);

CREATE INDEX IF NOT EXISTS idx_multi_channel_content_status ON multi_channel_content(status);
CREATE INDEX IF NOT EXISTS idx_multi_channel_content_type ON multi_channel_content(type);
CREATE INDEX IF NOT EXISTS idx_multi_channel_content_channels ON multi_channel_content USING GIN(channels);

-- Create functions for content metrics calculation
CREATE OR REPLACE FUNCTION calculate_content_metrics(content_id_param TEXT, start_date_param TIMESTAMP, end_date_param TIMESTAMP)
RETURNS TABLE (
  impressions_count BIGINT,
  clicks_count BIGINT,
  conversions_count BIGINT,
  revenue_sum DECIMAL,
  engagement_rate_avg DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'impression') as impressions_count,
    COUNT(*) FILTER (WHERE event_type = 'click') as clicks_count,
    COUNT(*) FILTER (WHERE event_type = 'conversion') as conversions_count,
    COALESCE(SUM(value) FILTER (WHERE event_type = 'conversion'), 0) as revenue_sum,
    ROUND(
      COUNT(*) FILTER (WHERE event_type = 'click') * 100.0 / 
      NULLIF(COUNT(*) FILTER (WHERE event_type = 'impression'), 0), 
      4
    ) as engagement_rate_avg
  FROM content_analytics_events
  WHERE content_id = content_id_param 
    AND timestamp >= start_date_param 
    AND timestamp <= end_date_param;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate A/B test results
CREATE OR REPLACE FUNCTION calculate_ab_test_results(test_id_param TEXT)
RETURNS JSON AS $$
DECLARE
  result_json JSON;
BEGIN
  SELECT json_build_object(
    'total_participants', COUNT(DISTINCT session_id),
    'total_conversions', COUNT(DISTINCT session_id) FILTER (WHERE converted = true),
    'conversion_rate', ROUND(
      COUNT(DISTINCT session_id) FILTER (WHERE converted = true) * 100.0 / 
      NULLIF(COUNT(DISTINCT session_id), 0), 
      4
    ),
    'variants', (
      SELECT json_agg(
        json_build_object(
          'variant_id', variant_id,
          'participants', COUNT(DISTINCT session_id),
          'conversions', COUNT(DISTINCT session_id) FILTER (WHERE converted = true),
          'conversion_rate', ROUND(
            COUNT(DISTINCT session_id) FILTER (WHERE converted = true) * 100.0 / 
            NULLIF(COUNT(DISTINCT session_id), 0), 
            4
          )
        )
      )
      FROM user_ab_test_sessions
      WHERE test_id = test_id_param
      GROUP BY variant_id
    )
  ) INTO result_json;
  
  RETURN result_json;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO content_blocks (id, name, type, position, content, status) VALUES
('block_hero_homepage', 'Homepage Hero', 'hero', 'homepage', '{
  "title": "Welcome to Chefaa Pharmacy",
  "subtitle": "Your trusted online pharmacy partner",
  "backgroundImage": "/images/hero-bg.jpg",
  "primaryCTA": {"text": "Shop Now", "url": "/products", "style": "button"},
  "layout": "centered"
}', 'active'),
('block_banner_sale', 'Summer Sale Banner', 'banner', 'homepage', '{
  "title": "Summer Sale",
  "subtitle": "Up to 50% off on selected medications",
  "backgroundColor": "#f59e0b",
  "cta": {"text": "Shop Sale", "url": "/sale", "style": "button"},
  "layout": "contained"
}', 'active'),
('block_products_featured', 'Featured Products', 'product_grid', 'homepage', '{
  "title": "Featured Products",
  "products": [],
  "layout": "grid",
  "columns": 4,
  "showRating": true,
  "showPrice": true
}', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert sample A/B test
INSERT INTO ab_tests (id, name, description, type, variants, metrics, allocation, status) VALUES
('test_hero_cta', 'Hero CTA Test', 'Testing different call-to-action buttons in hero section', 'content', '[
  {
    "id": "control",
    "name": "Control",
    "content": {"ctaText": "Shop Now", "style": "primary"},
    "allocation": 50,
    "isControl": true
  },
  {
    "id": "variant_a",
    "name": "Variant A", 
    "content": {"ctaText": "Explore Products", "style": "secondary"},
    "allocation": 50,
    "isControl": false
  }
]', '[
  {"name": "click_through_rate", "type": "engagement", "goal": "increase"},
  {"name": "conversion_rate", "type": "conversion", "goal": "increase"}
]', '{
  "strategy": "equal",
  "trafficSplit": {"control": 50, "variant_a": 50}
}', 'draft')
ON CONFLICT (id) DO NOTHING;

-- Insert sample personalization rules
INSERT INTO personalization_rules (id, name, description, conditions, actions, priority) VALUES
('rule_new_users', 'Welcome New Users', 'Show welcome content to first-time visitors', '[
  {
    "type": "behavior",
    "field": "totalSessions",
    "operator": "equals",
    "value": 1
  }
]', '[
  {
    "type": "show_block",
    "parameters": {"blockId": "welcome_hero"}
  }
]', 10),
('rule_returning_customers', 'Returning Customer Experience', 'Personalized content for returning customers', '[
  {
    "type": "behavior", 
    "field": "totalSessions",
    "operator": "greater_than",
    "value": 5
  }
]', '[
  {
    "type": "recommend_content",
    "parameters": {"content": ["personalized_products", "exclusive_offers"]}
  }
]', 8)
ON CONFLICT (id) DO NOTHING;

-- Insert sample user segments
INSERT INTO user_segments (id, name, description, criteria, characteristics) VALUES
('segment_new_users', 'New Users', 'First-time visitors to the site', '[
  {"field": "totalSessions", "operator": "equals", "value": 1, "weight": 1}
]', '{"behavior": "first_visit", "intent": "exploring"}'),
('segment_loyal_customers', 'Loyal Customers', 'Customers with high purchase frequency', '[
  {"field": "purchaseCount", "operator": "greater_than", "value": 5, "weight": 1},
  {"field": "totalSpent", "operator": "greater_than", "value": 500, "weight": 0.8}
]', '{"loyalty": "high", "value": "high"}')
ON CONFLICT (id) DO NOTHING;