CREATE TABLE clinical_trial_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trial_id VARCHAR(255) NOT NULL,
    trial_name VARCHAR(255) NOT NULL,
    phase VARCHAR(50) NOT NULL,
    enrolled_patients INTEGER DEFAULT 0,
    completed_patients INTEGER DEFAULT 0,
    dropout_rate DECIMAL(5,2),
    success_rate DECIMAL(5,2),
    protocol_adherence_rate DECIMAL(5,2),
    adverse_events_count INTEGER DEFAULT 0,
    primary_outcome_met BOOLEAN,
    regulatory_status VARCHAR(100),
    start_date DATE,
    end_date DATE,
    metadata JSONB,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);