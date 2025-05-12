-- WatanHub Final Migration Script
-- This script handles the complete migration to role-based user structure

-- Make sure we have the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create the core tables
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  role TEXT NOT NULL CHECK (role IN ('student', 'mentor', 'admin')),
  active BOOLEAN DEFAULT TRUE
);

-- Create a sequence for student IDs
CREATE SEQUENCE IF NOT EXISTS student_id_seq START 1;

CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id INTEGER UNIQUE DEFAULT nextval('student_id_seq'),
  first_name TEXT,
  last_name TEXT,
  education_level TEXT,
  english_level TEXT,
  toefl_score INTEGER,
  interests TEXT,
  birth_year INTEGER,
  gender TEXT,
  religion TEXT,
  bio TEXT,
  is_assigned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT,
  languages TEXT[],
  bio TEXT,
  available_hours_per_week INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentor_student (
  mentor_id UUID REFERENCES mentors(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (mentor_id, student_id)
);

-- 2. Create indexes for tables
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_mentors_user_id ON mentors(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_student_mentor_id ON mentor_student(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_student_student_id ON mentor_student(student_id);

-- 3. Create a temporary admin table (if needed)
CREATE TABLE IF NOT EXISTS admin (
  email TEXT PRIMARY KEY
);

-- You would need to insert admin emails manually here
-- Example: INSERT INTO admin (email) VALUES ('admin@example.com');

-- 4. Create views for easier querying
CREATE OR REPLACE VIEW student_profiles AS
SELECT 
  s.*,
  u.email,
  u.created_at as joined_at
FROM students s
JOIN users u ON s.user_id = u.id;

CREATE OR REPLACE VIEW mentor_profiles AS
SELECT 
  m.*,
  u.email as user_email,
  u.created_at as joined_at
FROM mentors m
JOIN users u ON m.user_id = u.id;

-- 5. Create a backward compatibility view for the profiles table
CREATE OR REPLACE VIEW profiles AS
SELECT 
  u.id,
  u.email,
  u.created_at,
  s.first_name,
  s.last_name,
  s.education_level,
  s.english_level,
  s.toefl_score,
  s.interests,
  s.birth_year,
  s.gender,
  s.religion,
  s.bio,
  s.is_assigned,
  s.student_id,
  u.created_at as updated_at,
  CASE 
    WHEN u.role = 'admin' THEN true
    ELSE false
  END as is_admin
FROM users u
LEFT JOIN students s ON u.id = s.user_id; 