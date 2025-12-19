-- Real-Time GPS Delivery Tracking System - Database Schema
-- Comprehensive delivery tracking with GPS coordinates, status timeline, and ETA

-- ============================================================================
-- 1. DELIVERY TRACKING CORE TABLES
-- ============================================================================

-- Delivery tracking main table
CREATE TABLE IF NOT EXISTS delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
  
  -- Delivery information
  delivery_type TEXT NOT NULL DEFAULT 'standard', -- 'express', 'standard', 'scheduled'
  delivery_service_level TEXT NOT NULL DEFAULT 'standard', -- 'premium', 'standard', 'basic'
  scheduled_delivery_time TIMESTAMPTZ,
  promised_delivery_time TIMESTAMPTZ,
  estimated_delivery_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,
  
  -- Address information
  delivery_address JSONB NOT NULL, -- {street, city, district, postal_code, coordinates}
  pickup_address JSONB, -- {street, city, district, coordinates}
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled'
  status_message TEXT,
  priority INTEGER DEFAULT 5, -- 1-10 priority scale
  
  -- GPS and route information
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  route_id TEXT,
  route_distance_km DECIMAL(8, 2),
  route_estimated_duration INTEGER, -- minutes
  
  -- Delivery fees
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  service_charge DECIMAL(10, 2) DEFAULT 0,
  total_delivery_cost DECIMAL(10, 2) DEFAULT 0,
  
  -- Customer communication
  customer_phone TEXT,
  customer_email TEXT,
  special_instructions TEXT,
  
  -- Tracking metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- GPS tracking history
