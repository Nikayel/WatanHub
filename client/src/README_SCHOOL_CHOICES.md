# School Choices Feature

This document describes the implementation of the school choices feature in WatanHub, which allows students to manage their college preferences and mentors to view these preferences.

## Overview

The school choices feature enables students to:
- Add up to 5 target schools
- Add up to 5 safety schools
- Add 1 stretch school (dream school)
- Track application status for each school
- Add notes about each school

Mentors can view their students' school choices to provide better guidance during the college application process.

## Database Schema

The feature uses a `student_school_choices` table with the following structure:

```sql
CREATE TABLE IF NOT EXISTS student_school_choices (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id INTEGER,
  major_id INTEGER,
  school_name TEXT NOT NULL,
  major_name TEXT NOT NULL,
  preference_type TEXT CHECK (preference_type IN ('target', 'safety', 'stretch')),
  notes TEXT,
  application_status TEXT DEFAULT 'planning' CHECK (application_status IN ('planning', 'applied', 'accepted', 'rejected', 'waitlisted', 'deferred', 'enrolled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security

Row Level Security policies ensure that:
1. Students can only view and edit their own school choices
2. Mentors can view (but not edit) their assigned students' school choices
3. Admins can manage all school choices

## User Interface

### Student Dashboard
- Students access the school choices through a dedicated "Schools" tab in their dashboard
- The interface shows tabs for Target, Safety, and Stretch schools
- Each school type has a clear description and limit indicator
- Students can add, edit, and delete schools, as well as update application statuses

### Mentor Dashboard
- Mentors can view their students' school choices in the "School Choices" section of the Outcomes tab
- The interface is read-only for mentors
- Mentors can see all the same information that students enter

## Implementation Details

### Components
- `SchoolChoiceManager.jsx`: The main component for managing school choices
- Dashboard integration in both student and mentor interfaces

### Application Status Tracking
Students can track the status of each application:
- Planning to Apply
- Applied
- Accepted
- Rejected
- Waitlisted
- Deferred
- Enrolled

### Mobile Responsiveness
The interface is fully responsive and works well on both desktop and mobile devices.

## Future Enhancements

Potential future improvements:
- School search/autocomplete functionality
- Integration with college databases for more detailed information
- Timeline visualization for application deadlines
- Document upload for application materials
- Email notifications for status updates 