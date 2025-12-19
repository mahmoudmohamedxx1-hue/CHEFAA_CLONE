-- Migration: core_performance_indexes
-- Created at: 1762127928

-- Core Performance Indexes Migration
-- Created: 2025-11-03
-- Purpose: Essential indexes for main tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==============================================
-- PRODUCTS TABLE INDEXES
-- ==============================================

-- Product name search (trigram for fuzzy search)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin(name gin_trgm_ops);

-- Full-text search
CREATE INDEX IF NOT EXISTS idx_products_fts ON public.products USING gin(
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- Category and subcategory filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products(subcategory, created_at DESC);

-- Active products filtering
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active, price_egp);

-- Featured products
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured, average_rating DESC);

-- SKU and barcode lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);

-- ==============================================
-- ORDERS TABLE INDEXES
-- ==============================================

-- User orders lookup
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON public.orders(user_id, created_at DESC);

-- Order status tracking
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status, created_at DESC);

-- Combined user and status
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status, created_at DESC);

-- Payment status
CREATE INDEX IF NOT EXISTS idx_orders_payment ON public.orders(payment_status, updated_at DESC);

-- Pharmacy orders
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy ON public.orders(pharmacy_id, created_at DESC);

-- Order number lookup
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);

-- ==============================================
-- PRESCRIPTIONS TABLE INDEXES
-- ==============================================

-- User prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_user ON public.prescriptions(user_id, created_at DESC);

-- Prescription status
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(status, created_at DESC);

-- Verified prescriptions
CREATE INDEX IF NOT EXISTS idx_prescriptions_verified_at ON public.prescriptions(verified_at DESC);

-- ==============================================
-- OTHER CRITICAL INDEXES
-- ==============================================

-- Order items
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

-- Inventory
CREATE INDEX IF NOT EXISTS idx_inventory_product ON public.inventory(product_id);

-- Product reviews
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON public.product_reviews(product_id, created_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- Security events
CREATE INDEX IF NOT EXISTS idx_security_events_created ON public.security_events(created_at DESC);

-- Token blacklist
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token ON public.token_blacklist(token_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user ON public.token_blacklist(user_id, expires_at DESC);

-- User sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id, last_activity DESC);

-- ==============================================
-- ANALYZE TABLES
-- ==============================================

ANALYZE public.products;
ANALYZE public.orders;
ANALYZE public.prescriptions;;