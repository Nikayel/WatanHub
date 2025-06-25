-- Create student_resumes table for storing resume file information
CREATE TABLE IF NOT EXISTS student_resumes (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_student_resumes_student_id ON student_resumes(student_id);

-- Enable RLS
ALTER TABLE student_resumes ENABLE ROW LEVEL SECURITY;

-- Drop old policies first
DROP POLICY IF EXISTS student_resumes_mentor_policy ON student_resumes;
DROP POLICY IF EXISTS "Mentors can view student resumes" ON storage.objects;

-- Policy for students to manage their own resumes
CREATE POLICY student_resumes_student_policy ON student_resumes
  FOR ALL TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Updated policy for mentors to view their students' resumes using mentor_student table
CREATE POLICY student_resumes_mentor_policy ON student_resumes
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM mentor_student ms
    WHERE ms.student_id = student_resumes.student_id 
    AND ms.mentor_id = auth.uid()
  ));

-- Policy for admins to view all resumes
CREATE POLICY student_resumes_admin_policy ON student_resumes
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin a 
    WHERE a.email = auth.email()
  ));

-- Create storage bucket for student resumes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-resumes', 'student-resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Students can upload their own resumes" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students can view their own resumes" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'student-resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students can delete their own resumes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'student-resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Updated policy for mentors to view student resumes using mentor_student table
CREATE POLICY "Mentors can view student resumes" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-resumes' 
    AND EXISTS (
      SELECT 1 FROM mentor_student ms
      WHERE ms.student_id::text = (storage.foldername(name))[1]
      AND ms.mentor_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all resumes" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'student-resumes' 
    AND EXISTS (
      SELECT 1 FROM admin a 
      WHERE a.email = auth.email()
    )
  ); 