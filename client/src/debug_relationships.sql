-- Debug script to check mentor-student relationships

-- Check if we have users
SELECT 'Users count' as table_name, count(*) as count FROM users;

-- Check if we have students 
SELECT 'Students count' as table_name, count(*) as count FROM students;

-- Check if we have mentors
SELECT 'Mentors count' as table_name, count(*) as count FROM mentors;

-- Check if we have mentor_student relationships
SELECT 'Mentor-Student relationships' as table_name, count(*) as count FROM mentor_student;

-- Check actual mentor-student data
SELECT 
  'Mentor-Student Details' as info,
  ms.mentor_id,
  ms.student_id,
  m.full_name as mentor_name,
  m.user_id as mentor_user_id,
  s.first_name || ' ' || s.last_name as student_name,
  s.user_id as student_user_id,
  s.student_id as student_number
FROM mentor_student ms
JOIN mentors m ON ms.mentor_id = m.id
JOIN students s ON ms.student_id = s.id
LIMIT 10;

-- Check mentor notes table
SELECT 'Mentor Notes count' as table_name, count(*) as count FROM mentor_notes;

-- Check if mentor notes use user_ids correctly
SELECT 
  'Note Details' as info,
  mn.id,
  mn.mentor_id,
  mn.student_id,
  mn.task,
  mn.acknowledged
FROM mentor_notes mn
LIMIT 5; 