-- Migration: performance_indexes_core
-- Created at: 1762127858

-- Performance Optimization Migration: Database Indexes (Core)
-- Created: 2025-11-03
-- Purpose: Add essential indexes for query optimization

-- Enable extensions first
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ==============================================
-- 1. Authentication & Session Indexes
-- ==============================================

-- Token blacklist lookups
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token_id ON public.token_blacklist(token_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_expires ON public.token_blacklist(user_id, expires_at DESC);

-- User sessions lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON public.user_sessions(user_id, is_active, last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device ON public.user_sessions(device_fingerprint, user_id);

-- ==============================================
-- 2. Product & Medication Indexes
-- ==============================================

-- Product search and filtering
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_stock ON public.products(category_id, in_stock, price);

-- Full-text search for product descriptions
CREATE INDEX IF NOT EXISTS idx_products_name_fts ON public.products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Product availability and pricing
CREATE INDEX IF NOT EXISTS idx_products_price_cat ON public.products(price, category_id);
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
CREATE INDEX IF NOT EXISTS idx_orders_stripe_intent ON public.orders(stripe_payment_intent_id);

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
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON public.blog_posts(author_id, published_at DESC);

-- ==============================================
-- 9. Analytics & Audit Indexes
-- ==============================================

-- Audit logs with composite indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON public.audit_logs(success, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Security events
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_resolved ON public.security_events(resolved, created_at DESC);
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
-- Performance Functions
-- ==============================================

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

-- Analyze all tables to update statistics
ANALYZE;;