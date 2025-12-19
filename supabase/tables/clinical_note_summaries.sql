CREATE TABLE clinical_note_summaries (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    original_note_id VARCHAR(255),
    original_note TEXT NOT NULL,
    summary TEXT NOT NULL,
    key_findings JSONB,
    critical_flags JSONB,
    medical_terminology JSONB,
    sentiment_analysis JSONB,
    note_type VARCHAR(100),
    language VARCHAR(10) DEFAULT 'en',
    processing_time_ms INTEGER,
    model_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);