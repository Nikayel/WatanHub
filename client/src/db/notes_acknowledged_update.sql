-- Ensure all existing records have the acknowledged field properly set
-- Set up an index on the acknowledged field for faster queries
CREATE INDEX IF NOT EXISTS idx_mentor_notes_acknowledged ON mentor_notes(acknowledged);

-- Set the default value for null acknowledged fields
UPDATE mentor_notes 
SET acknowledged = FALSE
WHERE acknowledged IS NULL;

-- For older records without the new fields, make sure they have proper values
UPDATE mentor_notes
SET 
  description = COALESCE(description, 'Previous Note'),
  task = COALESCE(task, 'Task'),
  start_date = COALESCE(start_date, created_at),
  acknowledged = COALESCE(acknowledged, FALSE);

-- Add an updated_at column if it doesn't exist and ensure it's populated
ALTER TABLE mentor_notes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update any existing records to have updated_at set
UPDATE mentor_notes
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Add a view to easily analyze note statistics
DROP VIEW IF EXISTS mentor_notes_stats;

CREATE OR REPLACE VIEW mentor_notes_stats AS
SELECT 
  mentor_id,
  COUNT(*) as total_notes,
  SUM(CASE WHEN acknowledged = TRUE THEN 1 ELSE 0 END) as acknowledged_notes,
  COUNT(*) - SUM(CASE WHEN acknowledged = TRUE THEN 1 ELSE 0 END) as pending_notes,
  EXTRACT(MONTH FROM created_at) as month,
  EXTRACT(YEAR FROM created_at) as year,
  COUNT(DISTINCT student_id) as unique_students
FROM mentor_notes
GROUP BY mentor_id, EXTRACT(MONTH FROM created_at), EXTRACT(YEAR FROM created_at);

-- Create a more detailed view for timeline analytics
CREATE OR REPLACE VIEW mentor_notes_timeline AS
SELECT
  mentor_id,
  DATE_TRUNC('month', created_at) as period,
  COUNT(*) as total_notes,
  SUM(CASE WHEN acknowledged = TRUE THEN 1 ELSE 0 END) as acknowledged_notes,
  COUNT(*) - SUM(CASE WHEN acknowledged = TRUE THEN 1 ELSE 0 END) as pending_notes,
  COUNT(DISTINCT student_id) as unique_students,
  AVG(EXTRACT(EPOCH FROM (CASE WHEN acknowledged = TRUE THEN updated_at ELSE CURRENT_TIMESTAMP END) - created_at) / 86400) as avg_days_to_acknowledge
FROM mentor_notes
GROUP BY mentor_id, DATE_TRUNC('month', created_at)
ORDER BY mentor_id, period;

-- Create a function to automatically update the updated_at timestamp when a note is acknowledged
CREATE OR REPLACE FUNCTION update_mentor_note_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.acknowledged = FALSE AND NEW.acknowledged = TRUE THEN
    NEW.updated_at = CURRENT_TIMESTAMP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function when a note is updated
DROP TRIGGER IF EXISTS update_mentor_note_timestamp ON mentor_notes;
CREATE TRIGGER update_mentor_note_timestamp
BEFORE UPDATE ON mentor_notes
FOR EACH ROW
EXECUTE FUNCTION update_mentor_note_updated_at(); 