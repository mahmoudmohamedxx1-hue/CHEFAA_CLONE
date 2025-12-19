-- Migration: delivery_status_table
-- Created at: 1762082890

-- Delivery status history
CREATE TABLE IF NOT EXISTS delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID,
  status TEXT NOT NULL,
  status_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_status_delivery_id ON delivery_status_history(delivery_id);
ALTER TABLE delivery_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON delivery_status_history FOR SELECT USING (true);;