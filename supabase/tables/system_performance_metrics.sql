CREATE TABLE system_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT now(),
    metric_type VARCHAR(100) NOT NULL,
    metric_name VARCHAR(255) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);