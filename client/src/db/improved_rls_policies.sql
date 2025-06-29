-- ================================
-- WATANHUB IMPROVED RLS POLICIES
-- Security-First Database Policies
-- ================================

-- First, ensure all tables have RLS enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorapplications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

-- ================================
-- HELPER FUNCTIONS FOR RLS
-- ================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin 
    WHERE email = auth.email()
  );
$$;

-- Function to check if user is approved mentor
CREATE OR REPLACE FUNCTION auth.is_mentor()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM mentorapplications 
    WHERE email = auth.email() AND status = 'approved'
  );
$$;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION auth.has_role(role_name text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT CASE 
    WHEN role_name = 'admin' THEN auth.is_admin()
    WHEN role_name = 'mentor' THEN auth.is_mentor()
    ELSE false
  END;
$$;

-- ================================
-- PROFILES TABLE POLICIES
-- ================================

-- Drop existing policies
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
DROP POLICY IF EXISTS profiles_update_policy ON profiles;

-- Users can view their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Mentors can view their assigned students
CREATE POLICY profiles_mentor_students ON profiles
  FOR SELECT TO authenticated
  USING (
    auth.is_mentor() AND
    EXISTS (
      SELECT 1 FROM mentor_student ms
      WHERE ms.mentor_id = auth.uid() AND ms.student_id = profiles.id
    )
  );

-- Admins can view all profiles
CREATE POLICY profiles_admin_all ON profiles
  FOR SELECT TO authenticated
  USING (auth.is_admin());

-- Users can insert their own profile
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY profiles_admin_update ON profiles
  FOR UPDATE TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ================================
-- MENTOR NOTES TABLE POLICIES
-- ================================

-- Drop existing policies
DROP POLICY IF EXISTS mentor_notes_insert_policy ON mentor_notes;
DROP POLICY IF EXISTS mentor_notes_select_policy ON mentor_notes;
DROP POLICY IF EXISTS mentor_notes_update_policy ON mentor_notes;
DROP POLICY IF EXISTS mentor_notes_student_view_policy ON mentor_notes;
DROP POLICY IF EXISTS mentor_notes_admin_policy ON mentor_notes;

-- Only approved mentors can insert notes
CREATE POLICY mentor_notes_mentor_insert ON mentor_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    mentor_id = auth.uid() AND
    auth.is_mentor() AND
    EXISTS (
      SELECT 1 FROM mentor_student ms
      WHERE ms.mentor_id = auth.uid() AND ms.student_id = mentor_notes.student_id
    )
  );

-- Mentors can view notes they created for their assigned students
CREATE POLICY mentor_notes_mentor_select ON mentor_notes
  FOR SELECT TO authenticated
  USING (
    mentor_id = auth.uid() AND
    auth.is_mentor() AND
    EXISTS (
      SELECT 1 FROM mentor_student ms
      WHERE ms.mentor_id = auth.uid() AND ms.student_id = mentor_notes.student_id
    )
  );

-- Students can view notes created for them
CREATE POLICY mentor_notes_student_select ON mentor_notes
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Mentors can update only their own notes
CREATE POLICY mentor_notes_mentor_update ON mentor_notes
  FOR UPDATE TO authenticated
  USING (
    mentor_id = auth.uid() AND
    auth.is_mentor()
  )
  WITH CHECK (
    mentor_id = auth.uid() AND
    auth.is_mentor()
  );

-- Admins can view all notes
CREATE POLICY mentor_notes_admin_all ON mentor_notes
  FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ================================
-- MENTOR APPLICATIONS POLICIES
-- ================================

-- Drop existing policies
DROP POLICY IF EXISTS mentorapplications_select_policy ON mentorapplications;
DROP POLICY IF EXISTS mentorapplications_insert_policy ON mentorapplications;
DROP POLICY IF EXISTS mentorapplications_update_policy ON mentorapplications;

-- Users can view their own applications
CREATE POLICY mentorapplications_own_select ON mentorapplications
  FOR SELECT TO authenticated
  USING (email = auth.email());

-- Users can insert their own application (prevent duplicates with unique constraint)
CREATE POLICY mentorapplications_own_insert ON mentorapplications
  FOR INSERT TO authenticated
  WITH CHECK (email = auth.email());

-- Users can update their own pending applications
CREATE POLICY mentorapplications_own_update ON mentorapplications
  FOR UPDATE TO authenticated
  USING (email = auth.email() AND status = 'pending')
  WITH CHECK (email = auth.email() AND status = 'pending');

-- Admins can view and update all applications
CREATE POLICY mentorapplications_admin_all ON mentorapplications
  FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ================================
-- ADMIN TABLE POLICIES
-- ================================

-- Drop existing policies
DROP POLICY IF EXISTS admin_select_policy ON admin;
DROP POLICY IF EXISTS admin_insert_policy ON admin;

