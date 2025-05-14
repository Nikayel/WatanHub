-- Add terms_accepted boolean field to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false;

-- Add terms_accepted boolean field to student_profiles view (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'student_profiles'
    ) THEN
        DROP VIEW IF EXISTS student_profiles;
        
        -- Recreate the view with the new column
        CREATE VIEW student_profiles AS
        SELECT 
            p.*,
            u.email,
            u.role,
            u.created_at AS user_created_at,
            s.student_id,
            s.education_level,
            s.english_proficiency
        FROM 
            profiles p
            JOIN users u ON p.id = u.id
            LEFT JOIN students s ON p.id = s.user_id
        WHERE 
            u.role = 'student';
    END IF;
END
$$; 