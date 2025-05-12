-- Add acknowledged field to mentor_notes table if it doesn't exist
ALTER TABLE mentor_notes ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT FALSE;

-- Add missing fields to existing notes
ALTER TABLE mentor_notes 
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT 'Note',
  ADD COLUMN IF NOT EXISTS task TEXT DEFAULT 'Task',
  ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- Update existing records to have valid data
UPDATE mentor_notes
SET description = 'Previous Note',
    task = 'Review'
WHERE description IS NULL OR task IS NULL;

-- Make the new columns NOT NULL after populating data
ALTER TABLE mentor_notes 
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN task SET NOT NULL; 