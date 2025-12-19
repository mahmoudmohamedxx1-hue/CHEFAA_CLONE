CREATE TABLE medication_recommendations (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    medication_id VARCHAR(255) NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    genetic_compatibility_score DECIMAL(3,2),
    recommended_dosage VARCHAR(100),
    efficacy_prediction DECIMAL(3,2),
    genetic_rationale TEXT,
    alternative_medications JSONB,
    confidence_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);