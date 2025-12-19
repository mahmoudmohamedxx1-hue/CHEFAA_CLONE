-- Migration: delivery_tracking_expand
-- Created at: 1762082885

-- Add more delivery tracking features

-- Delivery status history
CREATE TABLE IF NOT EXISTS delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES delivery_tracking(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  status_message TEXT,
  location_description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver information
CREATE TABLE IF NOT EXISTS delivery_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_name TEXT NOT NULL,
  driver_phone TEXT,
  driver_email TEXT,
  vehicle_type TEXT,
  status TEXT DEFAULT 'available',
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery notifications
CREATE TABLE IF NOT EXISTS delivery_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES delivery_tracking(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery issues
CREATE TABLE IF NOT EXISTS delivery_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES delivery_tracking(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  description TEXT,
  status TEXT DEFAULT 'reported',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery slots
CREATE TABLE IF NOT EXISTS delivery_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time_slot_start TIME NOT NULL,
  time_slot_end TIME NOT NULL,
  max_deliveries INTEGER NOT NULL,
  current_deliveries INTEGER DEFAULT 0,
  delivery_type TEXT DEFAULT 'standard',
  available BOOLEAN DEFAULT TRUE
);

-- Egyptian delivery zones
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name_en TEXT NOT NULL,
  city_name_ar TEXT NOT NULL,
  district_name_en TEXT,
  district_name_ar TEXT,
  min_latitude DECIMAL(10, 8),
  max_latitude DECIMAL(10, 8),
  min_longitude DECIMAL(11, 8),
  max_longitude DECIMAL(11, 8),
  delivery_surcharge DECIMAL(8, 2) DEFAULT 0,
  delivery_time_estimate INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traffic patterns
CREATE TABLE IF NOT EXISTS traffic_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES delivery_zones(id) ON DELETE CASCADE,
  day_of_week INTEGER,
  hour_of_day INTEGER,
  base_time_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  congestion_level TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_delivery_status_delivery_id ON delivery_status_history(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_status ON delivery_drivers(status);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_delivery_id ON delivery_notifications(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_issues_delivery_id ON delivery_issues(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_slots_date ON delivery_slots(date);
CREATE INDEX IF NOT EXISTS idx_traffic_patterns_zone_id ON traffic_patterns(zone_id);

-- Enable RLS
ALTER TABLE delivery_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_patterns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public read access" ON delivery_status_history FOR SELECT USING (true);
CREATE POLICY "Public read access" ON delivery_drivers FOR SELECT USING (true);
CREATE POLICY "Public read access" ON delivery_notifications FOR SELECT USING (true);
CREATE POLICY "Public read access" ON delivery_issues FOR SELECT USING (true);
CREATE POLICY "Public read access" ON delivery_slots FOR SELECT USING (true);
CREATE POLICY "Public read access" ON delivery_zones FOR SELECT USING (true);
CREATE POLICY "Public read access" ON traffic_patterns FOR SELECT USING (true);;