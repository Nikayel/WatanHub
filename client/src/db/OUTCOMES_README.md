# Student Outcomes Tracking System

This module adds comprehensive tracking of student outcomes to the WatanHub platform.

## Features

- **College Admissions**: Track which schools students are admitted to, along with details like major, admission type, location, etc.
- **Scholarships**: Record scholarship awards with amounts, providers, and requirements
- **Employment**: Track internships and jobs that students obtain

## Setup Instructions

1. **Create the database tables**:
   ```bash
   cd client/src/db
   node run_outcomes_tables.js
   ```

2. **Verify the tables were created** by checking your Supabase dashboard under "Table Editor".

3. **Test the functionality** by using the "Student Outcomes" tab in the mentor dashboard.

## Usage Guide

### Mentor Dashboard

Mentors can access the outcomes tracking system through the "Student Outcomes" tab in their dashboard. From there, they can:

1. View a summary of all outcomes for a selected student
2. Add new outcomes by clicking the "Add New" button
3. Edit existing outcomes by clicking the "Edit" button on any outcome card
4. Use the quick outcome toggles to mark major milestones

### Data Types

#### College Admissions
- College/University name
- Major/program
- Application and admission dates
- Admission type (regular, early decision, etc.)
- STEM designation
- Location
- College rank

#### Scholarships
- Scholarship name
- Provider
- Amount and currency
- Award date
- Duration and renewability
- Requirements

#### Employment
- Company/organization
- Position title
- Employment type (internship, part-time, full-time)
- Dates
- Salary information
- Location

## Data Usage

This data will be valuable for:

1. **Student progress tracking**: Monitor the success of mentorship over time
2. **Program evaluation**: Generate metrics about college admission rates, scholarship funding obtained, etc.
3. **Demographic analysis**: Understand patterns in outcomes based on student backgrounds

## Troubleshooting

If you encounter issues with the outcomes tracking system:

1. Check browser console for JavaScript errors
2. Verify that all tables exist in the database
3. Ensure proper RLS policies are in place
4. Check user permissions (must be authenticated mentor or admin)

For persistent issues, run the setup script again or contact support. 