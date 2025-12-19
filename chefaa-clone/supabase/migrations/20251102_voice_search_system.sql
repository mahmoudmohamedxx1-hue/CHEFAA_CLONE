-- Voice Search Tables Migration
-- Creates tables for voice search functionality

-- Voice commands log table
CREATE TABLE IF NOT EXISTS voice_commands_log (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  transcript TEXT NOT NULL,
  action VARCHAR(100),
  parameters JSONB DEFAULT '{}',
  confidence DECIMAL(3,2) DEFAULT 0.0,
  language VARCHAR(5) DEFAULT 'en',
  success BOOLEAN DEFAULT false,
  response_time INTEGER, -- in milliseconds
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Search queries table enhancement
ALTER TABLE search_queries 
ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en';

-- Search suggestions table enhancement
ALTER TABLE search_suggestions 
ADD COLUMN IF NOT EXISTS language VARCHAR(5) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS voice_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_voice_used TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_voice_commands_log_session ON voice_commands_log(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_log_created ON voice_commands_log(created_at);
CREATE INDEX IF NOT EXISTS idx_voice_commands_log_language ON voice_commands_log(language);
CREATE INDEX IF NOT EXISTS idx_search_queries_language ON search_queries(language);
CREATE INDEX IF NOT EXISTS idx_search_queries_type ON search_queries(query_type);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_language ON search_suggestions(language);

-- Voice analytics view
CREATE OR REPLACE VIEW voice_search_analytics AS
SELECT 
  COUNT(*) as total_commands,
  COUNT(CASE WHEN success THEN 1 END) as successful_commands,
  ROUND(COUNT(CASE WHEN success THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate,
  AVG(confidence) as average_confidence,
  language,
  DATE_TRUNC('day', created_at) as date
FROM voice_commands_log 
GROUP BY language, DATE_TRUNC('day', created_at)
ORDER BY date DESC, language;

-- Popular voice commands view
CREATE OR REPLACE VIEW popular_voice_commands AS
SELECT 
  transcript,
  action,
  COUNT(*) as usage_count,
  AVG(confidence) as avg_confidence,
  language,
  COUNT(CASE WHEN success THEN 1 END) as success_count,
  ROUND(COUNT(CASE WHEN success THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM voice_commands_log 
WHERE transcript IS NOT NULL 
GROUP BY transcript, action, language
ORDER BY usage_count DESC
LIMIT 50;

-- Function to get trending searches
CREATE OR REPLACE FUNCTION get_trending_searches(p_language VARCHAR DEFAULT 'en', p_limit INTEGER DEFAULT 10)
RETURNS TABLE(query_text TEXT, search_count BIGINT) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sq.query_text,
    COUNT(*) as search_count
  FROM search_queries sq
  WHERE sq.language = p_language
    AND sq.query_type IN ('voice', 'text')
    AND sq.created_at >= NOW() - INTERVAL '7 days'
  GROUP BY sq.query_text
  ORDER BY search_count DESC
  LIMIT p_limit;
END;
$$;

-- Function to get smart search insights
CREATE OR REPLACE FUNCTION get_smart_search_insights(p_language VARCHAR DEFAULT 'en')
RETURNS TABLE(
  type VARCHAR(50),
  title TEXT,
  description TEXT,
  query TEXT,
  confidence DECIMAL(3,2),
  category TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Trending medications
  SELECT 
    'trending'::VARCHAR(50) as type,
    CASE 
      WHEN p_language = 'ar' THEN 'الأدوية الأكثر بحثاً'
      ELSE 'Trending Medications'
    END as title,
    CASE 
      WHEN p_language = 'ar' THEN 'الأدوية الأكثر طلباً هذا الأسبوع'
      ELSE 'Most requested medications this week'
    END as description,
    'trending'::TEXT as query,
    0.8::DECIMAL(3,2) as confidence,
    'general'::TEXT as category
  UNION ALL
  -- Seasonal recommendations
  SELECT 
    'seasonal'::VARCHAR(50) as type,
    CASE 
      WHEN p_language = 'ar' THEN 'موسم الحساسية'
      ELSE 'Allergy Season'
    END as title,
    CASE 
      WHEN p_language = 'ar' THEN 'أدوية الحساسية المناسبة لهذا الموسم'
      ELSE 'Appropriate allergy medications for this season'
    END as description,
    'allergy'::TEXT as query,
    0.9::DECIMAL(3,2) as confidence,
    'allergy'::TEXT as category
  UNION ALL
  -- High-rated products
  SELECT 
    'personalized'::VARCHAR(50) as type,
    CASE 
      WHEN p_language = 'ar' THEN 'منتجات مُوصى بها'
      ELSE 'Recommended Products'
    END as title,
    CASE 
      WHEN p_language = 'ar' THEN 'منتجات ذات تقييمات عالية'
      ELSE 'Products with high ratings'
    END as description,
    'highly_rated'::TEXT as query,
    0.85::DECIMAL(3,2) as confidence,
    'general'::TEXT as category;
END;
$$;

-- Function to get contextual suggestions
CREATE OR REPLACE FUNCTION get_contextual_suggestions(
  p_query TEXT,
  p_language VARCHAR DEFAULT 'en',
  p_context JSONB DEFAULT '{}'
)
RETURNS TABLE(
  type VARCHAR(50),
  title TEXT,
  description TEXT,
  query TEXT,
  confidence DECIMAL(3,2),
  category TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
  recent_searches TEXT[];
  trending_terms TEXT[];
BEGIN
  -- Extract context data
  recent_searches := COALESCE(p_context->'recent_searches', '[]'::jsonb)::TEXT[];
  trending_terms := COALESCE(p_context->'trending', '[]'::jsonb)::TEXT[];
  
  RETURN QUERY
  -- Query-based suggestions
  SELECT 
    'query_related'::VARCHAR(50) as type,
    CASE 
      WHEN p_language = 'ar' THEN 'ذات صلة ببحثك'
      ELSE 'Related to your search'
    END as title,
    CASE 
      WHEN p_language = 'ar' THEN 'نتائج مشابهة لطلبك'
      ELSE 'Results similar to your query'
    END as description,
    p_query::TEXT as query,
    0.75::DECIMAL(3,2) as confidence,
    'search'::TEXT as category
  UNION ALL
  -- Recent search based
  SELECT 
    'recent_based'::VARCHAR(50) as type,
    CASE 
      WHEN p_language = 'ar' THEN 'بناءً على بحثك الأخير'
      ELSE 'Based on your recent searches'
    END as title,
    CASE 
      WHEN p_language = 'ar' THEN 'منتجات بحثت عنها مؤخراً'
      ELSE 'Products you searched for recently'
    END as description,
    recent_searches[1]::TEXT as query,
    0.70::DECIMAL(3,2) as confidence,
    'history'::TEXT as category
  LIMIT 5;
END;
$$;

-- Function for medication suggestions
CREATE OR REPLACE FUNCTION get_medication_suggestions(
  p_query TEXT,
  p_language VARCHAR DEFAULT 'en',
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(suggestion TEXT) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    CASE 
      WHEN p_language = 'ar' THEN COALESCE(p.name_ar, p.name, m.ar_name)
      ELSE COALESCE(p.name, m.en_name)
    END::TEXT as suggestion
  FROM products p
  LEFT JOIN medication_mappings m ON LOWER(p.name) = LOWER(m.en_name)
  WHERE (
    LOWER(p.name) ILIKE '%' || LOWER(p_query) || '%' OR
    LOWER(COALESCE(p.name_ar, '')) ILIKE '%' || LOWER(p_query) || '%' OR
    LOWER(COALESCE(m.ar_name, '')) ILIKE '%' || LOWER(p_query) || '%' OR
    LOWER(COALESCE(m.en_name, '')) ILIKE '%' || LOWER(p_query) || '%'
  )
  AND p.in_stock = true
  LIMIT p_limit;
END;
$$;

-- Function for smart medication search
CREATE OR REPLACE FUNCTION smart_medication_search(
  p_query TEXT,
  p_language VARCHAR DEFAULT 'en',
  p_source VARCHAR DEFAULT 'text',
  p_confidence DECIMAL DEFAULT 0.8,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  id TEXT,
  name TEXT,
  name_ar TEXT,
  category TEXT,
  price DECIMAL(10,2),
  in_stock BOOLEAN,
  rating DECIMAL(3,2),
  image TEXT,
  confidence DECIMAL(3,2),
  source VARCHAR
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id::TEXT,
    p.name,
    p.name_ar,
    p.category,
    p.price,
    p.in_stock,
    p.rating,
    p.images[1] as image,
    p_confidence as confidence,
    p_source as source
  FROM products p
  WHERE (
    LOWER(p.name) ILIKE '%' || LOWER(p_query) || '%' OR
    LOWER(COALESCE(p.name_ar, '')) ILIKE '%' || LOWER(p_query) || '%' OR
    LOWER(p.category) ILIKE '%' || LOWER(p_query) || '%'
  )
  AND p.in_stock = true
  ORDER BY 
    CASE 
      WHEN p_source = 'voice' THEN p_confidence
      ELSE 0.5
    END DESC,
    p.rating DESC,
    p.price ASC
  LIMIT p_limit;
END;
$$;

-- Function to get voice search analytics
CREATE OR REPLACE FUNCTION get_voice_search_analytics(p_language VARCHAR DEFAULT 'en')
RETURNS TABLE(
  total_commands BIGINT,
  success_rate DECIMAL,
  average_confidence DECIMAL,
  language VARCHAR(5),
  most_used_commands JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_commands,
    ROUND(COUNT(CASE WHEN success THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate,
    ROUND(AVG(confidence), 2) as average_confidence,
    language,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'command', transcript,
          'count', command_count
        )
      ) FILTER (WHERE command_count IS NOT NULL),
      '[]'::jsonb
    ) as most_used_commands
  FROM (
    SELECT 
      transcript,
      COUNT(*) as command_count,
      AVG(confidence) as confidence,
      AVG(CASE WHEN success THEN 1 ELSE 0 END) as success_rate,
      language
    FROM voice_commands_log
    WHERE language = p_language
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY transcript, language
    ORDER BY command_count DESC
    LIMIT 10
  ) subq
  GROUP BY language;
END;
$$;

-- Function to log search query (enhanced)
CREATE OR REPLACE FUNCTION log_search_query(
  p_session_id TEXT,
  p_query_text TEXT,
  p_query_type VARCHAR DEFAULT 'text',
  p_language VARCHAR DEFAULT 'en',
  p_confidence DECIMAL DEFAULT NULL
)
RETURNS VOID 
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO search_queries (
    session_id,
    query_text,
    query_type,
    language,
    confidence
  ) VALUES (
    p_session_id,
    p_query_text,
    p_query_type,
    p_language,
    p_confidence
  )
  ON CONFLICT (session_id, query_text) 
  DO UPDATE SET
    created_at = NOW(),
    confidence = COALESCE(p_confidence, search_queries.confidence);
    
  -- Update suggestion count
  INSERT INTO search_suggestions (
    suggestion_text,
    search_count,
    language,
    voice_count
  ) VALUES (
    p_query_text,
    1,
    p_language,
    CASE WHEN p_query_type = 'voice' THEN 1 ELSE 0 END
  )
  ON CONFLICT (suggestion_text) 
  DO UPDATE SET
    search_count = search_suggestions.search_count + 1,
    voice_count = search_suggestions.voice_count + CASE WHEN p_query_type = 'voice' THEN 1 ELSE 0 END,
    last_voice_used = CASE WHEN p_query_type = 'voice' THEN NOW() ELSE search_suggestions.last_voice_used END;
END;
$$;

-- Medication mappings table
CREATE TABLE IF NOT EXISTS medication_mappings (
  id SERIAL PRIMARY KEY,
  en_name VARCHAR(255) NOT NULL,
  ar_name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  synonyms TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default medication mappings
INSERT INTO medication_mappings (en_name, ar_name, category, synonyms) VALUES
('insulin', 'إنسولين', 'diabetes', ARRAY['انسولين', 'أنسولين']),
('panadol', 'بنادول', 'pain_relief', ARRAY['بنادول', 'بنادول']),
('paracetamol', 'باراسيتامول', 'pain_relief', ARRAY['باراسيتامول', 'بنادول']),
('aspirin', 'أسبرين', 'pain_relief', ARRAY['أسبرين', 'أسبرين']),
('vitamin', 'فيتامين', 'vitamins', ARRAY['فيتامين', 'vitamins']),
('blood pressure', 'ضغط الدم', 'cardiovascular', ARRAY['ضغط الدم', 'ارتفاع ضغط']),
('antibiotic', 'مضاد حيوي', 'antibiotics', ARRAY['مضاد حيوي', 'antibiotic']),
('omega', 'أوميغا', 'supplements', ARRAY['أوميغا', 'omega']),
('calcium', 'كالسيوم', 'supplements', ARRAY['كالسيوم', 'calcium']),
('iron', 'حديد', 'supplements', ARRAY['حديد', 'iron'])
ON CONFLICT (en_name) DO NOTHING;

-- RLS policies
ALTER TABLE voice_commands_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own voice commands
CREATE POLICY "Users can view own voice commands" ON voice_commands_log
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow insertion for all users
CREATE POLICY "Users can insert voice commands" ON voice_commands_log
FOR INSERT WITH CHECK (true);

-- Allow users to view their own search queries
CREATE POLICY "Users can view own search queries" ON search_queries
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow insertion for all users
CREATE POLICY "Users can insert search queries" ON search_queries
FOR INSERT WITH CHECK (true);

-- Allow public read on suggestions
CREATE POLICY "Anyone can view suggestions" ON search_suggestions
FOR SELECT USING (true);

-- Allow insertion for all users
CREATE POLICY "Users can insert suggestions" ON search_suggestions
FOR INSERT WITH CHECK (true);