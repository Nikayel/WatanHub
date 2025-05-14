-- Drop all existing policies for mentor_notes
DROP POLICY IF EXISTS mentor_notes_insert_policy ON mentor_notes;
DROP POLICY IF EXISTS mentor_notes_select_policy ON mentor_notes;
DROP POLICY IF EXISTS mentor_notes_update_policy ON mentor_notes;
DROP POLICY IF EXISTS mentor_notes_student_view_policy ON mentor_notes;

-- Create permissive insert policy
CREATE POLICY mentor_notes_insert_policy ON mentor_notes
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow mentors to see notes they've created
CREATE POLICY mentor_notes_select_policy ON mentor_notes
  FOR SELECT TO authenticated
  USING (mentor_id = auth.uid() OR EXISTS (
    SELECT 1 FROM mentor_student ms 
    WHERE ms.mentor_id = auth.uid() AND ms.student_id = mentor_notes.student_id
  ));

-- Allow mentors to update their own notes
CREATE POLICY mentor_notes_update_policy ON mentor_notes
  FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid());

-- Allow students to see notes related to them
CREATE POLICY mentor_notes_student_view_policy ON mentor_notes
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Allow admins to see all notes 
CREATE POLICY mentor_notes_admin_policy ON mentor_notes
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admin a 
    WHERE a.email = auth.email()
  ));

-- Add a function to get auth.uid() for debugging
CREATE OR REPLACE FUNCTION get_auth_uid() 
RETURNS uuid 
LANGUAGE sql SECURITY DEFINER 
AS $$
  SELECT auth.uid();
$$; 