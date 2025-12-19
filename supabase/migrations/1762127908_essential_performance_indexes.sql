-- Migration: essential_performance_indexes
-- Created at: 1762127908

-- Essential Performance Indexes Migration
-- Created: 2025-11-03
-- Purpose: Add critical indexes for query optimization based on actual schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==============================================
-- PRODUCTS TABLE INDEXES
-- ==============================================

-- Product name search (trigram for fuzzy search)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin(name gin_trgm_ops);

-- Full-text search for product name and description
CREATE INDEX IF NOT EXISTS idx_products_fts ON public.products USING gin(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- Category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category, created_at DESC);

-- Active products with price
CREATE INDEX IF NOT EXISTS idx_products_active_price ON public.products(is_active, price_egp) WHERE is_active = TRUE;

-- Featured products
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured, average_rating DESC) WHERE is_featured = TRUE;

-- SKU and barcode lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode) WHERE barcode IS NOT NULL;

-- Prescription required filtering
CREATE INDEX IF NOT EXISTS idx_products_prescription ON public.products(prescription_required, category);

-- ==============================================
-- ORDERS TABLE INDEXES
-- ==============================================

-- User orders lookup
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders(user_id, created_at DESC);

-- Order status tracking
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status, created_at DESC);

-- User orders by status
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status, created_at DESC);

-- Payment status tracking
CREATE INDEX IF NOT EXISTS idx_orders_payment ON public.orders(payment_status, updated_at DESC);

-- Pharmacy orders
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy ON public.orders(pharmacy_id, created_at DESC);

-- Order number lookup
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

-- Prescription orders
CREATE INDEX IF NOT EXISTS idx_orders_prescription ON public.orders(prescription_id) WHERE prescription_id IS NOT NULL;

-- ==============================================
-- PRESCRIPTIONS TABLE INDEXES
-- ==============================================

-- User prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_user ON public.prescriptions(user_id, created_at DESC);

-- Prescription status
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(status, created_at DESC);

-- Verified prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_verified ON public.prescriptions(verified_at DESC) WHERE verified_at IS NOT NULL;

-- Prescription expiry
CREATE INDEX IF NOT EXISTS idx_prescriptions_expiry ON public.prescriptions(expiry_date) WHERE expiry_date IS NOT NULL;

-- ==============================================
-- AUTHENTICATION & SECURITY INDEXES
-- ==============================================

-- Token blacklist (if table exists)
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON public.token_blacklist(token_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user ON public.token_blacklist(user_id, expires_at DESC);

-- User sessions (if table exists)
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id, last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = TRUE;

-- Security events (if table exists)
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events(user_id, created_at DESC);

-- Audit logs (if table exists)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ==============================================
-- INVENTORY & PRODUCT MANAGEMENT
-- ==============================================

-- Inventory tracking
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);

-- Product reviews
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id, created_at DESC);

-- Order items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

-- ==============================================
-- PHARMACY & DELIVERY
-- ==============================================

-- Pharmacies location (if gist extension available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    CREATE INDEX IF NOT EXISTS idx_pharmacies_location ON public.pharmacies USING gist(location);
  END IF;
END$$;

-- Delivery tracking
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order ON public.delivery_tracking(order_id, created_at DESC);

-- ==============================================
-- CUSTOMER DATA
-- ==============================================

-- Customer medications
CREATE INDEX IF NOT EXISTS idx_customer_medications_user ON public.customer_medications(user_id);

-- Customer allergies
CREATE INDEX IF NOT EXISTS idx_customer_allergies_user ON public.customer_allergies(user_id);

-- Drug interactions
CREATE INDEX IF NOT EXISTS idx_drug_interactions_drugs ON public.drug_interactions(drug_a, drug_b);

-- ==============================================
-- NOTIFICATIONS & REMINDERS
-- ==============================================

-- Medication reminders
CREATE INDEX IF NOT EXISTS idx_medication_reminders_user ON public.medication_reminders(user_id, next_reminder_at);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- ==============================================
-- ANALYZE TABLES
-- ==============================================

-- Update table statistics for query planner
ANALYZE public.products;
ANALYZE public.orders;
ANALYZE public.prescriptions;
ANALYZE public.order_items;
ANALYZE public.inventory;;