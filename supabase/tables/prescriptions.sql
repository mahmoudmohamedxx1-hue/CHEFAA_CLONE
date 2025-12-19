CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    prescription_image_url TEXT,
    prescription_text TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    pharmacy_id UUID,
    pharmacy_notes TEXT,
    order_id UUID,
    delivery_address JSONB,
    phone VARCHAR(20),
    handling_preference VARCHAR(50) DEFAULT 'substitute',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);