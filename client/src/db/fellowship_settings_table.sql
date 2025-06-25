-- Create fellowship_settings table for dynamic fellowship program information
CREATE TABLE IF NOT EXISTS fellowship_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_date TEXT NOT NULL DEFAULT 'August 1st, 2024',
    description TEXT NOT NULL DEFAULT 'An intensive 8-week program designed to empower Afghan students with skills, mentorship, and opportunities for academic and professional success.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default fellowship information
INSERT INTO fellowship_settings (start_date, description) 
VALUES (
    'August 1st, 2024',
    'An intensive 8-week program designed to empower Afghan students with skills, mentorship, and opportunities for academic and professional success.'
) ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE fellowship_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to fellowship settings" ON fellowship_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow admin to update fellowship settings" ON fellowship_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin 
            WHERE email = auth.jwt() ->> 'email'
        )
    ); 