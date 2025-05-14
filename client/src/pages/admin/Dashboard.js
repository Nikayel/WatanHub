import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { safeSelect, safeUpdate, safeInsert } from '../../lib/supabase';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import {
  PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentorApplications, setMentorApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [loadingActionId, setLoadingActionId] = useState(null);
  const [activeTab, setActiveTab] = useState('students');
  const [viewMode, setViewMode] = useState('table'); // table or grid
  const [approvedMentors, setApprovedMentors] = useState([]);
  const [mentorStudents, setMentorStudents] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedMentorForAssignment, setSelectedMentorForAssignment] = useState(null);
  const [assignmentMode, setAssignmentMode] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [confirmUnassign, setConfirmUnassign] = useState(null);
  const [modalStudent, setModalStudent] = useState(null);
  const [mentorSearch, setMentorSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [assignedSearch, setAssignedSearch] = useState('');
  const [demographicData, setDemographicData] = useState({
    age: [],
    gender: [],
    religion: [],
    educationLevel: [],
    englishLevel: [],
    signupTrend: [],
    province: [],
    schoolType: [],
    householdIncome: [],
    parentalEducation: [],
    internetSpeed: []
  });
  const [noteStats, setNoteStats] = useState({
    total: 0,
    acknowledged: 0,
    pending: 0,
    trend: []
  });
  const [studentNotes, setStudentNotes] = useState({});
  const [outcomesStats, setOutcomesStats] = useState({
    collegeAdmissions: { total: 0, stemCount: 0, byMonth: [] },
    scholarships: { total: 0, totalValue: 0, byType: [] },
    employment: { total: 0, byType: [] }
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  // Add state for tracking the real-time channel
  const [noteStatsChannel, setNoteStatsChannel] = useState(null);

  useEffect(() => {
    if (!user) return;

    const checkAdminAndFetch = async () => {
      const adminData = await safeSelect('admin', '*', { email: user.email });
      if (adminData && adminData.length > 0) {
        setIsAdmin(true);
        await fetchStudents();
        await fetchMentorApplications();
        await fetchDemographicData();
        await fetchNoteStats();
        await fetchOutcomesStats(); // Add this line

        // Set up real-time subscriptions for analytics updates
        setupRealtimeSubscriptions();
      } else {
        toast.error('Access denied. Admins only.');
      }
      setLoading(false);
    };

    checkAdminAndFetch();

    return () => {
      // Clean up subscriptions when component unmounts
      if (noteStatsChannel) {
        supabase.removeChannel(noteStatsChannel);
      }
    };
  }, [user]);

  // Function to set up real-time subscriptions
  const setupRealtimeSubscriptions = () => {
    if (!user) return;

    // Subscribe to mentor applications
    const mentorAppChannel = supabase
      .channel('mentor-applications-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentorapplications'
        },
        (payload) => {
          console.log('Mentor application changed:', payload);
          fetchMentorApplications();
        }
      )
      .subscribe();

    // Subscribe to mentor_notes for real-time note statistics 
    const notesStatsChannel = supabase
      .channel('admin-notes-stats')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentor_notes'
        },
        (payload) => {
          console.log('Note change detected, updating admin statistics:', payload);

          // Update note stats based on the type of change
          if (payload.eventType === 'INSERT') {
            setNoteStats(prev => ({
              ...prev,
              total: prev.total + 1,
              pending: prev.pending + 1
            }));
          } else if (payload.eventType === 'DELETE') {
            setNoteStats(prev => ({
              ...prev,
              total: Math.max(0, prev.total - 1),
              // If the deleted note was acknowledged, decrement that too
              acknowledged: payload.old.acknowledged
                ? Math.max(0, prev.acknowledged - 1)
                : prev.acknowledged,
              pending: !payload.old.acknowledged
                ? Math.max(0, prev.pending - 1)
                : prev.pending
            }));
          } else if (payload.eventType === 'UPDATE' &&
            payload.new.acknowledged !== payload.old.acknowledged) {
            if (payload.new.acknowledged) {
              // Note was acknowledged
              setNoteStats(prev => ({
                ...prev,
                acknowledged: prev.acknowledged + 1,
                pending: Math.max(0, prev.pending - 1)
              }));
            } else {
              // Acknowledgment was removed
              setNoteStats(prev => ({
                ...prev,
                acknowledged: Math.max(0, prev.acknowledged - 1),
                pending: prev.pending + 1
              }));
            }
          }

          // Refresh note stats completely every 10 updates to ensure accuracy
          if (Math.random() < 0.1) {
            fetchNoteStats();
          }
        }
      )
      .subscribe();

    // Subscribe to outcome tables for real-time updates
    const collegeAdmissionsChannel = supabase
      .channel('admin-college-admissions')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'college_admissions'
        },
        (payload) => {
          console.log('College admission change detected:', payload);
          // Refresh demographics data to update outcomes statistics
          fetchDemographicData();
          fetchOutcomesStats(); // Add this line
        }
      )
      .subscribe();

    const scholarshipsChannel = supabase
      .channel('admin-scholarships')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scholarship_awards'
        },
        (payload) => {
          console.log('Scholarship change detected:', payload);
          // Refresh demographics data to update outcomes statistics
          fetchDemographicData();
          fetchOutcomesStats(); // Add this line
        }
      )
      .subscribe();

    const employmentChannel = supabase
      .channel('admin-employment')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_employment'
        },
        (payload) => {
          console.log('Employment change detected:', payload);
          fetchOutcomesStats(); // Add this line
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(mentorAppChannel);
      supabase.removeChannel(notesStatsChannel);
      supabase.removeChannel(collegeAdmissionsChannel);
      supabase.removeChannel(scholarshipsChannel);
      supabase.removeChannel(employmentChannel); // Add this line
    };
  };

  const fetchStudents = async () => {
    try {
      const studentsData = await safeSelect('profiles', '*');
      if (studentsData) {
        setStudents(studentsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));

        // Fetch note counts for each student
        const noteCounts = {};
        for (const student of studentsData) {
          const { count, error } = await supabase
            .from('mentor_notes')
            .select('id', { count: 'exact', head: true })
            .eq('student_id', student.id);

          if (!error) {
            noteCounts[student.id] = count || 0;
          }
        }

        setStudentNotes(noteCounts);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  const handleViewAssigned = async (mentor) => {
    try {
      console.log('Viewing assignments for mentor:', mentor);
      setAssignmentMode(true);
      setSelectedMentorForAssignment(mentor);

      if (!mentor.user_id) {
        console.error('Error: mentor.user_id is undefined or null', mentor);
        toast.error('Error: Cannot find mentor ID');
        return;
      }

      console.log('Fetching students assigned to mentor_id:', mentor.user_id);
      const { data, error } = await supabase
        .from('mentor_student')
        .select('profiles(*)')
        .eq('mentor_id', mentor.user_id);

      if (error) {
        console.error('Error fetching mentor students:', error);
        toast.error('Failed to load assigned students');
        return;
      }

      console.log('Assigned students data:', data);

      if (!data || data.length === 0) {
        console.log('No students assigned to this mentor');
        setMentorStudents([]);
        return;
      }

      // Extract the nested profiles data
      const assignedStudents = data.map(item => item.profiles);
      console.log('Processed assigned students:', assignedStudents);
      setMentorStudents(assignedStudents);
    } catch (error) {
      console.error('Error in handleViewAssigned:', error);
      toast.error('An error occurred while loading assignments');
    }
  };

  const fetchMentorApplications = async () => {
    await fetchApprovedMentors();
    const applications = await safeSelect('mentorapplications', '*', { status: 'pending' });
    if (applications) {
      setMentorApplications(applications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }
  };
  const fetchApprovedMentors = async () => {
    try {
      console.log('Fetching approved mentors');
      const { data, error } = await supabase
        .from('mentorapplications')
        .select('*')
        .eq('status', 'approved');

      if (error) {
        console.error('Error fetching approved mentors:', error);
        throw error;
      }

      console.log(`Found ${data?.length || 0} approved mentors`);
      setApprovedMentors(data || []);
    } catch (error) {
      console.error('Error in fetchApprovedMentors:', error.message);
      toast.error('Failed to load approved mentors');
    }
  };

  const fetchDemographicData = async () => {
    try {
      // Get all students for demographic analysis
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('*');

      if (studentsError) throw studentsError;

      if (!studentsData || studentsData.length === 0) {
        console.log('No student data available for demographics');
        return;
      }

      // Process age data
      const ageData = studentsData.reduce((acc, student) => {
        if (student.date_of_birth) {
          const birthDate = new Date(student.date_of_birth);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          // Create age ranges
          const ageRange = Math.floor(age / 5) * 5;
          const label = `${ageRange}-${ageRange + 4}`;
          const existing = acc.find(item => item.name === label);
          if (existing) {
            existing.value += 1;
          } else {
            acc.push({ name: label, value: 1 });
          }
        }
        return acc;
      }, []);

      // Process gender data
      const genderData = processFieldData(studentsData, 'gender');

      // Process religion data
      const religionData = processFieldData(studentsData, 'religion');

      // Process education level data
      const educationLevelData = processFieldData(studentsData, 'education_level');

      // Process English level data
      const englishLevelData = processFieldData(studentsData, 'english_level');

      // NEW: Process province data
      const provinceData = processFieldData(studentsData, 'province');

      // NEW: Process school type data
      const schoolTypeData = processFieldData(studentsData, 'school_type');

      // NEW: Process household income data
      const incomeData = processFieldData(studentsData, 'household_income_band');

      // NEW: Process parental education data
      const parentalEducationData = processFieldData(studentsData, 'parental_education');

      // NEW: Process internet speed data
      const internetSpeedData = processFieldData(studentsData, 'internet_speed');

      // Process signup trend (by month)
      const signupsByMonth = studentsData.reduce((acc, student) => {
        if (student.created_at) {
          const date = new Date(student.created_at);
          const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
          const existing = acc.find(item => item.name === monthYear);
          if (existing) {
            existing.value += 1;
          } else {
            acc.push({ name: monthYear, value: 1, date: date });
          }
        }
        return acc;
      }, []);

      // Sort by date
      const sortedSignups = signupsByMonth.sort((a, b) => a.date - b.date)
        .map(item => {
          const { date, ...rest } = item;
          return rest;
        });

      setDemographicData({
        age: ageData.sort((a, b) => parseInt(a.name) - parseInt(b.name)),
        gender: genderData,
        religion: religionData,
        educationLevel: educationLevelData,
        englishLevel: englishLevelData,
        signupTrend: sortedSignups,
        // New demographic data
        province: provinceData,
        schoolType: schoolTypeData,
        householdIncome: incomeData,
        parentalEducation: parentalEducationData,
        internetSpeed: internetSpeedData
      });

    } catch (error) {
      console.error('Error fetching demographic data:', error);
      toast.error('Failed to fetch demographic data');
    }
  };

  // Helper function to process field data for charts
  const processFieldData = (data, field) => {
    return data.reduce((acc, item) => {
      if (item[field]) {
        const value = item[field].toString();
        const existing = acc.find(entry => entry.name === value);
        if (existing) {
          existing.value += 1;
        } else {
          acc.push({ name: value, value: 1 });
        }
      }
      return acc;
    }, []);
  };

  const fetchNoteStats = async () => {
    try {
      console.log('Fetching note statistics for admin dashboard');

      // Get total notes count
      const { data: totalData, error: totalError } = await supabase
        .from('mentor_notes')
        .select('count');

      if (totalError) {
        console.error('Error fetching total notes count:', totalError);
        throw totalError;
      }

      // Get acknowledged notes count
      const { data: ackData, error: ackError } = await supabase
        .from('mentor_notes')
        .select('count')
        .eq('acknowledged', true);

      if (ackError) {
        console.error('Error fetching acknowledged notes count:', ackError);
        throw ackError;
      }

      // Get breakdown of acknowledged notes by month
      const { data: timeData, error: timeError } = await supabase
        .from('mentor_notes')
        .select('acknowledged, created_at');

      if (timeError) {
        console.error('Error fetching time-based notes data:', timeError);
        throw timeError;
      }

      // Process acknowledgment over time
      const acknowledgmentByMonth = {};
      const pendingByMonth = {};

      timeData.forEach(note => {
        if (!note.created_at) return;

        const date = new Date(note.created_at);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        // Initialize if first of this month
        if (!acknowledgmentByMonth[monthYear]) {
          acknowledgmentByMonth[monthYear] = 0;
          pendingByMonth[monthYear] = 0;
        }

        // Count acknowledged and pending separately
        if (note.acknowledged) {
          acknowledgmentByMonth[monthYear] += 1;
        } else {
          pendingByMonth[monthYear] += 1;
        }
      });

      // Convert to array format for charts
      const acknowledgedTrend = [];

      Object.keys(acknowledgmentByMonth).sort().forEach(key => {
        const [year, month] = key.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });
        acknowledgedTrend.push({
          name: `${monthName} ${year}`,
          acknowledged: acknowledgmentByMonth[key],
          pending: pendingByMonth[key]
        });
      });

      // Calculate statistics
      const total = totalData[0]?.count || 0;
      const acknowledged = ackData[0]?.count || 0;

      const newNoteStats = {
        total,
        acknowledged,
        pending: total - acknowledged,
        trend: acknowledgedTrend
      };

      console.log('Updated note statistics:', newNoteStats);
      setNoteStats(newNoteStats);

    } catch (error) {
      console.error('Error fetching note stats:', error.message);
      toast.error('Failed to update statistics');
    }
  };

  // Function to fetch outcomes statistics
  const fetchOutcomesStats = async () => {
    try {
      console.log('Fetching outcomes statistics');

      // Fetch college admissions data
      const { data: admissionsData, error: admissionsError } = await supabase
        .from('college_admissions')
        .select('*');

      if (admissionsError) {
        console.error('Error fetching college admissions:', admissionsError);
        throw admissionsError;
      }

      // Fetch scholarships data
      const { data: scholarshipsData, error: scholarshipsError } = await supabase
        .from('scholarship_awards')
        .select('*');

      if (scholarshipsError) {
        console.error('Error fetching scholarships:', scholarshipsError);
        throw scholarshipsError;
      }

      // Fetch employment data
      const { data: employmentData, error: employmentError } = await supabase
        .from('student_employment')
        .select('*');

      if (employmentError) {
        console.error('Error fetching employment data:', employmentError);
        throw employmentError;
      }

      // Process college admissions stats
      const stemCount = admissionsData?.filter(a => a.is_stem).length || 0;

      // Process admissions by month
      const admissionsByMonth = {};
      admissionsData?.forEach(admission => {
        if (admission.admission_date) {
          const date = new Date(admission.admission_date);
          const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

          if (!admissionsByMonth[monthYear]) {
            admissionsByMonth[monthYear] = { all: 0, stem: 0 };
          }

          admissionsByMonth[monthYear].all += 1;
          if (admission.is_stem) {
            admissionsByMonth[monthYear].stem += 1;
          }
        }
      });

      // Convert to array for charts
      const admissionsTrend = Object.keys(admissionsByMonth).sort().map(key => ({
        name: key,
        all: admissionsByMonth[key].all,
        stem: admissionsByMonth[key].stem
      }));

      // Process scholarships stats
      const totalScholarshipValue = scholarshipsData?.reduce((sum, scholarship) => {
        return sum + (parseFloat(scholarship.amount) || 0);
      }, 0);

      // Group scholarships by type
      const scholarshipsByType = {};
      scholarshipsData?.forEach(scholarship => {
        const type = scholarship.scholarship_type || 'Unspecified';

        if (!scholarshipsByType[type]) {
          scholarshipsByType[type] = { count: 0, value: 0 };
        }

        scholarshipsByType[type].count += 1;
        scholarshipsByType[type].value += parseFloat(scholarship.amount) || 0;
      });

      // Convert to array for charts
      const scholarshipsByTypeArray = Object.keys(scholarshipsByType).map(key => ({
        name: key,
        count: scholarshipsByType[key].count,
        value: scholarshipsByType[key].value
      }));

      // Process employment data
      const employmentByType = {};
      employmentData?.forEach(job => {
        const type = job.employment_type || 'Unspecified';

        if (!employmentByType[type]) {
          employmentByType[type] = 0;
        }

        employmentByType[type] += 1;
      });

      // Convert to array for charts
      const employmentByTypeArray = Object.keys(employmentByType).map(key => ({
        name: key,
        value: employmentByType[key]
      }));

      setOutcomesStats({
        collegeAdmissions: {
          total: admissionsData?.length || 0,
          stemCount,
          byMonth: admissionsTrend
        },
        scholarships: {
          total: scholarshipsData?.length || 0,
          totalValue: totalScholarshipValue,
          byType: scholarshipsByTypeArray
        },
        employment: {
          total: employmentData?.length || 0,
          byType: employmentByTypeArray
        }
      });

      console.log('Outcomes statistics fetched successfully');
    } catch (error) {
      console.error('Error fetching outcomes statistics:', error);
      toast.error('Failed to load outcomes statistics');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    const sanitized = {
      ...editingStudent,
      first_name: editingStudent.first_name?.trim(),
      last_name: editingStudent.last_name?.trim(),
      email: editingStudent.email?.toLowerCase().trim(),
      bio: editingStudent.bio?.trim() || null,
      interests: editingStudent.interests?.trim() || null,
    };
    const result = await safeUpdate('profiles', sanitized, 'id', sanitized.id);
    if (result) {
      toast.success('Student updated successfully!');
      await fetchStudents();
      setEditingStudent(null);
    }
  };

  const handleCopy = (student) => {
    const info = `
Name: ${student.first_name} ${student.last_name}
Email: ${student.email}
Education: ${student.education_level || 'N/A'}
English: ${student.english_level || 'N/A'}
Interests: ${student.interests || 'N/A'}
TOEFL Score: ${student.toefl_score || 'N/A'}
Bio: ${student.bio || 'N/A'}
    `;
    navigator.clipboard.writeText(info.trim());
    toast.success('Student info copied to clipboard!');
  };

  const handleApproveMentor = async (application) => {
    setMentorApplications(prev =>
      prev.map(app =>
        app.id === application.id ? { ...app, status: 'approved' } : app
      )
    );
    setLoadingActionId(application.id);

    try {
      console.log('Approving mentor application:', application);

      // 1. Insert into mentors table with user_id from application
      const insertResult = await safeInsert('mentors', {
        user_id: application.user_id,
        full_name: application.full_name,
        languages: application.languages,
        bio: application.bio,
        email: application.email,
      });

      if (insertResult) {
        // 2. Update status in mentorApplications table
        await safeUpdate('mentorapplications', { status: 'approved' }, 'id', application.id);
        toast.success(`${application.full_name} approved as mentor!`);

        // 3. Send email notification
        try {
          await fetch('/api/email/mentor-approved', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: application.email,
              fullName: application.full_name
            }),
          });
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
        }

        // 4. Refresh data
        await fetchMentorApplications();
        await fetchApprovedMentors();
      }
    } catch (error) {
      // Revert if there's an error
      setMentorApplications(prev =>
        prev.map(app =>
          app.id === application.id ? { ...app, status: 'pending' } : app
        )
      );
      console.error('Error approving mentor:', error);
      toast.error('Failed to approve mentor: ' + error.message);
    } finally {
      setLoadingActionId(null);
    }
  };
  const handleAssignStudent = async (mentorId, studentId) => {
    try {
      console.log('Assigning student to mentor:', { mentorId, studentId });

      if (!mentorId || !studentId) {
        toast.error('Missing mentor or student information');
        console.error('Invalid parameters:', { mentorId, studentId });
        return;
      }

      // First check if assignment already exists to avoid duplicate entries
      const { data: existingAssignment, error: checkError } = await supabase
        .from('mentor_student')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('student_id', studentId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing assignment:', checkError);
        toast.error('Failed to verify assignment status');
        return;
      }

      if (existingAssignment) {
        console.log('Student already assigned to this mentor', existingAssignment);
        toast.info('Student is already assigned to this mentor');
        return;
      }

      // Create the assignment
      const { data, error } = await supabase
        .from('mentor_student')
        .insert([{ mentor_id: mentorId, student_id: studentId }])
        .select();

      if (error) {
        console.error('Assignment failed - detailed error:', error);
        toast.error('Assignment failed: ' + error.message);
        return;
      }

      console.log('Assignment successful:', data);

      // Update the student's assigned status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ is_assigned: true })
        .eq('id', studentId);

      if (updateError) {
        console.error('Failed to update student assignment status:', updateError);
        toast.warning('Assignment created but failed to update student status');
      }

      // Update UI state
      toast.success('Student successfully assigned!');

      const newlyAssignedStudent = students.find((s) => s.id === studentId);
      if (newlyAssignedStudent) {
        setMentorStudents(prev => [...prev, newlyAssignedStudent]);
      }

      // Refresh students list
      await fetchStudents();

      // Send email notification if available
      try {
        if (newlyAssignedStudent) {
          await fetch('/api/email/student-assigned', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: newlyAssignedStudent.email,
              fullName: `${newlyAssignedStudent.first_name} ${newlyAssignedStudent.last_name}`,
              mentorName: selectedMentorForAssignment.full_name
            }),
          });
        }
      } catch (emailError) {
        console.error('Failed to send assignment email:', emailError);
        // Non-blocking error - don't show toast for this
      }
    } catch (error) {
      console.error('Unexpected error in handleAssignStudent:', error);
      toast.error('An unexpected error occurred during assignment');
    }
  };

  const handleRejectMentor = async (applicationId) => {
    setLoadingActionId(applicationId);
    try {
      const result = await safeUpdate('mentorapplications', { status: 'rejected' }, 'id', applicationId);
      if (result) {
        toast.success('Application rejected.');
        setMentorApplications(prev => prev.filter(app => app.id !== applicationId));
        await fetchMentorApplications();
      }
    } catch (error) {
      toast.error('Failed to reject application.');
      console.error('Error rejecting mentor application:', error);
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleUnassignStudent = async (studentId) => {
    try {
      console.log('Unassigning student:', studentId, 'from mentor:', selectedMentorForAssignment.user_id);

      const { error } = await supabase
        .from('mentor_student')
        .delete()
        .eq('mentor_id', selectedMentorForAssignment.user_id)
        .eq('student_id', studentId);

      if (error) {
        console.error('Error unassigning student:', error);
        toast.error('Failed to unassign student: ' + error.message);
        return;
      }

      // Update student record to mark as unassigned
      await safeUpdate('profiles', { is_assigned: false }, 'id', studentId);

      // Update UI by removing the student from the list
      setMentorStudents(prev => prev.filter(student => student.id !== studentId));

      // Refresh students list to show the newly unassigned student in available students
      await fetchStudents();

      toast.success('Student successfully unassigned');

      // Reset confirmation state
      setConfirmUnassign(null);
    } catch (error) {
      console.error('Error in handleUnassignStudent:', error);
      toast.error('An error occurred while unassigning student');
    }
  };

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const email = student.email.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="p-8 text-center text-red-600 bg-red-50 rounded-lg shadow-md max-w-xl mx-auto mt-20">
      <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
      <p>This area is restricted to administrators only.</p>
      <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
        Return to Home
      </button>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => navigate('/')}
                className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm transition flex items-center space-x-1"
              >
                <span>←</span>
                <span>Home</span>
              </button>
            </div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <div className="hidden sm:flex space-x-3">
              <Link to="/admin/blogs/manage" className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg shadow transition text-sm flex items-center">
                <span className="mr-1">✏️</span> Manage Blogs
              </Link>
              <Link to="/admin/announcements/send" className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg shadow transition text-sm flex items-center">
                <span className="mr-1">📢</span> Send Announcement
              </Link>
              <Link to="/admin/migration" className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg shadow transition text-sm flex items-center">
                <span className="mr-1">🔄</span> Database Migration
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-only action buttons */}
      <div className="sm:hidden flex justify-center gap-4 px-4 py-4">
        <Link to="/admin/blogs/manage" className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition text-center flex items-center justify-center">
          <span className="mr-1">✏️</span> Blogs
        </Link>
        <Link to="/admin/announcements/send" className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition text-center flex items-center justify-center">
          <span className="mr-1">📢</span> Announcements
        </Link>
        <Link to="/admin/migration" className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition text-center flex items-center justify-center">
          <span className="mr-1">🔄</span> Migration
        </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
            <div className="text-4xl font-bold text-indigo-600 mb-2">{students.length}</div>
            <div className="text-gray-500 text-sm">Total Students</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
            <div className="text-4xl font-bold text-green-600 mb-2">{approvedMentors.length}</div>
            <div className="text-gray-500 text-sm">Active Mentors</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">{noteStats.total}</div>
            <div className="text-gray-500 text-sm">Total Notes</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{noteStats.acknowledged}</div>
            <div className="text-gray-500 text-sm">Notes Acknowledged</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap border-b border-gray-200">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-6 py-3 font-medium text-sm ${activeTab === 'students'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Students ({students.length})
            </button>
            <button
              onClick={() => setActiveTab('mentors')}
              className={`px-6 py-3 font-medium text-sm ${activeTab === 'mentors'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Mentor Applications ({mentorApplications.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-6 py-3 font-medium text-sm ${activeTab === 'assignments'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Mentors & Assignments
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 font-medium text-sm ${activeTab === 'analytics'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Analytics & Demographics
            </button>
            <button
              onClick={() => setActiveTab('outcomes')}
              className={`px-6 py-3 font-medium text-sm ${activeTab === 'outcomes'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              Outcomes Analytics
            </button>
          </div>
        </div>

        {/* Analytics & Demographics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Platform Analytics</h2>

            {/* Signup Trend Chart */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Student Signups Over Time</h3>
              <div className="h-80 bg-gray-50 rounded-lg p-4">
                {demographicData.signupTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={demographicData.signupTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="value" name="New Students" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">No signup data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Demographics Section */}
            <h3 className="text-lg font-semibold mb-4">Student Demographics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {/* Age Distribution */}
              <div className="bg-white border rounded-lg shadow-sm p-4">
                <h4 className="font-medium text-gray-800 mb-3">Age Distribution</h4>
                <div className="h-64">
                  {demographicData.age.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={demographicData.age}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [`${value} students`, 'Count']}
                          labelFormatter={(label) => `Age Range: ${label}`}
                        />
                        <Bar
                          dataKey="value"
                          name="Students"
                          fill="#8884d8"
                          radius={[4, 4, 0, 0]}
                        >
                          {demographicData.age.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No age data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Gender Distribution */}
              <div className="bg-white border rounded-lg shadow-sm p-4">
                <h4 className="font-medium text-gray-800 mb-3">Gender Distribution</h4>
                <div className="h-64">
                  {demographicData.gender.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicData.gender}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label
                        >
                          {demographicData.gender.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No gender data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Religion Distribution */}
              <div className="bg-white border rounded-lg shadow-sm p-4">
                <h4 className="font-medium text-gray-800 mb-3">Religion Distribution</h4>
                <div className="h-64">
                  {demographicData.religion.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicData.religion}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label
                        >
                          {demographicData.religion.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No religion data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Education Level */}
              <div className="bg-white border rounded-lg shadow-sm p-4">
                <h4 className="font-medium text-gray-800 mb-3">Education Level</h4>
                <div className="h-64">
                  {demographicData.educationLevel.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={demographicData.educationLevel}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Students" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No education level data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* English Level */}
              <div className="bg-white border rounded-lg shadow-sm p-4">
                <h4 className="font-medium text-gray-800 mb-3">English Proficiency</h4>
                <div className="h-64">
                  {demographicData.englishLevel.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart layout="vertical" data={demographicData.englishLevel}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Students" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No English level data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* New Socioeconomic Demographics Section */}
            <h3 className="text-lg font-semibold mb-4 mt-8 border-t pt-8">Socioeconomic Demographics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              {/* Province Chart */}
              <div className="bg-white border rounded-lg shadow-sm p-4">
                <h4 className="font-medium text-gray-800 mb-3">Student Provinces</h4>
                <div className="h-64">
                  {demographicData.province.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={demographicData.province.sort((a, b) => b.value - a.value).slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Students" fill="#8884d8">
                          {demographicData.province.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No province data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* School Type Chart */}
              <div className="bg-white border rounded-lg shadow-sm p-4">
                <h4 className="font-medium text-gray-800 mb-3">School Types</h4>
                <div className="h-64">
                  {demographicData.schoolType.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicData.schoolType}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {demographicData.schoolType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No school type data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Household Income Chart */}
              <div className="bg-white border rounded-lg shadow-sm p-4">
                <h4 className="font-medium text-gray-800 mb-3">Household Income Bands</h4>
                <div className="h-64">
                  {demographicData.householdIncome.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={demographicData.householdIncome}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Students" fill="#8884d8">
                          {demographicData.householdIncome.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No income data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Parental Education Chart */}
              <div className="bg-white border rounded-lg shadow-sm p-4">
                <h4 className="font-medium text-gray-800 mb-3">Parental Education</h4>
                <div className="h-64">
                  {demographicData.parentalEducation.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicData.parentalEducation}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {demographicData.parentalEducation.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [value, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No parental education data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Internet Speed Chart */}
              <div className="bg-white border rounded-lg shadow-sm p-4">
                <h4 className="font-medium text-gray-800 mb-3">Internet Access Quality</h4>
                <div className="h-64">
                  {demographicData.internetSpeed.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={demographicData.internetSpeed}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Students" fill="#8884d8">
                          {demographicData.internetSpeed.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No internet quality data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Scholarship Eligibility Potential */}
              <div className="bg-white border rounded-lg shadow-sm p-4">
                <h4 className="font-medium text-gray-800 mb-3">Scholarship Eligibility Potential</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: 'High Potential', value: students?.filter(s =>
                            s.household_income_band?.includes('Less than') ||
                            s.household_income_band?.includes('10,000') ||
                            s.household_income_band?.includes('30,000')
                          )?.length || 0
                        },
                        {
                          name: 'Medium Potential', value: students?.filter(s =>
                            s.household_income_band?.includes('50,000') ||
                            s.household_income_band?.includes('70,000')
                          )?.length || 0
                        },
                        {
                          name: 'Low Potential', value: students?.filter(s =>
                            s.household_income_band?.includes('100,000') ||
                            s.household_income_band?.includes('More than')
                          )?.length || 0
                        }
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" name="Students">
                        <Cell fill="#4CAF50" />
                        <Cell fill="#FFC107" />
                        <Cell fill="#F44336" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Mentorship Analytics */}
            <div className="mt-8 border-t pt-8">
              <h4 className="font-medium text-gray-800 mb-3">Mentorship Notes Analytics</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: 'Total Notes', value: noteStats.total },
                      { name: 'Acknowledged', value: noteStats.acknowledged },
                      { name: 'Pending', value: noteStats.pending }
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Notes" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Outcomes Analytics Tab */}
        {activeTab === 'outcomes' && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Student Outcomes Analytics</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">College Admissions</p>
                    <h3 className="text-3xl font-bold text-indigo-600">{outcomesStats.collegeAdmissions.total}</h3>
                  </div>
                  <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">STEM Admissions</span>
                    <span className="text-sm font-medium">{outcomesStats.collegeAdmissions.stemCount}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{
                        width: outcomesStats.collegeAdmissions.total > 0
                          ? `${(outcomesStats.collegeAdmissions.stemCount / outcomesStats.collegeAdmissions.total) * 100}%`
                          : '0%'
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Scholarship Awards</p>
                    <h3 className="text-3xl font-bold text-green-600">{outcomesStats.scholarships.total}</h3>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Total Value</span>
                  <p className="text-xl font-medium text-gray-800">
                    ${outcomesStats.scholarships.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Employment Records</p>
                    <h3 className="text-3xl font-bold text-purple-600">{outcomesStats.employment.total}</h3>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {outcomesStats.employment.byType.map((type, index) => (
                      <span key={index} className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                        {type.name}: {type.value}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* College Admissions Charts */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">College Admissions Over Time</h3>
              <div className="h-80 bg-white border border-gray-200 rounded-lg p-4">
                {outcomesStats.collegeAdmissions.byMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={outcomesStats.collegeAdmissions.byMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="all" name="All Admissions" fill="#8884d8" />
                      <Bar dataKey="stem" name="STEM Admissions" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">No admission data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Scholarships Charts */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Scholarship Distribution</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80 bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium mb-2">Count by Type</h4>
                  {outcomesStats.scholarships.byType.length > 0 ? (
                    <ResponsiveContainer width="100%" height="90%">
                      <PieChart>
                        <Pie
                          data={outcomesStats.scholarships.byType}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="name"
                          label
                        >
                          {outcomesStats.scholarships.byType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name, props) => [`${value} scholarships`, props.payload.name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No scholarship data available</p>
                    </div>
                  )}
                </div>

                <div className="h-80 bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium mb-2">Value by Type</h4>
                  {outcomesStats.scholarships.byType.length > 0 ? (
                    <ResponsiveContainer width="100%" height="90%">
                      <BarChart data={outcomesStats.scholarships.byType}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Value']} />
                        <Bar dataKey="value" name="Scholarship Value" fill="#82ca9d">
                          {outcomesStats.scholarships.byType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-gray-500">No scholarship data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Employment Charts */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Employment Analysis</h3>
              <div className="h-80 bg-white border border-gray-200 rounded-lg p-4">
                {outcomesStats.employment.byType.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={outcomesStats.employment.byType}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {outcomesStats.employment.byType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500">No employment data available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Combined Outcomes Success Metrics */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Overall Student Success Metrics</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-800 mb-3">Success Breakdown</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">College Admissions</span>
                        <span className="text-sm font-medium">{students.length > 0 ? ((outcomesStats.collegeAdmissions.total / students.length) * 100).toFixed(1) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{
                          width: students.length > 0 ? `${(outcomesStats.collegeAdmissions.total / students.length) * 100}%` : '0%'
                        }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Scholarship Recipients</span>
                        <span className="text-sm font-medium">{students.length > 0 ? ((outcomesStats.scholarships.total / students.length) * 100).toFixed(1) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{
                          width: students.length > 0 ? `${(outcomesStats.scholarships.total / students.length) * 100}%` : '0%'
                        }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Employment Placed</span>
                        <span className="text-sm font-medium">{students.length > 0 ? ((outcomesStats.employment.total / students.length) * 100).toFixed(1) : 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{
                          width: students.length > 0 ? `${(outcomesStats.employment.total / students.length) * 100}%` : '0%'
                        }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-medium text-gray-800 mb-3">Overall Success Rate</h4>
                  <div className="flex items-center space-x-6">
                    <div className="relative h-32 w-32">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">
                          {students.length > 0 ?
                            ((students.filter(s => s.college_admit || s.scholarship_awarded || s.employed).length / students.length) * 100).toFixed(0)
                            : 0}%
                        </span>
                      </div>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: 'Success',
                                value: students.filter(s => s.college_admit || s.scholarship_awarded || s.employed).length
                              },
                              {
                                name: 'Pending',
                                value: students.length - students.filter(s => s.college_admit || s.scholarship_awarded || s.employed).length
                              }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={50}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill="#4F46E5" />
                            <Cell fill="#E5E7EB" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-4">
                        <span className="font-medium">
                          {students.filter(s => s.college_admit || s.scholarship_awarded || s.employed).length}
                        </span> out of <span className="font-medium">{students.length}</span> students have achieved at least one successful outcome.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                          College: {students.filter(s => s.college_admit).length}
                        </span>
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                          Scholarship: {students.filter(s => s.scholarship_awarded).length}
                        </span>
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                          Employment: {students.filter(s => s.employed).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Students Tab Content */}
        {activeTab === 'students' && (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <div className="w-full sm:w-auto relative">
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'table' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}
                >
                  Table View
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}
                >
                  Grid View
                </button>
              </div>
            </div>

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">id</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Education</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">English</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <>
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap"> {student.student_id}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <span className="text-indigo-700 font-medium">
                                      {student.first_name?.[0]}{student.last_name?.[0]}
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{student.first_name} {student.last_name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.education_level || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.english_level || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${studentNotes[student.id] > 0 ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                  {studentNotes[student.id] || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex flex-wrap gap-2">
                                  <button onClick={() => handleCopy(student)} className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Copy
                                  </button>
                                  <button onClick={() => setExpanded(expanded === student.id ? null : student.id)} className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    {expanded === student.id ? 'Hide' : 'View More'}
                                  </button>
                                  <button onClick={() => setEditingStudent(student)} className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Edit
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {expanded === student.id && (
                              <tr className="bg-gray-50">
                                <td colSpan="5" className="px-6 py-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div><strong>TOEFL Score:</strong> {student.toefl_score || 'N/A'}</div>
                                    <div><strong>Interests:</strong> {student.interests || 'N/A'}</div>
                                    <div><strong>Bio:</strong> {student.bio || 'N/A'}</div>
                                    <div><strong>Date of Birth:</strong> {student.date_of_birth || 'N/A'}</div>
                                    <div><strong>Signed Up:</strong> {new Date(student.created_at).toLocaleDateString()}</div>

                                    {/* Socioeconomic fields */}
                                    <div><strong>Province:</strong> {student.province || 'N/A'}</div>
                                    <div><strong>School Type:</strong> {student.school_type || 'N/A'}</div>
                                    <div><strong>Household Income:</strong> {student.household_income_band || 'N/A'}</div>
                                    <div><strong>Parental Education:</strong> {student.parental_education || 'N/A'}</div>
                                    <div><strong>Internet Access:</strong> {student.internet_speed || 'N/A'}</div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-10 text-gray-400">No students found matching your search.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <div key={student.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition">
                      <div className="px-6 pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-medium text-indigo-700">
                              {student.first_name?.[0]}{student.last_name?.[0]}
                            </div>
                            <div className="ml-3">
                              <h3 className="text-lg font-medium text-gray-900">{student.first_name} {student.last_name}</h3>
                              <p className="text-sm text-gray-500">{student.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Education:</span>
                            <span className="text-sm font-medium">{student.education_level || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">English Level:</span>
                            <span className="text-sm font-medium">{student.english_level || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Notes:</span>
                            <span className={`text-sm font-medium ${studentNotes[student.id] > 0 ? 'text-indigo-600' : ''}`}>
                              {studentNotes[student.id] || 0}
                            </span>
                          </div>
                          {expanded === student.id && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-500">TOEFL Score:</span>
                                <span className="text-sm font-medium">{student.toefl_score || 'N/A'}</span>
                              </div>
                              <div className="flex flex-col mt-2">
                                <span className="text-sm text-gray-500">Interests:</span>
                                <span className="text-sm">{student.interests || 'N/A'}</span>
                              </div>
                              <div className="flex flex-col mt-2">
                                <span className="text-sm text-gray-500">Bio:</span>
                                <span className="text-sm">{student.bio || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between mt-2">
                                <span className="text-sm text-gray-500">DoB:</span>
                                <span className="text-sm font-medium">{student.date_of_birth || 'N/A'}</span>
                              </div>

                              {/* Socioeconomic fields */}
                              <div className="flex justify-between mt-2">
                                <span className="text-sm text-gray-500">Province:</span>
                                <span className="text-sm font-medium">{student.province || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between mt-2">
                                <span className="text-sm text-gray-500">School Type:</span>
                                <span className="text-sm font-medium">{student.school_type || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between mt-2">
                                <span className="text-sm text-gray-500">Household Income:</span>
                                <span className="text-sm font-medium">{student.household_income_band || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between mt-2">
                                <span className="text-sm text-gray-500">Parental Education:</span>
                                <span className="text-sm font-medium">{student.parental_education || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between mt-2">
                                <span className="text-sm text-gray-500">Internet Access:</span>
                                <span className="text-sm font-medium">{student.internet_speed || 'N/A'}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="px-6 pb-6 flex justify-between">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleCopy(student)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => setExpanded(expanded === student.id ? null : student.id)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                          >
                            {expanded === student.id ? 'Hide' : 'View More'}
                          </button>
                        </div>
                        <button
                          onClick={() => setEditingStudent(student)}
                          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-10 text-gray-400 bg-white rounded-xl shadow-md">
                    No students found matching your search.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Mentor Applications Tab Content */}
        {activeTab === 'mentors' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            {mentorApplications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOB</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Languages</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours/Week</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mentorApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-700 font-medium">
                                {app.full_name.split(' ')[0]?.[0]}{app.full_name.split(' ')[1]?.[0]}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{app.full_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(app.dob).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1">
                            {app.languages.map((lang, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                {lang}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {app.available_hours_per_week} hrs/week
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleApproveMentor(app)}
                              disabled={loadingActionId === app.id}
                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${loadingActionId === app.id ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                            >
                              {loadingActionId === app.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleRejectMentor(app.id)}
                              disabled={loadingActionId === app.id}
                              className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${loadingActionId === app.id ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                            >
                              {loadingActionId === app.id ? 'Processing...' : 'Reject'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No pending applications</h3>
                <p className="mt-1 text-sm text-gray-500">There are no mentor applications waiting for review.</p>
              </div>
            )}
          </div>
        )}

        {/* Mentors & Assignments Tab Content */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6">
              <div className="mb-6 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                <h2 className="text-xl font-bold">Active Mentors & Student Assignments</h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search mentors..."
                    value={mentorSearch}
                    onChange={(e) => setMentorSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {assignmentMode ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setAssignmentMode(false);
                          setSelectedMentorForAssignment(null);
                          setMentorStudents([]);
                        }}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Back to Mentors
                      </button>
                      <h3 className="text-lg font-medium">
                        Assignments for: <span className="text-indigo-600">{selectedMentorForAssignment?.full_name}</span>
                      </h3>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Assigned Students */}
                    <div className="bg-white border rounded-xl p-4">
                      <h4 className="text-md font-medium mb-4 flex items-center">
                        <span className="mr-2 inline-flex items-center justify-center h-6 w-6 rounded-full bg-green-100 text-green-800">
                          {mentorStudents.length}
                        </span>
                        Assigned Students
                      </h4>

                      {mentorStudents.length === 0 ? (
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No students assigned to this mentor yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                          {mentorStudents
                            .filter(s => {
                              if (!assignedSearch) return true;
                              const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
                              return fullName.includes(assignedSearch.toLowerCase()) ||
                                s.email.toLowerCase().includes(assignedSearch.toLowerCase());
                            })
                            .map(student => (
                              <div key={student.id} className="border rounded-lg p-3 flex justify-between items-center">
                                <div className="flex items-center">
                                  <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-indigo-600 font-medium text-sm">
                                      {student.first_name?.[0]}{student.last_name?.[0]}
                                    </span>
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-sm">{student.first_name} {student.last_name}</h5>
                                    <p className="text-xs text-gray-500">{student.email}</p>
                                  </div>
                                </div>
                                {confirmUnassign === student.id ? (
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleUnassignStudent(student.id)}
                                      className="px-3 py-1 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition"
                                    >
                                      Confirm
                                    </button>
                                    <button
                                      onClick={() => setConfirmUnassign(null)}
                                      className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-gray-300 transition"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmUnassign(student.id)}
                                    className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-medium rounded hover:bg-red-100 hover:text-red-600 transition"
                                  >
                                    Unassign
                                  </button>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Available Students */}
                    <div className="bg-white border rounded-xl p-4">
                      <h4 className="text-md font-medium mb-4">Available Students</h4>

                      <div className="mb-3">
                        <input
                          type="text"
                          placeholder="Filter by name or email..."
                          value={assignedSearch}
                          onChange={(e) => setAssignedSearch(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-3 max-h-[500px] overflow-y-auto">
                        {students
                          .filter(s => !s.is_assigned) // Only show unassigned students
                          .filter(s => {
                            if (!studentSearch) return true;
                            const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
                            return fullName.includes(studentSearch.toLowerCase()) ||
                              s.email.toLowerCase().includes(studentSearch.toLowerCase());
                          })
                          .map(student => (
                            <div key={student.id} className="border rounded-lg p-3 flex justify-between items-center">
                              <div className="flex items-center">
                                <div className="h-9 w-9 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-gray-600 font-medium text-sm">
                                    {student.first_name?.[0]}{student.last_name?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <h5 className="font-medium text-sm">{student.first_name} {student.last_name}</h5>
                                  <p className="text-xs text-gray-500">{student.email}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAssignStudent(selectedMentorForAssignment.user_id, student.id)}
                                className="px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 transition"
                              >
                                Assign
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {approvedMentors.length === 0 ? (
                    <div className="text-center p-10 bg-gray-50 rounded-lg">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                      </svg>
                      <h3 className="text-lg font-medium text-gray-900">No approved mentors</h3>
                      <p className="mt-1 text-sm text-gray-500">Approve mentors from the Mentor Applications tab to see them here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {approvedMentors
                        .filter(mentor => {
                          if (!mentorSearch) return true;
                          return mentor.full_name.toLowerCase().includes(mentorSearch.toLowerCase()) ||
                            mentor.email.toLowerCase().includes(mentorSearch.toLowerCase());
                        })
                        .map(mentor => (
                          <div key={mentor.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                            <div className="p-6">
                              <div className="flex items-start space-x-4">
                                <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-xl font-medium text-indigo-700 flex-shrink-0">
                                  {mentor.full_name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="space-y-1 flex-1">
                                  <h3 className="text-lg font-medium">{mentor.full_name}</h3>
                                  <p className="text-sm text-gray-500">{mentor.email}</p>
                                  {mentor.languages && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {mentor.languages.map((lang, idx) => (
                                        <span key={idx} className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                                          {lang}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="border-t px-6 py-3 bg-gray-50 flex justify-end">
                              <button
                                onClick={() => handleViewAssigned(mentor)}
                                className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition"
                              >
                                View Assignments
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
