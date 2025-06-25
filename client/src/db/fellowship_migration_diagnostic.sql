-- Fellowship Settings Diagnostic and Fix Script
-- Run this in Supabase SQL Editor to diagnose and fix issues

-- Step 1: Check if table exists
SELECT 
  schemaname, 
  tablename, 
  tableowner 
FROM pg_tables 
WHERE tablename = 'fellowship_settings';

-- Step 2: Check table structure if it exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fellowship_settings'
ORDER BY ordinal_position;

-- Step 3: Check existing data
SELECT * FROM fellowship_settings WHERE is_active = true;

-- Step 4: Clean up and recreate (if needed)
-- Uncomment below if you need to start fresh:

/*
-- Drop existing table (CAUTION: This will delete all data)
DROP TABLE IF EXISTS fellowship_settings CASCADE;
*/

-- Step 5: Create table with all required fields
CREATE TABLE IF NOT EXISTS fellowship_settings (
  id SERIAL PRIMARY KEY,
  start_date TEXT NOT NULL DEFAULT 'January 2025',
  description TEXT NOT NULL DEFAULT 'Our comprehensive fellowship program is designed to empower Afghan students with the skills, knowledge, and connections needed to succeed in their academic and professional journeys.',
  program_highlights JSONB NOT NULL DEFAULT '["Personalized mentorship", "College application guidance", "Professional development", "Cultural preservation activities", "Networking opportunities", "Scholarship support"]'::jsonb,
  who_can_apply JSONB NOT NULL DEFAULT '["Afghan students worldwide", "Committed to academic excellence", "Passionate about community impact", "Ready for transformation", "Age 16-25", "Strong English proficiency"]'::jsonb,
  application_deadline TEXT DEFAULT 'Applications are currently closed. Please check back soon or fill out our waitlist form.',
  application_status TEXT DEFAULT 'locked' CHECK (application_status IN ('locked', 'unlocked')),
  application_link TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Add missing columns if they don't exist
ALTER TABLE fellowship_settings 
ADD COLUMN IF NOT EXISTS application_deadline TEXT DEFAULT 'Applications are currently closed. Please check back soon or fill out our waitlist form.';

ALTER TABLE fellowship_settings 
ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'locked';

ALTER TABLE fellowship_settings 
ADD COLUMN IF NOT EXISTS application_link TEXT DEFAULT '';

-- Add constraint if it doesn't exist
DO $$ BEGIN
    ALTER TABLE fellowship_settings ADD CONSTRAINT fellowship_settings_application_status_check 
    CHECK (application_status IN ('locked', 'unlocked'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 7: Delete any existing data and insert fresh defaults
DELETE FROM fellowship_settings;

INSERT INTO fellowship_settings (
  start_date, 
  description, 
  program_highlights, 
  who_can_apply, 
  application_deadline, 
  application_status, 
  application_link,
  is_active
) 
VALUES (
  'January 2025',
  'Our comprehensive fellowship program is designed to empower Afghan students with the skills, knowledge, and connections needed to succeed in their academic and professional journeys.',
  '["Personalized mentorship", "College application guidance", "Professional development", "Cultural preservation activities", "Networking opportunities", "Scholarship support"]'::jsonb,
  '["Afghan students worldwide", "Committed to academic excellence", "Passionate about community impact", "Ready for transformation", "Age 16-25", "Strong English proficiency"]'::jsonb,
  'Applications are currently closed. Please check back soon or fill out our waitlist form.',
  'locked',
  '',
  true
);

-- Step 8: Enable RLS and set policies
ALTER TABLE fellowship_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public to read fellowship settings" ON fellowship_settings;
DROP POLICY IF EXISTS "Allow admins to manage fellowship settings" ON fellowship_settings;

-- Create new policies
CREATE POLICY "Allow public to read fellowship settings" 
ON fellowship_settings FOR SELECT 
USING (true);

CREATE POLICY "Allow admins to manage fellowship settings" 
ON fellowship_settings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Step 9: Verify final state
SELECT 'Table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fellowship_settings'
ORDER BY ordinal_position;

SELECT 'Data check:' as info;
SELECT * FROM fellowship_settings WHERE is_active = true;

SELECT 'Policies check:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'fellowship_settings'; 