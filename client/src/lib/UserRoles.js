import { supabase } from './supabase';

/**
 * User role types
 */
export const ROLES = {
    STUDENT: 'student',
    MENTOR: 'mentor',
    ADMIN: 'admin'
};

/**
 * Verify that the database schema is correctly set up
 * @returns {Promise<Object>} Status information about the schema
 */
export const verifyDatabaseSchema = async () => {
    try {
        // Check profiles table
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, is_admin')
            .limit(5);

        return {
            profilesTable: {
                exists: !profilesError,
                error: profilesError?.message || null,
                count: profiles?.length || 0,
                sample: profiles || []
            }
        };
    } catch (error) {
        console.error('Error in verifyDatabaseSchema:', error);
        return {
            error: error.message,
            profilesTable: { exists: false }
        };
    }
};

/**
 * Get user role from the profiles table
 * @param {string} userId - The user ID to check
 * @returns {Promise<string|null>} - Returns the role or null if not found
 */
export const getUserRole = async (userId) => {
    try {
        if (!userId) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user role:', error);
            return null;
        }

        // Return role based on is_admin flag
        return data?.is_admin ? 'admin' : 'student';
    } catch (error) {
        console.error('Error in getUserRole:', error);
        return null;
    }
};

/**
 * Get student profile by user ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} - Returns the student profile or null
 */
export const getStudentProfile = async (userId) => {
    try {
        if (!userId) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching student profile:', error);
            return null;
        }

        return data || null;
    } catch (error) {
        console.error('Error in getStudentProfile:', error);
        return null;
    }
};

/**
 * Get mentor profile by user ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} - Returns the mentor profile or null
 */
export const getMentorProfile = async (userId) => {
    try {
        if (!userId) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching mentor profile:', error);
            return null;
        }

        return data || null;
    } catch (error) {
        console.error('Error in getMentorProfile:', error);
        return null;
    }
};

/**
 * Create or update a user role
 * @param {string} userId - The user ID
 * @param {string} email - The user's email
 * @param {string} role - The role to set (from ROLES enum)
 * @returns {Promise<boolean>} - Success or failure
 */
export const setUserRole = async (userId, email, role) => {
    try {
        if (!userId || !email || !role) return false;

        const { error } = await supabase
            .from('users')
            .upsert({
                id: userId,
                email,
                role,
                active: true
            });

        if (error) {
            console.error('Error setting user role:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in setUserRole:', error);
        return false;
    }
};

/**
 * Get students assigned to a mentor
 * @param {string} mentorId - The mentor's ID
 * @returns {Promise<Array|null>} - Returns array of student profiles or null
 */
export const getMentorStudents = async (mentorId) => {
    try {
        if (!mentorId) return null;

        // Using the single profiles table
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_assigned', true)
            .eq('mentor_id', mentorId);

        if (error) {
            console.error('Error fetching mentor students:', error);
            return null;
        }

        return data || [];
    } catch (error) {
        console.error('Error in getMentorStudents:', error);
        return null;
    }
};

/**
 * Get a student's mentor
 * @param {string} studentId - The student's ID
 * @returns {Promise<Object|null>} - Returns the mentor profile or null
 */
export const getStudentMentor = async (studentId) => {
    try {
        if (!studentId) return null;

        // First get the student to find mentor_id
        const { data: student, error: studentError } = await supabase
            .from('profiles')
            .select('mentor_id')
            .eq('id', studentId)
            .single();

        if (studentError || !student || !student.mentor_id) {
            return null;
        }

        // Now get the mentor
        const { data: mentor, error: mentorError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', student.mentor_id)
            .single();

        if (mentorError) {
            console.error('Error fetching student mentor:', mentorError);
            return null;
        }

        return mentor || null;
    } catch (error) {
        console.error('Error in getStudentMentor:', error);
        return null;
    }
};

/**
 * Assign a student to a mentor
 * @param {string} mentorId - The mentor's ID (from mentors table)
 * @param {string} studentId - The student's ID (from students table)
 * @returns {Promise<boolean>} - Success or failure
 */
export const assignStudentToMentor = async (mentorId, studentId) => {
    try {
        if (!mentorId || !studentId) return false;

        // Begin a transaction
        const { error: insertError } = await supabase
            .from('mentor_student')
            .insert({
                mentor_id: mentorId,
                student_id: studentId
            });

        if (insertError) {
            console.error('Error assigning student to mentor:', insertError);
            return false;
        }

        // Update the student's is_assigned status
        const { error: updateError } = await supabase
            .from('students')
            .update({ is_assigned: true })
            .eq('id', studentId);

        if (updateError) {
            console.error('Error updating student assignment status:', updateError);
            // We don't return false here since the assignment was still created
        }

        return true;
    } catch (error) {
        console.error('Error in assignStudentToMentor:', error);
        return false;
    }
};

/**
 * Unassign a student from their mentor
 * @param {string} mentorId - The mentor's ID
 * @param {string} studentId - The student's ID
 * @returns {Promise<boolean>} - Success or failure
 */
export const unassignStudent = async (mentorId, studentId) => {
    try {
        if (!mentorId || !studentId) return false;

        // Begin transaction
        const { error: deleteError } = await supabase
            .from('mentor_student')
            .delete()
            .eq('mentor_id', mentorId)
            .eq('student_id', studentId);

        if (deleteError) {
            console.error('Error unassigning student:', deleteError);
            return false;
        }

        // Update the student's is_assigned status
        const { error: updateError } = await supabase
            .from('students')
            .update({ is_assigned: false })
            .eq('id', studentId);

        if (updateError) {
            console.error('Error updating student assignment status:', updateError);
            // We don't return false here since the unassignment was still completed
        }

        return true;
    } catch (error) {
        console.error('Error in unassignStudent:', error);
        return false;
    }
}; 