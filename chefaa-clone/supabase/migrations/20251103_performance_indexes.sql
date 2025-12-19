-- Performance Optimization Migration: Database Indexes
-- Created: 2025-11-03
-- Purpose: Add comprehensive indexes for query optimization

-- ==============================================
-- 1. Authentication & Session Indexes
-- ==============================================

-- User lookup by email (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);

-- Token blacklist lookups
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token_id ON public.token_blacklist(token_id) WHERE expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_expires ON public.token_blacklist(user_id, expires_at DESC);

-- User sessions lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(user_id, is_active, last_activity DESC) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_sessions_device ON public.user_sessions(device_fingerprint, user_id);

-- ==============================================
-- 2. Product & Medication Indexes
-- ==============================================

-- Product search and filtering
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_search ON public.products(category_id, in_stock, price) WHERE in_stock = TRUE;

-- Full-text search for product descriptions
CREATE INDEX IF NOT EXISTS idx_products_name_fts ON public.products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Product availability and pricing
CREATE INDEX IF NOT EXISTS idx_products_price_range ON public.products(price, category_id) WHERE in_stock = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(in_stock, category_id);

-- ==============================================
-- 3. Order & Transaction Indexes
-- ==============================================

-- User orders lookup
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status, created_at DESC);

-- Payment tracking
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_intent ON public.orders(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- ==============================================
-- 4. Prescription & Medical Records Indexes
-- ==============================================

-- Prescription lookups
CREATE INDEX IF NOT EXISTS idx_prescriptions_user ON public.prescriptions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_verification ON public.prescriptions(verified, verification_date DESC);

-- Medical records access
CREATE INDEX IF NOT EXISTS idx_medical_records_user ON public.medical_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_allergies_user ON public.allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_chronic_conditions_user ON public.chronic_conditions(user_id);

-- ==============================================
-- 5. Clinical & Safety Indexes
-- ==============================================

-- Drug interactions lookup
CREATE INDEX IF NOT EXISTS idx_drug_interactions_drugs ON public.drug_interactions_advanced(drug1, drug2);
CREATE INDEX IF NOT EXISTS idx_drug_interactions_severity ON public.drug_interactions_advanced(severity, interaction_type);

-- Safety analysis
CREATE INDEX IF NOT EXISTS idx_safety_analysis_user ON public.safety_analysis(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_safety_analysis_risk ON public.safety_analysis(risk_level, created_at DESC);

-- Pill verification
CREATE INDEX IF NOT EXISTS idx_verification_sessions_user ON public.verification_sessions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_status ON public.verification_sessions(verification_status, created_at DESC);

-- ==============================================
-- 6. Blockchain & IoT Indexes
-- ==============================================

-- Drug provenance tracking
CREATE INDEX IF NOT EXISTS idx_drug_batches_batch_number ON public.drug_batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_drug_batches_product ON public.drug_batches(product_id, manufactured_date DESC);
CREATE INDEX IF NOT EXISTS idx_supply_chain_batch ON public.supply_chain_events(batch_id, timestamp DESC);

-- Smart contracts
CREATE INDEX IF NOT EXISTS idx_smart_contracts_user ON public.smart_contracts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_contracts_status ON public.smart_contracts(status, created_at DESC);

-- IoT adherence data
CREATE INDEX IF NOT EXISTS idx_iot_devices_user ON public.iot_devices(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_adherence_records_user_date ON public.adherence_records(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_adherence_records_medication ON public.adherence_records(medication_id, recorded_at DESC);

-- ==============================================
-- 7. Clinical Trials Indexes
-- ==============================================

-- Trial matching
CREATE INDEX IF NOT EXISTS idx_clinical_trials_status ON public.clinical_trials(status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_trials_condition ON public.clinical_trials(condition, status);
CREATE INDEX IF NOT EXISTS idx_trial_matches_user ON public.trial_matches(user_id, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_trial_applications_user ON public.trial_applications(user_id, created_at DESC);

-- ==============================================
-- 8. Content & Engagement Indexes
-- ==============================================

-- AR Education content
CREATE INDEX IF NOT EXISTS idx_ar_content_category ON public.ar_content(category, is_published);
CREATE INDEX IF NOT EXISTS idx_ar_content_user_progress ON public.user_ar_progress(user_id, last_accessed DESC);

-- Blog and content
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(published_at DESC) WHERE published = TRUE;
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category, published_at DESC) WHERE published = TRUE;
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON public.blog_posts(author_id, published_at DESC);

-- ==============================================
-- 9. Analytics & Audit Indexes
-- ==============================================

-- Audit logs with composite indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON public.audit_logs(success, created_at DESC) WHERE success = FALSE;
CREATE INDEX IF NOT EXISTS idx_audit_logs_recent ON public.audit_logs(created_at DESC) WHERE created_at > NOW() - INTERVAL '7 days';

-- Security events
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON public.security_events(resolved, created_at DESC) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_security_events_user_type ON public.security_events(user_id, event_type, created_at DESC);

-- ==============================================
-- 10. Pharmacy Network Indexes
-- ==============================================

-- Pharmacy locations and network
CREATE INDEX IF NOT EXISTS idx_pharmacies_location ON public.partner_pharmacies USING gist(location);
CREATE INDEX IF NOT EXISTS idx_pharmacies_active ON public.partner_pharmacies(is_active, rating DESC);

-- Delivery tracking
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_delivery ON public.delivery_tracking_points(delivery_id, timestamp DESC);

-- ==============================================
-- 11. Performance Optimization Functions
-- ==============================================

-- Function to analyze slow queries
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE (
  query TEXT,
  calls BIGINT,
  total_time DOUBLE PRECISION,
  mean_time DOUBLE PRECISION,
  max_time DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    query,
    calls,
    total_exec_time as total_time,
    mean_exec_time as mean_time,
    max_exec_time as max_time
  FROM pg_stat_statements
  WHERE mean_exec_time > 100 -- queries taking more than 100ms on average
  ORDER BY mean_exec_time DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Function to vacuum analyze all tables
CREATE OR REPLACE FUNCTION vacuum_all_tables()
RETURNS TEXT AS $$
DECLARE
  table_rec RECORD;
  result TEXT := '';
BEGIN
  FOR table_rec IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE 'VACUUM ANALYZE ' || quote_ident(table_rec.schemaname) || '.' || quote_ident(table_rec.tablename);
    result := result || 'Vacuumed: ' || table_rec.tablename || E'\n';
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage()
RETURNS TABLE (
  schemaname TEXT,
  tablename TEXT,
  indexname TEXT,
  idx_scan BIGINT,
  idx_tup_read BIGINT,
  idx_tup_fetch BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname::TEXT,
    tablename::TEXT,
    indexname::TEXT,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ==============================================
-- 12. Materialized Views for Performance
-- ==============================================

-- Popular products view
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_products AS
SELECT 
  p.id,
  p.name,
  p.category_id,
  p.price,
  p.image_url,
  COUNT(DISTINCT o.id) as order_count,
  AVG(p.price) as avg_price
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE p.in_stock = TRUE
GROUP BY p.id, p.name, p.category_id, p.price, p.image_url
ORDER BY order_count DESC
LIMIT 100;

CREATE UNIQUE INDEX IF NOT EXISTS idx_popular_products_id ON popular_products(id);

-- User activity summary view
CREATE MATERIALIZED VIEW IF NOT EXISTS user_activity_summary AS
SELECT 
  u.id as user_id,
  u.email,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(o.total_amount) as total_spent,
  MAX(o.created_at) as last_order_date,
  COUNT(DISTINCT p.id) as prescriptions_count
FROM auth.users u
LEFT JOIN orders o ON u.id = o.user_id
LEFT JOIN prescriptions p ON u.id = p.user_id
GROUP BY u.id, u.email;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_summary(user_id);

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS TEXT AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY popular_products;
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_summary;
  RETURN 'Materialized views refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 13. Query Optimization Hints
-- ==============================================

COMMENT ON INDEX idx_products_name_trgm IS 'Trigram index for fuzzy product name search';
COMMENT ON INDEX idx_products_name_fts IS 'Full-text search index for product search';
COMMENT ON INDEX idx_orders_user_created IS 'Composite index for user order history';
COMMENT ON INDEX idx_audit_logs_recent IS 'Partial index for recent audit logs (hot data)';

-- Analyze all tables to update statistics
ANALYZE;

-- ==============================================
-- Migration Complete
-- ==============================================
-- Total indexes created: 50+
-- Materialized views: 2
-- Helper functions: 4
-- Extensions enabled: pg_trgm, pg_stat_statements
