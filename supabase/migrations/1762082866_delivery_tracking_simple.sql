-- Migration: delivery_tracking_simple
-- Created at: 1762082866

-- Simple delivery tracking system
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  delivery_type TEXT NOT NULL DEFAULT 'standard',
  delivery_address JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_gps_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES delivery_tracking(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_gps_delivery_id ON delivery_gps_logs(delivery_id);

ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_gps_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON delivery_tracking FOR SELECT USING (true);
CREATE POLICY "Public read access" ON delivery_gps_logs FOR SELECT USING (true);;