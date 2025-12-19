CREATE TABLE medication_adherence_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    medication_id VARCHAR(255) NOT NULL,
    medication_name VARCHAR(255) NOT NULL,
    prescribed_dosage VARCHAR(100),
    scheduled_time TIME,
    taken_time TIMESTAMPTZ,
    adherence_status VARCHAR(50) NOT NULL,
    missed_reason TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    reminder_effectiveness INTEGER CHECK (reminder_effectiveness >= 0 AND reminder_effectiveness <= 100),
    metadata JSONB,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);