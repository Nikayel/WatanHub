-- Add Missing Columns to Existing Fellowship Settings Table
-- Run this ONLY if fellowship_settings table already exists but is missing columns

-- Add missing columns one by one
ALTER TABLE fellowship_settings 
ADD COLUMN IF NOT EXISTS application_deadline TEXT DEFAULT 'Applications are currently closed. Please check back soon or fill out our waitlist form.';

ALTER TABLE fellowship_settings 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE fellowship_settings 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE fellowship_settings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing rows to have the is_active column set to true
UPDATE fellowship_settings SET is_active = true WHERE is_active IS NULL;

-- Update existing rows to have timestamps if they're null
UPDATE fellowship_settings SET created_at = NOW() WHERE created_at IS NULL;
UPDATE fellowship_settings SET updated_at = NOW() WHERE updated_at IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fellowship_settings'
ORDER BY ordinal_position;

-- Show current data
SELECT * FROM fellowship_settings; 