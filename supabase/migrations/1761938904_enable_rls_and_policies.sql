-- Migration: enable_rls_and_policies
-- Created at: 1761938904

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;

-- Public read access for categories
CREATE POLICY "Public read access for categories" ON categories
  FOR SELECT USING (true);

-- Public read access for products
CREATE POLICY "Public read access for products" ON products
  FOR SELECT USING (true);

-- Public read access for pharmacies
CREATE POLICY "Public read access for pharmacies" ON pharmacies
  FOR SELECT USING (true);

-- Authenticated users can create orders
CREATE POLICY "Authenticated users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own orders
CREATE POLICY "Users can read their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Authenticated users can create prescriptions
CREATE POLICY "Authenticated users can create prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own prescriptions
CREATE POLICY "Users can read their own prescriptions" ON prescriptions
  FOR SELECT USING (auth.uid() = user_id);;