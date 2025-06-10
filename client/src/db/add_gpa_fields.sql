-- Add academic performance fields to profiles table

-- Add GPA field (scale of 4.0)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gpa DECIMAL(3,2);

-- Add extracurricular activities field
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS extracurricular_activities TEXT;

-- Add additional city and country fields for student_school_choices
ALTER TABLE student_school_choices ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE student_school_choices ADD COLUMN IF NOT EXISTS country TEXT;

-- Add comments for documentation
COMMENT ON COLUMN profiles.gpa IS 'Student GPA on 4.0 scale';
COMMENT ON COLUMN profiles.extracurricular_activities IS 'Student extracurricular activities and achievements';
COMMENT ON COLUMN student_school_choices.city IS 'City where the school is located';
COMMENT ON COLUMN student_school_choices.country IS 'Country where the school is located';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_gpa ON profiles(gpa);

-- Update any existing policies to include new fields (if they exist)
-- The existing RLS policies should automatically cover these new columns 