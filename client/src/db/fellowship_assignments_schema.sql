-- Fellowship Assignments Schema
-- This table stores educational content assigned by mentors to students

-- Create fellowship_assignments table
CREATE TABLE IF NOT EXISTS fellowship_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Assignment Details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content_source TEXT NOT NULL, -- e.g., 'Khan Academy', 'University of the People', 'edX'
    content_type TEXT DEFAULT 'course', -- 'course', 'video', 'article', 'exercise'
    
    -- External Integration
    external_url TEXT, -- Direct link to the educational content
    api_source TEXT, -- Which API this content comes from
    external_content_id TEXT, -- ID in the external system
    
    -- Content Details (JSON format for flexibility)
    content_details JSONB, -- Course modules, duration, requirements, etc.
    
    -- Assignment Status
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Certificate Information
    certificate_available BOOLEAN DEFAULT FALSE,
    certificate_info JSONB, -- Certificate details, download links, etc.
    
    -- Progress Tracking
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    time_spent_minutes INTEGER DEFAULT 0,
    
    -- Mentor Notes
    mentor_notes TEXT,
    student_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create educational_platforms table to store API configurations
CREATE TABLE IF NOT EXISTS educational_platforms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    platform_name TEXT UNIQUE NOT NULL, -- 'Khan Academy', 'University of the People', etc.
    platform_slug TEXT UNIQUE NOT NULL, -- 'khan_academy', 'uopeople', etc.
    
    -- API Configuration
    api_endpoint TEXT,
    api_key_required BOOLEAN DEFAULT FALSE,
    api_documentation_url TEXT,
    
    -- Platform Details
    description TEXT,
    website_url TEXT,
    certificate_type TEXT, -- 'Completion Certificate', 'University Degree', etc.
    
    -- Integration Status
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'development', 'testing', 'active', 'inactive')),
    integration_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fellowship_progress_logs table for detailed tracking
CREATE TABLE IF NOT EXISTS fellowship_progress_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES fellowship_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Progress Details
    action_type TEXT NOT NULL, -- 'started', 'progress_update', 'completed', 'paused', 'resumed'
    progress_before INTEGER DEFAULT 0,
    progress_after INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    
    -- Optional Notes
    notes TEXT,
    
    -- Metadata
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial educational platforms
INSERT INTO educational_platforms (platform_name, platform_slug, description, website_url, certificate_type, status) VALUES
('Khan Academy', 'khan_academy', 'Math, Science, Programming, and Test Prep', 'https://www.khanacademy.org/', 'Completion Certificate', 'planning'),
('University of the People', 'uopeople', 'Accredited University Courses - Business, CS, Health Science', 'https://www.uopeople.edu/', 'University Certificate/Degree', 'planning'),
('edX (MIT/Harvard)', 'edx', 'University-level courses with verified certificates', 'https://www.edx.org/', 'Verified Certificate', 'planning'),
('freeCodeCamp', 'freecodecamp', 'Programming and Web Development Certifications', 'https://www.freecodecamp.org/', 'Programming Certificate', 'planning'),
('Google Digital Garage', 'google_digital', 'Digital Marketing and Business Skills', 'https://learndigital.withgoogle.com/', 'Google Certificate', 'planning'),
('Microsoft Learn', 'microsoft_learn', 'Azure, Office 365, and Microsoft Technologies', 'https://docs.microsoft.com/learn/', 'Microsoft Certification', 'planning'),
('Coursera', 'coursera', 'University and industry courses with certificates', 'https://www.coursera.org/', 'Course Certificate', 'planning'),
('LinkedIn Learning', 'linkedin_learning', 'Professional development and business skills', 'https://www.linkedin.com/learning/', 'LinkedIn Certificate', 'planning')
ON CONFLICT (platform_slug) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_fellowship_assignments_student_id ON fellowship_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_fellowship_assignments_mentor_id ON fellowship_assignments(mentor_id);
CREATE INDEX IF NOT EXISTS idx_fellowship_assignments_status ON fellowship_assignments(status);
CREATE INDEX IF NOT EXISTS idx_fellowship_assignments_assigned_at ON fellowship_assignments(assigned_at);
CREATE INDEX IF NOT EXISTS idx_fellowship_progress_logs_assignment_id ON fellowship_progress_logs(assignment_id);
CREATE INDEX IF NOT EXISTS idx_fellowship_progress_logs_student_id ON fellowship_progress_logs(student_id);