-- Only admins can view admin table
CREATE POLICY admin_admin_only ON admin
  FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ================================
-- MENTOR MEETINGS POLICIES
-- ================================

-- Mentors can manage meetings with their assigned students
CREATE POLICY mentor_meetings_mentor_manage ON mentor_meetings
  FOR ALL TO authenticated
  USING (
    mentor_id = auth.uid() AND
    auth.is_mentor()
  )
  WITH CHECK (
    mentor_id = auth.uid() AND
    auth.is_mentor() AND
    EXISTS (
      SELECT 1 FROM mentor_student ms
      WHERE ms.mentor_id = auth.uid() AND ms.student_id = mentor_meetings.student_id
    )
  );

-- Students can view meetings scheduled for them
CREATE POLICY mentor_meetings_student_view ON mentor_meetings
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());

-- Admins can view all meetings
CREATE POLICY mentor_meetings_admin_all ON mentor_meetings
  FOR ALL TO authenticated
  USING (auth.is_admin())
  WITH CHECK (auth.is_admin());

-- ================================
-- STUDENT OUTCOMES POLICIES
-- ================================

-- Enable RLS on student outcomes if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_outcomes') THEN
    ALTER TABLE student_outcomes ENABLE ROW LEVEL SECURITY;
    
    -- Students can view their own outcomes
    CREATE POLICY student_outcomes_own_view ON student_outcomes
      FOR SELECT TO authenticated
      USING (student_id = auth.uid());
    
    -- Mentors can view outcomes for their assigned students
    CREATE POLICY student_outcomes_mentor_view ON student_outcomes
      FOR SELECT TO authenticated
      USING (
        auth.is_mentor() AND
        EXISTS (
          SELECT 1 FROM mentor_student ms
          WHERE ms.mentor_id = auth.uid() AND ms.student_id = student_outcomes.student_id
        )
      );
    
    -- Admins can manage all outcomes
    CREATE POLICY student_outcomes_admin_all ON student_outcomes
      FOR ALL TO authenticated
      USING (auth.is_admin())
      WITH CHECK (auth.is_admin());
  END IF;
END
$$;

-- ================================
-- STORAGE BUCKET POLICIES
-- ================================

-- Create secure storage policies for file uploads
-- Note: These should be applied in Supabase dashboard for storage buckets

-- For profile images bucket:
-- Allow authenticated users to upload their own profile images
-- Restrict file types to images only
-- Limit file size to 2MB

-- For resume bucket:
-- Allow authenticated users to upload their own resumes
-- Restrict to PDF files only
-- Limit file size to 5MB

-- ================================
-- AUDIT AND MONITORING
-- ================================

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY audit_log_admin_only ON audit_log
  FOR SELECT TO authenticated
  USING (auth.is_admin());

-- Create function to log data changes
CREATE OR REPLACE FUNCTION log_data_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
CREATE TRIGGER profiles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_data_change();

CREATE TRIGGER mentor_notes_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON mentor_notes
  FOR EACH ROW EXECUTE FUNCTION log_data_change();

-- ================================
-- SECURITY INDEXES FOR PERFORMANCE
-- ================================

-- Indexes for faster RLS policy evaluation
CREATE INDEX IF NOT EXISTS idx_profiles_auth_uid ON profiles(id) WHERE id = auth.uid();
CREATE INDEX IF NOT EXISTS idx_mentor_notes_mentor_student ON mentor_notes(mentor_id, student_id);
CREATE INDEX IF NOT EXISTS idx_mentorapplications_email_status ON mentorapplications(email, status);
CREATE INDEX IF NOT EXISTS idx_admin_email ON admin(email);

-- ================================
-- RATE LIMITING SETUP
-- ================================

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, action, window_start)
);

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_uuid UUID,
  action_name TEXT,
  max_attempts INTEGER DEFAULT 10,
  window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  window_start := date_trunc('hour', NOW()) + 
                  (EXTRACT(MINUTE FROM NOW())::INTEGER / window_minutes) * 
                  INTERVAL '1 minute' * window_minutes;
  
  SELECT count INTO current_count
  FROM rate_limits
  WHERE user_id = user_uuid
    AND action = action_name
    AND window_start = window_start;
  
  IF current_count IS NULL THEN
    INSERT INTO rate_limits (user_id, action, window_start)
    VALUES (user_uuid, action_name, window_start);
    RETURN TRUE;
  ELSIF current_count < max_attempts THEN
    UPDATE rate_limits
    SET count = count + 1
    WHERE user_id = user_uuid
      AND action = action_name
      AND window_start = window_start;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- DATA RETENTION POLICIES
-- ================================

-- Clean up old audit logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_log
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Set up cron jobs in Supabase to run these cleanup functions daily

COMMENT ON FILE IS 'WatanHub Improved RLS Policies - Implements security-first database access control with comprehensive audit logging and rate limiting.'; 