-- Migration: phase4_part5_pharmacy_delivery
-- Created at: 1762075593

-- Phase 4 Part 5: Pharmacy Network and Delivery Tracking

-- Partner pharmacies
CREATE TABLE IF NOT EXISTS partner_pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  operating_hours JSONB,
  is_24_hours BOOLEAN DEFAULT FALSE,
  delivery_enabled BOOLEAN DEFAULT TRUE,
  accepts_insurance BOOLEAN DEFAULT FALSE,
  quality_rating DECIMAL(3,2) DEFAULT 4.5,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pharmacy inventory
CREATE TABLE IF NOT EXISTS pharmacy_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pharmacy_id UUID NOT NULL REFERENCES partner_pharmacies(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity_available INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pharmacy_id, product_id)
);

-- Prescription fulfillment workflow
CREATE TABLE IF NOT EXISTS prescription_fulfillments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  assigned_pharmacy_id UUID REFERENCES partner_pharmacies(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'preparing', 'ready', 'dispatched', 'delivered')),
  assigned_at TIMESTAMPTZ,
  ready_at TIMESTAMPTZ,
  dispatched_at TIMESTAMPTZ,
  pharmacist_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery drivers
CREATE TABLE IF NOT EXISTS delivery_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_type TEXT CHECK (vehicle_type IN ('motorcycle', 'car', 'bicycle', 'van')),
  vehicle_number TEXT,
  license_number TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  current_latitude DECIMAL(10,8),
  current_longitude DECIMAL(11,8),
  rating DECIMAL(3,2) DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery assignments and tracking
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  driver_id UUID REFERENCES delivery_drivers(id),
  pharmacy_id UUID REFERENCES partner_pharmacies(id),
  delivery_type TEXT DEFAULT 'standard' CHECK (delivery_type IN ('express', 'standard', 'scheduled')),
  pickup_latitude DECIMAL(10,8),
  pickup_longitude DECIMAL(11,8),
  delivery_latitude DECIMAL(10,8),
  delivery_longitude DECIMAL(11,8),
  estimated_pickup_time TIMESTAMPTZ,
  estimated_delivery_time TIMESTAMPTZ,
  actual_pickup_time TIMESTAMPTZ,
  actual_delivery_time TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'assigned', 'driver_heading_to_pharmacy', 'picked_up', 
    'in_transit', 'arrived', 'delivered', 'failed', 'canceled'
  )),
  tracking_code TEXT UNIQUE,
  delivery_instructions TEXT,
  delivery_photo_url TEXT,
  signature_url TEXT,
  customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
  customer_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery location history
CREATE TABLE IF NOT EXISTS delivery_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id),
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  speed DECIMAL(5,2),
  heading DECIMAL(5,2),
  battery_level INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery notifications
CREATE TABLE IF NOT EXISTS delivery_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'assigned', 'picked_up', 'in_transit', 'near_delivery', 'delivered', 'delayed'
  )),
  message TEXT NOT NULL,
  sent_via TEXT[] DEFAULT ARRAY['push'],
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_pharmacy ON pharmacy_inventory(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_product ON pharmacy_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_delivery_location_delivery ON delivery_location_history(delivery_id);
;