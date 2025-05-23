-- SQL command to add phone_number column to profiles table

-- Add the phone_number column to the profiles table
ALTER TABLE profiles ADD COLUMN phone_number VARCHAR(20);

-- Update RLS policy to allow users to update their own phone_number
ALTER POLICY update_own_profile ON profiles 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- Note: Run this SQL in the Supabase SQL editor
-- You may need to adjust the policy if your RLS is set up differently 