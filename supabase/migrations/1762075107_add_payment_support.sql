-- Migration: add_payment_support
-- Created at: 1762075107

-- Add payment-related fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_error TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Allow edge functions to update orders for payment processing
DROP POLICY IF EXISTS "Allow order updates for payments" ON orders;
CREATE POLICY "Allow order updates for payments" ON orders
  FOR UPDATE
  USING (auth.role() IN ('anon', 'service_role'))
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- Create index for payment intent lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(stripe_payment_intent_id);

-- Add unique constraint separately (will fail silently if exists)
DO $$
BEGIN
  ALTER TABLE orders ADD CONSTRAINT orders_payment_intent_unique UNIQUE (stripe_payment_intent_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
;