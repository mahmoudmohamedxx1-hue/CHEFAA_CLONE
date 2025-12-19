CREATE TABLE pharmacies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    rating DECIMAL(3,2) DEFAULT 0,
    services JSONB DEFAULT '[]',
    delivery_areas JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    working_hours JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);