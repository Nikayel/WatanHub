-- Add survey fields directly to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS school_type TEXT,
  ADD COLUMN IF NOT EXISTS household_income_band TEXT,
  ADD COLUMN IF NOT EXISTS parental_education TEXT,
  ADD COLUMN IF NOT EXISTS internet_speed TEXT,
  ADD COLUMN IF NOT EXISTS college_admit BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scholarship_awarded BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stem_major BOOLEAN DEFAULT FALSE;

-- Create index for these new columns for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_province ON profiles(province);
CREATE INDEX IF NOT EXISTS idx_profiles_college_admit ON profiles(college_admit);
CREATE INDEX IF NOT EXISTS idx_profiles_scholarship_awarded ON profiles(scholarship_awarded);
CREATE INDEX IF NOT EXISTS idx_profiles_stem_major ON profiles(stem_major); 