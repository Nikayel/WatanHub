# WatanHub Database Schema Migration

This document outlines the steps required to migrate the WatanHub application to a new role-based database schema.

## Overview of Changes

The new schema creates a clear separation between users and their roles (student, mentor, admin) by:

1. Creating a central `users` table with a role field
2. Creating a dedicated `students` table with sequential student IDs
3. Updating the `mentors` table to link to users
4. Maintaining backward compatibility with existing tables 
5. Updating foreign key relationships in `mentor_notes` and `mentor_meetings`

## Migration Steps

### 1. Create the Database Migration Script

Apply the `user_role_migration.sql` script to create the new schema and migrate data:

```bash
# For local development with PostgreSQL
psql -U postgres -d postgres -f client/src/db/user_role_migration.sql

# For Supabase, upload the SQL script to the SQL Editor and run it
```

### 2. Test with a Small Dataset

Before fully deploying, test the migration with a small subset of data to verify:
- User roles are correctly assigned
- Student IDs are sequential
- Foreign keys are properly maintained
- Existing functionality works as expected

### 3. Update Frontend Code

The following files have been updated to work with the new schema:

- **AuthContext.js**: Modified to use the new role-based system
- **UserRoles.js**: New utility file for handling user roles and permissions
- **Navbar.js**: Updated to use the role information from AuthContext

### 4. Code Changes Required

The following components need to be updated to use the new schema:

#### Student Dashboard

```javascript
// Before
const fetchStudentData = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  setProfile(data);
};

// After
import { getStudentProfile } from '../lib/UserRoles';

const fetchStudentData = async () => {
  const profile = await getStudentProfile(user.id);
  setProfile(profile);
};
```

#### Mentor Dashboard

```javascript
// Before
const fetchMentorProfile = async () => {
  const { data } = await supabase
    .from('mentorapplications')
    .select('*')
    .eq('email', user.email)
    .eq('status', 'approved')
    .single();
  setMentorProfile(data);
};

// After
import { getMentorProfile } from '../lib/UserRoles';

const fetchMentorProfile = async () => {
  const profile = await getMentorProfile(user.id);
  setMentorProfile(profile);
};
```

#### Admin Dashboard

```javascript
// Before
const fetchStudents = async () => {
  const { data } = await supabase
    .from('profiles')
    .select('*');
  setStudents(data);
};

// After
const fetchStudents = async () => {
  const { data } = await supabase
    .from('student_profiles')
    .select('*');
  setStudents(data);
};
```

#### Mentor-Student Assignment

```javascript
// Before
const assignStudent = async (mentorId, studentId) => {
  await supabase
    .from('mentor_student')
    .insert({ mentor_id: mentorId, student_id: studentId });
  
  await supabase
    .from('profiles')
    .update({ is_assigned: true })
    .eq('id', studentId);
};

// After
import { assignStudentToMentor } from '../lib/UserRoles';

const assignStudent = async (mentorId, studentId) => {
  await assignStudentToMentor(mentorId, studentId);
};
```

## Rollback Plan

If issues occur during migration, the following rollback plan can be executed:

1. Keep the old tables and relationships intact during migration
2. Add views that maintain the old schema for backward compatibility
3. If rollback is needed, switch back to using the old tables/views

## Post-Migration Tasks

1. Monitor application performance after migration
2. Verify all features are working correctly
3. Update documentation to reflect the new schema
4. Consider creating database indexes for commonly queried fields
5. Add validation to ensure data integrity in the new schema

## Future Improvements

1. Add row-level security (RLS) policies for the new tables
2. Implement more detailed role-based access control (RBAC)
3. Add audit logging for important data changes
4. Consider adding versioning for critical data entities 