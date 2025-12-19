CREATE TABLE adherence_predictions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    medication_id VARCHAR(255) NOT NULL,
    adherence_probability DECIMAL(3,2) NOT NULL,
    risk_score INTEGER CHECK (risk_score BETWEEN 1 AND 10),
    risk_level VARCHAR(20),
    behavioral_factors JSONB,
    prediction_factors JSONB,
    intervention_recommendations TEXT,
    model_version VARCHAR(50),
    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);