-- Create RLS policies
ALTER TABLE fellowship_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE fellowship_progress_logs ENABLE ROW LEVEL SECURITY;

-- Fellowship assignments policies
CREATE POLICY "Users can view their own assignments" ON fellowship_assignments
    FOR SELECT USING (
        student_id = auth.uid() OR 
        mentor_id = auth.uid()
    );

CREATE POLICY "Mentors can insert assignments for their students" ON fellowship_assignments
    FOR INSERT WITH CHECK (
        mentor_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM mentor_student_relationships 
            WHERE mentor_id = auth.uid() 
            AND student_id = fellowship_assignments.student_id 
            AND status = 'active'
        )
    );

CREATE POLICY "Mentors and students can update their assignments" ON fellowship_assignments
    FOR UPDATE USING (
        student_id = auth.uid() OR 
        mentor_id = auth.uid()
    );

-- Educational platforms policies (public read)
CREATE POLICY "Educational platforms are publicly readable" ON educational_platforms
    FOR SELECT USING (true);

CREATE POLICY "Only admins can modify educational platforms" ON educational_platforms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND user_type IN ('admin', 'super_admin')
        )
    );

-- Progress logs policies
CREATE POLICY "Users can view their own progress logs" ON fellowship_progress_logs
    FOR SELECT USING (
        student_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM fellowship_assignments fa
            WHERE fa.id = fellowship_progress_logs.assignment_id
            AND fa.mentor_id = auth.uid()
        )
    );

CREATE POLICY "Students can insert their own progress logs" ON fellowship_progress_logs
    FOR INSERT WITH CHECK (student_id = auth.uid());

-- Update trigger for fellowship_assignments
CREATE OR REPLACE FUNCTION update_fellowship_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fellowship_assignments_updated_at
    BEFORE UPDATE ON fellowship_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_fellowship_assignments_updated_at();

-- Function to log fellowship progress
CREATE OR REPLACE FUNCTION log_fellowship_progress(
    p_assignment_id UUID,
    p_action_type TEXT,
    p_progress_after INTEGER DEFAULT NULL,
    p_time_spent INTEGER DEFAULT 0,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_student_id UUID;
    v_progress_before INTEGER;
    v_log_id UUID;
BEGIN
    -- Get current assignment details
    SELECT student_id, progress_percentage 
    INTO v_student_id, v_progress_before
    FROM fellowship_assignments 
    WHERE id = p_assignment_id;
    
    -- Insert progress log
    INSERT INTO fellowship_progress_logs (
        assignment_id,
        student_id,
        action_type,
        progress_before,
        progress_after,
        time_spent_minutes,
        notes
    ) VALUES (
        p_assignment_id,
        v_student_id,
        p_action_type,
        v_progress_before,
        COALESCE(p_progress_after, v_progress_before),
        p_time_spent,
        p_notes
    ) RETURNING id INTO v_log_id;
    
    -- Update assignment progress if provided
    IF p_progress_after IS NOT NULL THEN
        UPDATE fellowship_assignments 
        SET 
            progress_percentage = p_progress_after,
            time_spent_minutes = time_spent_minutes + p_time_spent,
            status = CASE 
                WHEN p_progress_after >= 100 THEN 'completed'
                WHEN p_progress_after > 0 AND status = 'active' THEN 'active'
                ELSE status
            END,
            completed_at = CASE 
                WHEN p_progress_after >= 100 THEN NOW()
                ELSE completed_at
            END
        WHERE id = p_assignment_id;
    END IF;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 