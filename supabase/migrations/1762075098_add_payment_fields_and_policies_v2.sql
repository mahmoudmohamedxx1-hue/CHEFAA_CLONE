-- Migration: add_payment_fields_and_policies_v2
-- Created at: 1762075098

-- Add payment-related fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_error TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Update RLS policies for edge function operations
-- Allow both anon and service_role for security_events
DROP POLICY IF EXISTS "Users can insert their own security events" ON security_events;
CREATE POLICY "Allow edge function security events" ON security_events
  FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- Allow both anon and service_role for audit_logs  
DROP POLICY IF EXISTS "Users can insert their own audit logs" ON audit_logs;
CREATE POLICY "Allow edge function audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- Allow edge functions to update 2FA records
DROP POLICY IF EXISTS "Users can update their own 2FA settings" ON two_factor_auth;
CREATE POLICY "Allow 2FA updates" ON two_factor_auth
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.role() = 'service_role')
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Allow edge functions to create prescription verifications
DROP POLICY IF EXISTS "Users can insert their own prescription verifications" ON prescription_verifications;
CREATE POLICY "Allow prescription uploads" ON prescription_verifications
  FOR INSERT
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- Allow edge functions to update orders
DROP POLICY IF EXISTS "Allow edge function order updates" ON orders;
CREATE POLICY "Allow edge function order updates" ON orders
  FOR UPDATE
  USING (auth.role() IN ('anon', 'service_role'))
  WITH CHECK (auth.role() IN ('anon', 'service_role'));

-- Create index for payment intent lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent ON orders(stripe_payment_intent_id);
;