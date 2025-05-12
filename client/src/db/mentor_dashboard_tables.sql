-- Mentor Notes Table
CREATE TABLE IF NOT EXISTS mentor_notes (
  id SERIAL PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mentor_notes_mentor_id ON mentor_notes(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_notes_student_id ON mentor_notes(student_id);

-- Enable RLS
ALTER TABLE mentor_notes ENABLE ROW LEVEL SECURITY;

-- Mentor meetings table
CREATE TABLE IF NOT EXISTS mentor_meetings (
  id SERIAL PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  meeting_link TEXT,
  meeting_notes TEXT,
  status VARCHAR(20) CHECK (status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mentor_meetings_mentor_id ON mentor_meetings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_meetings_student_id ON mentor_meetings(student_id);

-- Enable RLS
ALTER TABLE mentor_meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mentor_notes
CREATE POLICY mentor_notes_insert_policy ON mentor_notes
  FOR INSERT TO authenticated
  WITH CHECK (mentor_id = auth.uid());

CREATE POLICY mentor_notes_select_policy ON mentor_notes
  FOR SELECT TO authenticated
  USING (mentor_id = auth.uid());

CREATE POLICY mentor_notes_update_policy ON mentor_notes
  FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid());

-- RLS Policies for mentor_meetings
CREATE POLICY mentor_meetings_insert_policy ON mentor_meetings
  FOR INSERT TO authenticated
  WITH CHECK (mentor_id = auth.uid());

CREATE POLICY mentor_meetings_select_policy ON mentor_meetings
  FOR SELECT TO authenticated
  USING (mentor_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY mentor_meetings_update_policy ON mentor_meetings
  FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid());

-- To allow students to see notes left by their mentors
CREATE POLICY mentor_notes_student_view_policy ON mentor_notes
  FOR SELECT TO authenticated
  USING (student_id = auth.uid()); 