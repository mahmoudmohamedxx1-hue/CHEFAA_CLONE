CREATE TABLE security_events_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET NOT NULL,
    description TEXT,
    action_taken VARCHAR(255),
    metadata JSONB,
    country VARCHAR(100),
    city VARCHAR(100),
    timestamp TIMESTAMPTZ DEFAULT now()
);