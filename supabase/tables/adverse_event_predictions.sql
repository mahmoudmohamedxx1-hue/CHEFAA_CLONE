CREATE TABLE adverse_event_predictions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    medication_id VARCHAR(255) NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    adverse_event_type VARCHAR(255) NOT NULL,
    prediction_probability DECIMAL(3,2) NOT NULL,
    severity_level VARCHAR(20),
    risk_factors JSONB,
    patient_vitals JSONB,
    early_warning_indicators JSONB,
    intervention_recommendations TEXT,
    monitoring_frequency VARCHAR(50),
    model_confidence DECIMAL(3,2),
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);