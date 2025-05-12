# Database Migration for WatanHub

## What's Changing

We're moving from a single `profiles` table to a role-based system with:

- `users` table - Central user management with role field
- `students` table - Student-specific data with sequential IDs
- `mentors` table - Mentor-specific data
- Views for backward compatibility

## Benefits

1. **Cleaner Data Structure**: Clear separation of user types
2. **Sequential Student IDs**: Students now have a human-readable ID (1, 2, 3...)
3. **Better Role Management**: Easier to check and manage user roles
4. **Simpler Frontend Code**: Helper functions for role-specific operations
5. **Data Integrity**: Proper foreign key constraints between tables

## How to Use the New System

### 1. Import the New UserRoles Utilities

```javascript
import { 
  ROLES, 
  getUserRole, 
  getStudentProfile, 
  getMentorProfile,
  getMentorStudents,
  getStudentMentor
} from '../lib/UserRoles';
```

### 2. Use the `useAuth` Hook for Role Information

```javascript
import { useAuth } from '../lib/AuthContext';

function MyComponent() {
  const { user, isAdmin, isMentor, isStudent, userRole, profile } = useAuth();
  
  // Now you can use role information directly
  if (isAdmin) {
    // Admin-specific code
  } else if (isMentor) {
    // Mentor-specific code
  } else if (isStudent) {
    // Student-specific code
  }
  
  return (
    <div>
      <h1>Hello, {profile?.first_name}</h1>
      <p>Your role is: {userRole}</p>
    </div>
  );
}
```

### 3. Use Helper Functions for Database Operations

```javascript
// Assigning a student to a mentor
const handleAssign = async () => {
  await assignStudentToMentor(mentorId, studentId);
};

// Unassigning a student
const handleUnassign = async () => {
  await unassignStudent(mentorId, studentId);
};

// Getting a student's mentor
const fetchMentor = async () => {
  const mentor = await getStudentMentor(studentId);
  setMentor(mentor);
};
```

## When Working with Database Tables Directly

If you need to bypass the helper functions and work with the database directly:

- Use `student_profiles` view instead of filtering the old `profiles` table
- Use `mentor_profiles` view for mentor data
- Foreign keys now use IDs from `students` and `mentors` tables, not from `auth.users`

## Need Help?

If you encounter any issues or have questions about the new schema, check:

1. `client/src/update_database_schema.md` for technical details
2. `client/src/lib/UserRoles.js` for the available helper functions
3. `client/src/db/user_role_migration.sql` for the database structure

Or ask the development team for assistance! 