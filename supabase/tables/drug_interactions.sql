CREATE TABLE drug_interactions (
    id SERIAL PRIMARY KEY,
    drug_a_id VARCHAR(255) NOT NULL,
    drug_a_name VARCHAR(255) NOT NULL,
    drug_b_id VARCHAR(255) NOT NULL,
    drug_b_name VARCHAR(255) NOT NULL,
    severity_score INTEGER CHECK (severity_score BETWEEN 1 AND 10),
    interaction_type VARCHAR(100),
    mechanism TEXT,
    clinical_effects TEXT,
    evidence_level VARCHAR(50),
    confidence_score DECIMAL(3,2),
    alternative_suggestions JSONB,
    contraindication BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);