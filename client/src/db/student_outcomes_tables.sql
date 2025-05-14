-- Student Outcomes Tables
-- These tables track detailed outcomes for students

-- College Admissions Table
CREATE TABLE IF NOT EXISTS college_admissions (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id),
  college_name TEXT NOT NULL,
  major TEXT,
  application_date DATE,
  admission_date DATE NOT NULL,
  admission_type TEXT CHECK (admission_type IN ('early_decision', 'early_action', 'regular', 'rolling', 'transfer', 'other')),
  is_stem BOOLEAN DEFAULT false,
  city TEXT,
  country TEXT,
  college_rank INT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Scholarship Awards Table
CREATE TABLE IF NOT EXISTS scholarship_awards (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id),
  scholarship_name TEXT NOT NULL,
  provider TEXT,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  award_date DATE NOT NULL,
  duration TEXT, -- e.g., "4 years", "one-time"
  renewable BOOLEAN DEFAULT false,
  requirements TEXT, -- e.g., "maintain 3.5 GPA"
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Jobs/Internships Table
CREATE TABLE IF NOT EXISTS student_employment (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id),
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  employment_type TEXT CHECK (employment_type IN ('internship', 'part_time', 'full_time', 'contract', 'other')),
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT true,
  industry TEXT,
  salary DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_college_admissions_student_id ON college_admissions(student_id);
CREATE INDEX IF NOT EXISTS idx_college_admissions_mentor_id ON college_admissions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_awards_student_id ON scholarship_awards(student_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_awards_mentor_id ON scholarship_awards(mentor_id);
CREATE INDEX IF NOT EXISTS idx_student_employment_student_id ON student_employment(student_id);
CREATE INDEX IF NOT EXISTS idx_student_employment_mentor_id ON student_employment(mentor_id);

-- Enable RLS
ALTER TABLE college_admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarship_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_employment ENABLE ROW LEVEL SECURITY;

-- RLS Policies for college_admissions
CREATE POLICY college_admissions_insert_policy ON college_admissions
  FOR INSERT TO authenticated
  WITH CHECK (mentor_id = auth.uid());

CREATE POLICY college_admissions_select_policy ON college_admissions
  FOR SELECT TO authenticated
  USING (mentor_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY college_admissions_update_policy ON college_admissions
  FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid());

-- RLS Policies for scholarship_awards
CREATE POLICY scholarship_awards_insert_policy ON scholarship_awards
  FOR INSERT TO authenticated
  WITH CHECK (mentor_id = auth.uid());

CREATE POLICY scholarship_awards_select_policy ON scholarship_awards
  FOR SELECT TO authenticated
  USING (mentor_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY scholarship_awards_update_policy ON scholarship_awards
  FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid());

-- RLS Policies for student_employment
CREATE POLICY student_employment_insert_policy ON student_employment
  FOR INSERT TO authenticated
  WITH CHECK (mentor_id = auth.uid());

CREATE POLICY student_employment_select_policy ON student_employment
  FOR SELECT TO authenticated
  USING (mentor_id = auth.uid() OR student_id = auth.uid());

CREATE POLICY student_employment_update_policy ON student_employment
  FOR UPDATE TO authenticated
  USING (mentor_id = auth.uid());

-- Allow admins to see all data
CREATE POLICY admin_college_admissions_policy ON college_admissions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin a WHERE a.email = auth.email()));

CREATE POLICY admin_scholarship_awards_policy ON scholarship_awards
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin a WHERE a.email = auth.email()));

CREATE POLICY admin_student_employment_policy ON student_employment
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin a WHERE a.email = auth.email())); 