CREATE TABLE IF NOT EXISTS delivery_gps_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES delivery_tracking(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(5, 2), -- GPS accuracy in meters
  speed_kmh DECIMAL(5, 2), -- Vehicle speed
  heading_degrees INTEGER, -- Direction heading 0-359
  altitude_meters DECIMAL(8, 2),
  battery_level INTEGER, -- Driver device battery percentage
  signal_strength INTEGER, -- GPS signal strength
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery status timeline
CREATE TABLE IF NOT EXISTS delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES delivery_tracking(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  status_message TEXT,
  location_description TEXT, -- Human-readable location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who made the change
  system_update BOOLEAN DEFAULT FALSE, -- Whether update was automatic
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driver information
CREATE TABLE IF NOT EXISTS delivery_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_license TEXT,
  vehicle_type TEXT, -- 'motorcycle', 'car', 'van', 'bicycle'
  vehicle_plate_number TEXT,
  vehicle_capacity_kg DECIMAL(8, 2),
  max_deliveries_per_day INTEGER DEFAULT 20,
  delivery_radius_km DECIMAL(6, 2) DEFAULT 25,
  
  -- Current status
  status TEXT DEFAULT 'available', -- 'available', 'busy', 'offline', 'break'
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  last_location_update TIMESTAMPTZ,
  
  -- Performance metrics
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  average_delivery_time DECIMAL(6, 2), -- minutes
  rating DECIMAL(3, 2) DEFAULT 0,
  total_distance_km DECIMAL(10, 2) DEFAULT 0,
  
  -- Working hours
  working_hours JSONB, -- {monday: {start: '09:00', end: '17:00'}, ...}
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery route planning
CREATE TABLE IF NOT EXISTS delivery_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES delivery_drivers(id) ON DELETE CASCADE,
  route_name TEXT,
  route_date DATE,
  total_distance_km DECIMAL(8, 2),
  estimated_duration_minutes INTEGER,
  total_deliveries INTEGER,
  completed_deliveries INTEGER DEFAULT 0,
  
  -- Route status
  status TEXT DEFAULT 'planned', -- 'planned', 'active', 'completed', 'cancelled'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Route stops (individual deliveries in a route)
CREATE TABLE IF NOT EXISTS delivery_route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID REFERENCES delivery_routes(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES delivery_tracking(id) ON DELETE CASCADE,
  stop_order INTEGER,
  estimated_arrival_time TIMESTAMPTZ,
  actual_arrival_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'visited', 'skipped'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery notifications
CREATE TABLE IF NOT EXISTS delivery_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES delivery_tracking(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'status_change', 'eta_update', 'driver_assigned', 'delivery_complete'
  recipient_type TEXT NOT NULL, -- 'customer', 'admin', 'driver'
  recipient_contact TEXT,
  
  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_data JSONB, -- Additional notification data
  
  -- Delivery channels
  send_email BOOLEAN DEFAULT FALSE,
  send_sms BOOLEAN DEFAULT FALSE,
  send_push BOOLEAN DEFAULT TRUE,
  send_websocket BOOLEAN DEFAULT TRUE,
  
  -- Status tracking
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery issues and resolutions
CREATE TABLE IF NOT EXISTS delivery_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES delivery_tracking(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL, -- 'address_wrong', 'customer_not_available', 'traffic_delay', 'vehicle_breakdown', 'weather'
  severity TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  description TEXT,
  
  -- Issue status
  status TEXT DEFAULT 'reported', -- 'reported', 'investigating', 'resolved', 'escalated'
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  
  -- Impact tracking
  estimated_delay_minutes INTEGER,
  actual_delay_minutes INTEGER,
  additional_cost DECIMAL(10, 2),
  
  -- Timestamps
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. DELIVERY SCHEDULING AND OPTIMIZATION
-- ============================================================================

-- Delivery slots for scheduled deliveries
CREATE TABLE IF NOT EXISTS delivery_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  time_slot_start TIME NOT NULL,
  time_slot_end TIME NOT NULL,
  max_deliveries INTEGER NOT NULL,
  current_deliveries INTEGER DEFAULT 0,
  delivery_type TEXT NOT NULL DEFAULT 'standard', -- 'express', 'standard'
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. PERFORMANCE ANALYTICS
-- ============================================================================

-- Delivery performance metrics
CREATE TABLE IF NOT EXISTS delivery_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES delivery_tracking(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Timing metrics
  order_to_pickup_minutes INTEGER,
  pickup_to_delivery_minutes INTEGER,
  total_delivery_minutes INTEGER,
  promised_vs_actual_minutes INTEGER,
  
  -- Distance metrics
  route_distance_km DECIMAL(8, 2),
  actual_distance_km DECIMAL(8, 2),
  efficiency_score DECIMAL(3, 2), -- Actual vs estimated distance efficiency
  
  -- Customer satisfaction
  customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
  delivery_rating DECIMAL(3, 2),
  on_time_delivery BOOLEAN,
  
  -- Cost metrics
  fuel_cost DECIMAL(8, 2),
  time_cost DECIMAL(8, 2),
  total_cost DECIMAL(10, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. EGYPT-SPECIFIC DATA
-- ============================================================================

-- Egyptian cities and districts for delivery zones
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name_en TEXT NOT NULL,
  city_name_ar TEXT NOT NULL,
  district_name_en TEXT,
  district_name_ar TEXT,
  postal_code TEXT,
  
  -- Geographic boundaries
  min_latitude DECIMAL(10, 8),
  max_latitude DECIMAL(10, 8),
  min_longitude DECIMAL(11, 8),
  max_longitude DECIMAL(11, 8),
  
  -- Delivery zone properties
  delivery_surcharge DECIMAL(8, 2) DEFAULT 0,
  delivery_time_estimate INTEGER DEFAULT 30, -- minutes
  is_active BOOLEAN DEFAULT TRUE,
  delivery_restrictions JSONB, -- Time restrictions, vehicle types allowed
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Traffic patterns for ETA calculation
CREATE TABLE IF NOT EXISTS traffic_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES delivery_zones(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0 = Sunday, 6 = Saturday
  hour_of_day INTEGER, -- 0-23
  
  -- Traffic multipliers
  base_time_multiplier DECIMAL(3, 2) DEFAULT 1.0, -- Base multiplier for traffic
  congestion_level TEXT, -- 'low', 'medium', 'high', 'severe'
  average_speed_kmh DECIMAL(5, 2),
  
  -- Event-based traffic patterns
  event_type TEXT, -- 'weekend', 'holiday', 'rush_hour', 'special_event'
  event_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Delivery tracking indexes
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order_id ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_driver_id ON delivery_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_status ON delivery_tracking(status);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_delivery_type ON delivery_tracking(delivery_type);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_created_at ON delivery_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_priority ON delivery_tracking(priority DESC);

-- GPS logs indexes
CREATE INDEX IF NOT EXISTS idx_delivery_gps_delivery_id ON delivery_gps_logs(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_gps_created_at ON delivery_gps_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_gps_coordinates ON delivery_gps_logs(latitude, longitude);

-- Status history indexes
CREATE INDEX IF NOT EXISTS idx_delivery_status_delivery_id ON delivery_status_history(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_status_created_at ON delivery_status_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_status_status ON delivery_status_history(status);

-- Driver indexes
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_user_id ON delivery_drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_status ON delivery_drivers(status);
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_location ON delivery_drivers(current_latitude, current_longitude);

-- Route indexes
CREATE INDEX IF NOT EXISTS idx_delivery_routes_driver_id ON delivery_routes(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_date ON delivery_routes(route_date);
CREATE INDEX IF NOT EXISTS idx_delivery_routes_status ON delivery_routes(status);

-- Route stops indexes
CREATE INDEX IF NOT EXISTS idx_delivery_route_stops_route_id ON delivery_route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_delivery_route_stops_delivery_id ON delivery_route_stops(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_route_stops_order ON delivery_route_stops(stop_order);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_delivery_id ON delivery_notifications(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_status ON delivery_notifications(status);
CREATE INDEX IF NOT EXISTS idx_delivery_notifications_created_at ON delivery_notifications(created_at DESC);

-- Issues indexes
CREATE INDEX IF NOT EXISTS idx_delivery_issues_delivery_id ON delivery_issues(delivery_id);
CREATE INDEX IF NOT EXISTS idx_delivery_issues_status ON delivery_issues(status);
CREATE INDEX IF NOT EXISTS idx_delivery_issues_severity ON delivery_issues(severity);

-- Delivery slots indexes
CREATE INDEX IF NOT EXISTS idx_delivery_slots_date ON delivery_slots(date);
CREATE INDEX IF NOT EXISTS idx_delivery_slots_type ON delivery_slots(delivery_type);
CREATE INDEX IF NOT EXISTS idx_delivery_slots_available ON delivery_slots(available);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_delivery_performance_date ON delivery_performance(date);
CREATE INDEX IF NOT EXISTS idx_delivery_performance_delivery_id ON delivery_performance(delivery_id);

-- Traffic patterns indexes
CREATE INDEX IF NOT EXISTS idx_traffic_patterns_zone_id ON traffic_patterns(zone_id);
CREATE INDEX IF NOT EXISTS idx_traffic_patterns_day_hour ON traffic_patterns(day_of_week, hour_of_day);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Delivery tracking: Customer can view their deliveries, drivers can view assigned deliveries
ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Customers can view own deliveries" ON delivery_tracking 
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Drivers can view assigned deliveries" ON delivery_tracking 
  FOR SELECT USING (auth.uid() = driver_id);
CREATE POLICY "Drivers can update assigned deliveries" ON delivery_tracking 
  FOR UPDATE USING (auth.uid() = driver_id);

-- GPS logs: Allow read access for active tracking
ALTER TABLE delivery_gps_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for GPS logs" ON delivery_gps_logs 
  FOR SELECT USING (true);
CREATE POLICY "System can insert GPS logs" ON delivery_gps_logs 
  FOR INSERT WITH CHECK (true);

-- Status history: Customer and driver can view, system can insert
ALTER TABLE delivery_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for status history" ON delivery_status_history 
  FOR SELECT USING (true);
CREATE POLICY "System can insert status updates" ON delivery_status_history 
  FOR INSERT WITH CHECK (true);

-- Drivers: Drivers can view and update their own profile
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can manage own profile" ON delivery_drivers 
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public read access for driver info" ON delivery_drivers 
  FOR SELECT USING (true);

-- Delivery routes: Drivers can view their routes
ALTER TABLE delivery_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can view own routes" ON delivery_routes 
  FOR SELECT USING (
    driver_id IN (SELECT id FROM delivery_drivers WHERE user_id = auth.uid())
  );

-- Route stops: Drivers can view and update their route stops
ALTER TABLE delivery_route_stops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can view route stops" ON delivery_route_stops 
  FOR SELECT USING (
    route_id IN (
      SELECT r.id FROM delivery_routes r
      JOIN delivery_drivers d ON r.driver_id = d.id
      WHERE d.user_id = auth.uid()
    )
  );

-- Notifications: Recipients can view notifications sent to them
ALTER TABLE delivery_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for notifications" ON delivery_notifications 
  FOR SELECT USING (true);
CREATE POLICY "System can insert notifications" ON delivery_notifications 
  FOR INSERT WITH CHECK (true);

-- Issues: Customers can view issues with their deliveries
ALTER TABLE delivery_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for delivery issues" ON delivery_issues 
  FOR SELECT USING (true);
CREATE POLICY "System can insert issues" ON delivery_issues 
  FOR INSERT WITH CHECK (true);

-- Performance metrics: Read-only access
ALTER TABLE delivery_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for performance metrics" ON delivery_performance 
  FOR SELECT USING (true);

-- Delivery zones: Public read access
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for delivery zones" ON delivery_zones 
  FOR SELECT USING (true);

-- Traffic patterns: Public read access
ALTER TABLE traffic_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for traffic patterns" ON traffic_patterns 
  FOR SELECT USING (true);

-- Delivery slots: Public read access
ALTER TABLE delivery_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for delivery slots" ON delivery_slots 
  FOR SELECT USING (true);

-- ============================================================================
-- HELPER FUNCTIONS FOR DELIVERY TRACKING
-- ============================================================================

-- Calculate ETA based on current location and destination
CREATE OR REPLACE FUNCTION calculate_eta(
  p_current_lat DECIMAL(10, 8),
  p_current_lng DECIMAL(11, 8),
  p_destination_lat DECIMAL(10, 8),
  p_destination_lng DECIMAL(11, 8),
  p_delivery_type TEXT DEFAULT 'standard'
)
RETURNS INTEGER AS $$
DECLARE
  -- Calculate Haversine distance in kilometers
  distance_km DECIMAL(8, 2);
  base_speed_kmh DECIMAL(5, 2);
  traffic_multiplier DECIMAL(3, 2);
  eta_minutes INTEGER;
BEGIN
  -- Calculate distance using Haversine formula
  distance_km := (
    6371 * acos(
      cos(radians(p_current_lat)) * 
      cos(radians(p_destination_lat)) * 
      cos(radians(p_destination_lng) - radians(p_current_lng)) + 
      sin(radians(p_current_lat)) * 
      sin(radians(p_destination_lat))
    )
  );
  
  -- Determine base speed based on delivery type
  CASE p_delivery_type
    WHEN 'express' THEN base_speed_kmh := 35.0;
    WHEN 'standard' THEN base_speed_kmh := 25.0;
    WHEN 'scheduled' THEN base_speed_kmh := 20.0;
    ELSE base_speed_kmh := 25.0;
  END CASE;
  
  -- Apply traffic multiplier based on time of day (simplified)
  traffic_multiplier := CASE 
    WHEN EXTRACT(hour FROM NOW()) BETWEEN 7 AND 9 OR 
         EXTRACT(hour FROM NOW()) BETWEEN 17 AND 19 THEN 1.5
    WHEN EXTRACT(hour FROM NOW()) BETWEEN 10 AND 16 THEN 1.2
    ELSE 1.0
  END;
  
  -- Calculate ETA in minutes
  eta_minutes := ROUND((distance_km / (base_speed_kmh / traffic_multiplier)) * 60);
  
  -- Add minimum and maximum limits
  eta_minutes := GREATEST(5, LEAST(eta_minutes, 120));
  
  RETURN eta_minutes;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get real-time delivery status
CREATE OR REPLACE FUNCTION get_delivery_status(
  p_order_id UUID
)
RETURNS TABLE (
  delivery_id UUID,
  order_id UUID,
  status TEXT,
  status_message TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  estimated_delivery_time TIMESTAMPTZ,
  delivery_type TEXT,
  progress_percentage DECIMAL(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dt.id,
    dt.order_id,
    dt.status,
    dt.status_message,
    COALESCE(u.full_name, u.email) as driver_name,
    u.phone as driver_phone,
    dt.current_latitude,
    dt.current_longitude,
    dt.estimated_delivery_time,
    dt.delivery_type,
    CASE dt.status
      WHEN 'pending' THEN 10.0
      WHEN 'assigned' THEN 25.0
      WHEN 'picked_up' THEN 50.0
      WHEN 'in_transit' THEN 75.0
      WHEN 'out_for_delivery' THEN 85.0
      WHEN 'delivered' THEN 100.0
      ELSE 0.0
    END as progress_percentage
  FROM delivery_tracking dt
  LEFT JOIN auth.users u ON dt.driver_id = u.id
  WHERE dt.order_id = p_order_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update delivery status with history logging
CREATE OR REPLACE FUNCTION update_delivery_status(
  p_delivery_id UUID,
  p_new_status TEXT,
  p_status_message TEXT DEFAULT NULL,
  p_latitude DECIMAL(10, 8) DEFAULT NULL,
  p_longitude DECIMAL(11, 8) DEFAULT NULL,
  p_location_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_is_system_update BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  v_is_system_update := (v_user_id IS NULL);
  
  -- Update delivery tracking status
  UPDATE delivery_tracking 
  SET 
    status = p_new_status,
    status_message = p_status_message,
    current_latitude = COALESCE(p_latitude, current_latitude),
    current_longitude = COALESCE(p_longitude, current_longitude),
    updated_at = NOW()
  WHERE id = p_delivery_id;
  
  -- Insert status history record
  INSERT INTO delivery_status_history (
    delivery_id,
    status,
    status_message,
    location_description,
    latitude,
    longitude,
    changed_by,
    system_update
  ) VALUES (
    p_delivery_id,
    p_new_status,
    p_status_message,
    p_location_description,
    p_latitude,
    p_longitude,
    v_user_id,
    v_is_system_update
  );
  
  -- Log GPS update if coordinates provided
  IF p_latitude IS NOT NULL AND p_longitude IS NOT NULL THEN
    INSERT INTO delivery_gps_logs (
      delivery_id,
      latitude,
      longitude
    ) VALUES (
      p_delivery_id,
      p_latitude,
      p_longitude
    );
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get available delivery slots for a date
CREATE OR REPLACE FUNCTION get_available_delivery_slots(
  p_date DATE,
  p_delivery_type TEXT DEFAULT 'standard'
)
RETURNS TABLE (
  slot_id UUID,
  time_slot_start TIME,
  time_slot_end TIME,
  available_capacity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.id,
    ds.time_slot_start,
    ds.time_slot_end,
    (ds.max_deliveries - ds.current_deliveries) as available_capacity
  FROM delivery_slots ds
  WHERE ds.date = p_date
    AND ds.delivery_type = p_delivery_type
    AND ds.available = true
    AND ds.current_deliveries < ds.max_deliveries
  ORDER BY ds.time_slot_start;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION calculate_eta TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_delivery_status TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_delivery_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_delivery_slots TO authenticated, anon;

-- ============================================================================
-- INITIALIZATION DATA FOR EGYPT
-- ============================================================================

-- Insert Egyptian delivery zones
INSERT INTO delivery_zones (city_name_en, city_name_ar, district_name_en, district_name_ar, postal_code, 
  min_latitude, max_latitude, min_longitude, max_longitude, delivery_surcharge, delivery_time_estimate) VALUES
('Cairo', 'القاهرة', 'Downtown', 'وسط البلد', '11511', 30.0329, 30.0656, 31.2357, 31.3456, 0, 30),
('Cairo', 'القاهرة', 'Zamalek', 'الزمالك', '11211', 30.0584, 30.0660, 31.2183, 31.2293, 0, 25),
('Cairo', 'القاهرة', 'Maadi', 'المعادي', '11421', 29.9586, 29.9848, 31.2500, 31.3234, 5, 35),
('Cairo', 'القاهرة', 'New Cairo', 'القاهرة الجديدة', '11835', 30.0089, 30.0645, 31.3345, 31.4156, 15, 45),
('Giza', 'الجيزة', '6th of October', '6 أكتوبر', '12588', 29.9283, 29.9935, 30.9123, 31.0245, 10, 40),
('Alexandria', 'الإسكندرية', 'Corniche', 'الكورنيش', '21111', 31.1916, 31.2145, 29.9017, 29.9456, 8, 35),
('Giza', 'الجيزة', 'Dokki', 'الدقي', '12311', 30.0364, 30.0567, 31.1923, 31.2234, 0, 30)
ON CONFLICT DO NOTHING;

-- Insert delivery slots for the next 7 days
INSERT INTO delivery_slots (date, time_slot_start, time_slot_end, max_deliveries, delivery_type) 
SELECT 
  (CURRENT_DATE + interval '1 day' * generate_series(0, 6))::date,
  time_slot,
  time_slot + interval '1 hour',
  capacity,
  delivery_type
FROM (
  VALUES 
    ('09:00'::time, 15, 'standard'),
    ('10:00'::time, 15, 'standard'),
    ('11:00'::time, 15, 'standard'),
    ('14:00'::time, 20, 'standard'),
    ('15:00'::time, 20, 'standard'),
    ('16:00'::time, 15, 'standard'),
    ('09:00'::time, 10, 'express'),
    ('10:00'::time, 10, 'express'),
    ('14:00'::time, 10, 'express')
) AS time_slots(time_slot, capacity, delivery_type)
ON CONFLICT DO NOTHING;

-- Insert traffic patterns
INSERT INTO traffic_patterns (zone_id, day_of_week, hour_of_day, base_time_multiplier, congestion_level, average_speed_kmh)
SELECT 
  dz.id,
  dow,
  hod,
  multiplier,
  level,
  speed
FROM delivery_zones dz
CROSS JOIN (
  VALUES 
    (0, 7, 1.8, 'high', 18.0), (0, 8, 2.1, 'severe', 15.0), (0, 9, 1.9, 'high', 17.0), (0, 17, 2.2, 'severe', 14.0), (0, 18, 1.7, 'high', 19.0), (0, 19, 1.3, 'medium', 22.0),
    (1, 7, 1.5, 'medium', 20.0), (1, 8, 1.8, 'high', 18.0), (1, 9, 1.6, 'medium', 20.0), (1, 17, 1.9, 'high', 17.0), (1, 18, 1.4, 'medium', 22.0), (1, 19, 1.2, 'low', 25.0),
    (2, 7, 1.6, 'medium', 19.0), (2, 8, 1.9, 'high', 17.0), (2, 9, 1.7, 'high', 18.0), (2, 17, 2.0, 'high', 16.0), (2, 18, 1.5, 'medium', 21.0), (2, 19, 1.3, 'medium', 23.0),
    (3, 7, 1.6, 'medium', 19.0), (3, 8, 1.9, 'high', 17.0), (3, 9, 1.7, 'high', 18.0), (3, 17, 2.0, 'high', 16.0), (3, 18, 1.5, 'medium', 21.0), (3, 19, 1.3, 'medium', 23.0),
    (4, 7, 1.6, 'medium', 19.0), (4, 8, 1.9, 'high', 17.0), (4, 9, 1.7, 'high', 18.0), (4, 17, 2.0, 'high', 16.0), (4, 18, 1.5, 'medium', 21.0), (4, 19, 1.3, 'medium', 23.0),
    (5, 7, 1.2, 'low', 24.0), (5, 8, 1.4, 'medium', 22.0), (5, 9, 1.3, 'low', 23.0), (5, 17, 1.6, 'medium', 20.0), (5, 18, 1.3, 'low', 23.0), (5, 19, 1.1, 'low', 26.0),
    (6, 7, 1.1, 'low', 25.0), (6, 8, 1.2, 'low', 24.0), (6, 9, 1.1, 'low', 25.0), (6, 17, 1.4, 'medium', 22.0), (6, 18, 1.2, 'low', 24.0), (6, 19, 1.1, 'low', 25.0)
) AS patterns(dow, hod, multiplier, level, speed)
ON CONFLICT DO NOTHING;