CREATE TABLE smart_medication_schedules (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    medication_id VARCHAR(255) NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    optimal_time TIME NOT NULL,
    frequency_per_day INTEGER,
    scheduling_rationale TEXT,
    lifestyle_considerations JSONB,
    interaction_warnings JSONB,
    reminder_frequency VARCHAR(50),
    schedule_conflicts JSONB,
    ai_confidence_score DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);