-- First drop the existing insert policy
DROP POLICY IF EXISTS mentor_notes_insert_policy ON mentor_notes;

-- Create a new policy that allows inserts without the RLS check
CREATE POLICY mentor_notes_insert_policy ON mentor_notes
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- This will allow any authenticated user to insert a note
-- You can add a more restrictive policy later if needed 