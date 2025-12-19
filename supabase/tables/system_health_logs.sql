CREATE TABLE system_health_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
    response_time_ms INTEGER,
    error_count INTEGER DEFAULT 0,
    warning_count INTEGER DEFAULT 0,
    uptime_percentage DECIMAL(5,2),
    metadata JSONB,
    timestamp TIMESTAMPTZ DEFAULT now()
);