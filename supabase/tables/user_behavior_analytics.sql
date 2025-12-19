CREATE TABLE user_behavior_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    page_url TEXT NOT NULL,
    element_id VARCHAR(255),
    click_x INTEGER,
    click_y INTEGER,
    duration_seconds INTEGER,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    country VARCHAR(100),
    city VARCHAR(100),
    timestamp TIMESTAMPTZ DEFAULT now()
);