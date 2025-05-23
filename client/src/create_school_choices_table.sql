-- Create student_school_choices table for managing target, safety, and stretch schools
CREATE TABLE IF NOT EXISTS student_school_choices (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id INTEGER,
  major_id INTEGER,
  school_name TEXT NOT NULL,
  major_name TEXT NOT NULL,
  preference_type TEXT CHECK (preference_type IN ('target', 'safety', 'stretch')),
  notes TEXT,
  application_status TEXT DEFAULT 'planning' CHECK (application_status IN ('planning', 'applied', 'accepted', 'rejected', 'waitlisted', 'deferred', 'enrolled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on student_id for faster queries
CREATE INDEX IF NOT EXISTS student_school_choices_student_id_idx ON student_school_choices(student_id);

-- Set up Row Level Security
ALTER TABLE student_school_choices ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their own school choices
CREATE POLICY student_school_choices_select_policy ON student_school_choices
  FOR SELECT
  USING (auth.uid() = student_id);

-- Policy for authenticated users to insert their own school choices
CREATE POLICY student_school_choices_insert_policy ON student_school_choices
  FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Policy for authenticated users to update their own school choices
CREATE POLICY student_school_choices_update_policy ON student_school_choices
  FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Policy for authenticated users to delete their own school choices
CREATE POLICY student_school_choices_delete_policy ON student_school_choices
  FOR DELETE
  USING (auth.uid() = student_id);

-- Create policy for mentors to view their students' school choices (if mentor_student table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'mentor_student'
  ) THEN
    EXECUTE '
      CREATE POLICY mentor_view_student_choices ON student_school_choices
        FOR SELECT
        USING (EXISTS (
          SELECT 1 FROM mentor_student 
          WHERE mentor_student.student_id = student_school_choices.student_id 
          AND mentor_student.mentor_id = auth.uid()
        ))
    ';
  END IF;
END
$$;

-- Create policy for admin access (if admin table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'admin'
  ) THEN
    EXECUTE '
      CREATE POLICY admin_manage_school_choices ON student_school_choices
        FOR ALL
        USING (EXISTS (
          SELECT 1 FROM admin 
          WHERE admin.id = auth.uid()
        ))
    ';
  END IF;
END
$$; 