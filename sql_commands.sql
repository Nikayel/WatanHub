-- SQL command to add phone_number column to profiles table

-- Add the phone_number column to the profiles table
ALTER TABLE profiles ADD COLUMN phone_number VARCHAR(20);

-- Update RLS policy to allow users to update their own phone_number
ALTER POLICY update_own_profile ON profiles 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- Note: Run this SQL in the Supabase SQL editor
-- You may need to adjust the policy if your RLS is set up differently 

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
CREATE INDEX student_school_choices_student_id_idx ON student_school_choices(student_id);

-- Set up Row Level Security
ALTER TABLE student_school_choices ENABLE ROW LEVEL SECURITY;

-- Policy for students to view and edit their own school choices
CREATE POLICY student_school_choices_policy ON student_school_choices
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Policy for mentors to view their students' school choices
CREATE POLICY mentor_view_student_choices ON student_school_choices
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM mentor_student 
    WHERE mentor_student.student_id = student_school_choices.student_id 
    AND mentor_student.mentor_id = auth.uid()
  ));

-- Policy for admins to manage all school choices
CREATE POLICY admin_manage_school_choices ON student_school_choices
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )); 