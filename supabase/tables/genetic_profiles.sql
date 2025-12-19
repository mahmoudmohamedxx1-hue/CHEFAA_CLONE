CREATE TABLE genetic_profiles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    genetic_markers JSONB NOT NULL,
    cyp2d6_variant VARCHAR(50),
    cyp2c19_variant VARCHAR(50),
    cyp3a4_variant VARCHAR(50),
    other_variants JSONB,
    test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    test_provider VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);