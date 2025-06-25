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
import {
  Users, UserCheck, FileText, TrendingUp, GraduationCap, Award,
  Briefcase, DollarSign, Clock, Search, Filter, Download, Plus,
  Eye, EyeOff, Edit3, Trash2, UserPlus, Settings, Calendar,
  ChevronRight, AlertTriangle, CheckCircle, Phone, Mail,
  MapPin, Book, Globe, X, User, Edit, BookOpen, Heart,
  Sparkles, Save, PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StudentDetailModal from '../../components/StudentDetailModal';
import OutcomeModal from '../../components/OutcomeModal';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('cards'); // cards or table
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
  const [filterOptions, setFilterOptions] = useState({
    educationLevel: '',
    englishLevel: '',
    province: '',
    assignmentStatus: ''
  });
  const [studentNotes, setStudentNotes] = useState({}); // Fix for ESLint error

  // Enhanced state for CRM-like functionality
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    activeMentors: 0,
    totalNotes: 0,
    acknowledgedNotes: 0,
    collegeAdmissions: 0,
    scholarships: 0,
    totalScholarshipValue: 0,
    employmentPlacements: 0,
    averageProfileCompletion: 0,
    monthlySignups: 0,
    engagementRate: 0
  });

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

  const [outcomesStats, setOutcomesStats] = useState({
    collegeAdmissions: { total: 0, stemCount: 0, byMonth: [] },
    scholarships: { total: 0, totalValue: 0, byType: [] },
    employment: { total: 0, byType: [] }
  });

  // Enhanced color palette for CRM charts
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];
  const SUCCESS_COLOR = '#10B981';
  const WARNING_COLOR = '#F59E0B';
  const DANGER_COLOR = '#EF4444';
  const PRIMARY_COLOR = '#4F46E5';

  // Add state for tracking the real-time channel
  const [noteStatsChannel, setNoteStatsChannel] = useState(null);

  const [fellowshipSettings, setFellowshipSettings] = useState({
    start_date: '',
    description: ''
  });
  const [isEditingFellowship, setIsEditingFellowship] = useState(false);
  const [fellowshipLoading, setFellowshipLoading] = useState(false);

  // Define tabs for admin dashboard
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'mentors', label: 'Mentors', icon: UserCheck },
    { id: 'applications', label: 'Applications', icon: FileText },
    { id: 'fellowship', label: 'Fellowship Settings', icon: Settings }
  ];

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
        await fetchFellowshipSettings();

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
      setLoading(true);

      // First, fetch all students from profiles table (exclude mentors and admins if they have role field)
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'mentor')
        .neq('role', 'admin');

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        toast.error('Failed to load students');
        return;
      }

      // If the role-based filtering fails, try without role filtering
      let finalStudentsData = studentsData;
      if (!studentsData || studentsData.length === 0) {
        const { data: allProfiles, error: allError } = await supabase
          .from('profiles')
          .select('*');

        if (allError) {
          console.error('Error fetching all profiles:', allError);
          toast.error('Failed to load students');
          return;
        }
        finalStudentsData = allProfiles;
      }

      // Fetch all mentor-student assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('mentor_student')
        .select('student_id, mentor_id, assigned_at');

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
      }

      // Transform students to include assignment status
      const transformedStudents = finalStudentsData.map(student => {
        const assignment = assignmentsData?.find(a => a.student_id === student.id);
        return {
          ...student,
          is_assigned: !!assignment,
          assigned_mentor_id: assignment?.mentor_id || null,
          assigned_at: assignment?.assigned_at || null
        };
      });

      setStudents(transformedStudents || []);

      // Update dashboard stats
      const totalStudents = transformedStudents.length;
      const assignedStudents = transformedStudents.filter(s => s.is_assigned).length;

      // Get unique active mentors count
      const activeMentors = assignmentsData ? [...new Set(assignmentsData.map(a => a.mentor_id))].length : 0;

      // Calculate profile completion average
      const profileFields = [
        'first_name', 'last_name', 'email', 'education_level', 'english_level',
        'bio', 'date_of_birth', 'place_of_birth', 'place_of_residence', 'interests'
      ];

      const completionPercentages = transformedStudents.map(student => {
        const completedFields = profileFields.filter(field => student[field] && student[field] !== '').length;
        return (completedFields / profileFields.length) * 100;
      });

      const averageCompletion = completionPercentages.length > 0
        ? Math.round(completionPercentages.reduce((a, b) => a + b, 0) / completionPercentages.length)
        : 0;

      setDashboardStats(prev => ({
        ...prev,
        totalStudents,
        activeMentors,
        averageProfileCompletion: averageCompletion
      }));

      console.log('✅ Successfully loaded', totalStudents, 'students with', assignedStudents, 'assigned');

    } catch (error) {
      console.error('Error in fetchStudents:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
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
        .select(`
          student_id,
          profiles!mentor_student_student_id_fkey(*)
        `)
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

      // Check if assignment already exists to avoid duplicate entries
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

      // Create the assignment using profile IDs directly
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

      // Update the student's assigned status in profiles table
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

      // Update student record to mark as unassigned in profiles table
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

  // Enhanced filtering function with education level fix
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchQuery.length === 0 ||
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.student_id && student.student_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesEducation = !filterOptions.educationLevel ||
      student.education_level === filterOptions.educationLevel;

    const matchesEnglish = !filterOptions.englishLevel ||
      student.english_level === filterOptions.englishLevel;

    const matchesProvince = !filterOptions.province ||
      student.province === filterOptions.province;

    const matchesAssignment = !filterOptions.assignmentStatus ||
      (filterOptions.assignmentStatus === 'assigned' && student.is_assigned) ||
      (filterOptions.assignmentStatus === 'unassigned' && !student.is_assigned);

    return matchesSearch && matchesEducation && matchesEnglish && matchesProvince && matchesAssignment;
  });

  // Get unique values for filter dropdowns
  const educationLevels = [...new Set(students.map(s => s.education_level).filter(Boolean))];
  const englishLevels = [...new Set(students.map(s => s.english_level).filter(Boolean))];
  const provinces = [...new Set(students.map(s => s.province).filter(Boolean))];

  const handleViewStudentDetails = async (student) => {
    try {
      setLoadingActionId(student.id);

      // Fetch complete student profile from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', student.id)
        .single();

      if (profileError) {
        console.error('Error fetching student profile:', profileError);
        toast.error('Failed to load student profile');
        return;
      }

      // Fetch student resume from student_resumes table
      const { data: resumeData, error: resumeError } = await supabase
        .from('student_resumes')
        .select('*')
        .eq('student_id', student.id)
        .single();

      if (resumeError && resumeError.code !== 'PGRST116') {
        console.error('Error fetching resume:', resumeError);
      }

      // Set the complete student data for the modal
      setModalStudent({
        ...profileData,
        resume: resumeData || null
      });
    } catch (error) {
      console.error('Error viewing student details:', error);
      toast.error('Failed to load student details');
    } finally {
      setLoadingActionId(null);
    }
  };

  const fetchFellowshipSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('fellowship_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setFellowshipSettings({
          start_date: data.start_date || '',
          description: data.description || ''
        });
      }
    } catch (error) {
      console.error('Error fetching fellowship settings:', error);
      toast.error('Failed to load fellowship settings');
    }
  };

  const updateFellowshipSettings = async () => {
    try {
      setFellowshipLoading(true);

      // First check if record exists
      const { data: existingData, error: existingError } = await supabase
        .from('fellowship_settings')
        .select('id')
        .single();

      if (existingError && existingError.code === 'PGRST116') {
        // No record exists, create one
        const { data: insertData, error: insertError } = await supabase
          .from('fellowship_settings')
          .insert({
            start_date: fellowshipSettings.start_date,
            description: fellowshipSettings.description,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating fellowship settings:', insertError);
          toast.error('Failed to create fellowship settings');
          return;
        }
      } else if (existingData) {
        // Record exists, update it
        const { data: updateData, error: updateError } = await supabase
          .from('fellowship_settings')
          .update({
            start_date: fellowshipSettings.start_date,
            description: fellowshipSettings.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (updateError) {
          console.error('Error updating fellowship settings:', updateError);
          toast.error('Failed to update fellowship settings');
          return;
        }
      }

      toast.success('Fellowship settings updated successfully');
      setIsEditingFellowship(false);
      await fetchFellowshipSettings();
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while updating fellowship settings');
    } finally {
      setFellowshipLoading(false);
    }
  };

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
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CRM-Style Stats Overview Cards */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Students Card */}
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">Total Students</p>
                    <h3 className="text-3xl font-bold">{students.length}</h3>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span className="text-sm text-indigo-100">
                        {students.filter(s => {
                          const createdAt = new Date(s.created_at);
                          const oneMonthAgo = new Date();
                          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                          return createdAt > oneMonthAgo;
                        }).length} this month
                      </span>
                    </div>
                  </div>
                  <div className="bg-indigo-400 bg-opacity-30 rounded-full p-3">
                    <Users className="h-8 w-8" />
                  </div>
                </div>
              </div>

              {/* Active Mentors Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Active Mentors</p>
                    <h3 className="text-3xl font-bold">{approvedMentors.length}</h3>
                    <div className="flex items-center mt-2">
                      <UserCheck className="h-4 w-4 mr-1" />
                      <span className="text-sm text-green-100">
                        {mentorApplications.filter(m => m.status === 'pending').length} pending
                      </span>
                    </div>
                  </div>
                  <div className="bg-green-400 bg-opacity-30 rounded-full p-3">
                    <UserCheck className="h-8 w-8" />
                  </div>
                </div>
              </div>

              {/* College Admissions Card */}
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">College Admissions</p>
                    <h3 className="text-3xl font-bold">{outcomesStats.collegeAdmissions.total}</h3>
                    <div className="flex items-center mt-2">
                      <GraduationCap className="h-4 w-4 mr-1" />
                      <span className="text-sm text-amber-100">
                        {outcomesStats.collegeAdmissions.stemCount} STEM
                      </span>
                    </div>
                  </div>
                  <div className="bg-amber-400 bg-opacity-30 rounded-full p-3">
                    <GraduationCap className="h-8 w-8" />
                  </div>
                </div>
              </div>

              {/* Scholarships Card */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Scholarships</p>
                    <h3 className="text-3xl font-bold">{outcomesStats.scholarships.total}</h3>
                    <div className="flex items-center mt-2">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span className="text-sm text-purple-100">
                        ${outcomesStats.scholarships.totalValue?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                  <div className="bg-purple-400 bg-opacity-30 rounded-full p-3">
                    <Award className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Total Notes</p>
                    <h3 className="text-2xl font-bold text-gray-900">{noteStats.total}</h3>
                  </div>
                  <FileText className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">
                    {noteStats.acknowledged} acknowledged
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Employment</p>
                    <h3 className="text-2xl font-bold text-gray-900">{outcomesStats.employment.total}</h3>
                  </div>
                  <Briefcase className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Job placements</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Avg Profile Completion</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {students.length > 0 ?
                        Math.round(students.reduce((acc, s) => {
                          const fields = ['first_name', 'last_name', 'education_level', 'english_level', 'bio'];
                          const completed = fields.filter(f => s[f]).length;
                          return acc + (completed / fields.length * 100);
                        }, 0) / students.length) : 0}%
                    </h3>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Profile completeness</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm font-medium">Success Rate</p>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {students.length > 0 ?
                        Math.round((students.filter(s => s.college_admit || s.scholarship_awarded).length / students.length) * 100) : 0}%
                    </h3>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="mt-2">
                  <span className="text-sm text-gray-600">Student outcomes</span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Student Signup Trend */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Signups Trend</h3>
                <div className="h-80">
                  {demographicData.signupTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={demographicData.signupTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          name="New Students"
                          stroke={PRIMARY_COLOR}
                          fill={PRIMARY_COLOR}
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No signup data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Student Demographics */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Demographics</h3>
                <div className="h-80">
                  {demographicData.gender.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={demographicData.gender}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {demographicData.gender.map((entry, index) => (
                            <Cell key={`gender-analytics-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No demographic data available</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Outcomes Overview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Student Outcomes Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* College Admissions */}
                <div className="text-center">
                  <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <GraduationCap className="h-8 w-8 text-blue-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900">{outcomesStats.collegeAdmissions.total}</h4>
                  <p className="text-gray-600">College Admissions</p>
                  <p className="text-sm text-blue-600 font-medium">{outcomesStats.collegeAdmissions.stemCount} STEM</p>
                </div>

                {/* Scholarships */}
                <div className="text-center">
                  <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <Award className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900">{outcomesStats.scholarships.total}</h4>
                  <p className="text-gray-600">Scholarships Awarded</p>
                  <p className="text-sm text-green-600 font-medium">
                    ${outcomesStats.scholarships.totalValue?.toLocaleString() || 0} total
                  </p>
                </div>

                {/* Employment */}
                <div className="text-center">
                  <div className="bg-purple-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                    <Briefcase className="h-8 w-8 text-purple-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900">{outcomesStats.employment.total}</h4>
                  <p className="text-gray-600">Job Placements</p>
                  <p className="text-sm text-purple-600 font-medium">Full & Part-time</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('students')}
                  className="p-4 text-left border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <Users className="h-6 w-6 text-indigo-600 mb-2" />
                  <p className="font-medium text-gray-900">Manage Students</p>
                  <p className="text-sm text-gray-500">View and edit student profiles</p>
                </button>

                <button
                  onClick={() => setActiveTab('mentors')}
                  className="p-4 text-left border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <UserCheck className="h-6 w-6 text-green-600 mb-2" />
                  <p className="font-medium text-gray-900">Review Applications</p>
                  <p className="text-sm text-gray-500">Approve mentor applications</p>
                </button>

                <button
                  onClick={() => setActiveTab('assignments')}
                  className="p-4 text-left border border-gray-200 rounded-xl hover:border-amber-300 hover:bg-amber-50 transition-colors"
                >
                  <UserPlus className="h-6 w-6 text-amber-600 mb-2" />
                  <p className="font-medium text-gray-900">Assign Mentors</p>
                  <p className="text-sm text-gray-500">Match students with mentors</p>
                </button>

                <button
                  onClick={() => setActiveTab('analytics')}
                  className="p-4 text-left border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <TrendingUp className="h-6 w-6 text-purple-600 mb-2" />
                  <p className="font-medium text-gray-900">View Analytics</p>
                  <p className="text-sm text-gray-500">Platform insights & demographics</p>
                </button>
              </div>
            </div>
          </div>
        )
        }



        {/* Analytics & Demographics Tab */}
        {
          activeTab === 'analytics' && (
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
                              <Cell key={`age-cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
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
                              <Cell key={`gender-cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
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
                              <Cell key={`religion-cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
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
                              <Cell key={`province-cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
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
                              <Cell key={`schooltype-cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
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
                              <Cell key={`income-cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
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
                              <Cell key={`parental-cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
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
          )
        }

        {/* Outcomes Analytics Tab */}
        {
          activeTab === 'outcomes' && (
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
          )
        }

        {/* Enhanced Students Tab */}
        {
          activeTab === 'students' && (
            <div className="space-y-6">
              {/* Students Header with Search and Filters */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
                    <p className="text-gray-600">Manage student profiles and track their progress</p>
                  </div>

                  {/* Search and Filter Controls */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-full sm:w-64"
                      />
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={filterOptions.educationLevel}
                        onChange={(e) => setFilterOptions({ ...filterOptions, educationLevel: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">All Education Levels</option>
                        {educationLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>

                      <select
                        value={filterOptions.assignmentStatus}
                        onChange={(e) => setFilterOptions({ ...filterOptions, assignmentStatus: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">All Students</option>
                        <option value="assigned">Assigned</option>
                        <option value="unassigned">Unassigned</option>
                      </select>

                      <button
                        onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        {viewMode === 'cards' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Student Stats Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">{filteredStudents.length}</p>
                    </div>
                    <Users className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Assigned</p>
                      <p className="text-2xl font-bold text-green-600">
                        {filteredStudents.filter(s => s.is_assigned).length}
                      </p>
                    </div>
                    <UserCheck className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Unassigned</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {filteredStudents.filter(s => !s.is_assigned).length}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Success Outcomes</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {filteredStudents.filter(s => s.college_admit || s.scholarship_awarded).length}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
              </div>

              {/* Students List */}
              {viewMode === 'cards' ? (
                /* Enhanced Card View */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow">
                      {/* Card Header */}
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-lg font-bold">
                              {student.first_name?.[0]}{student.last_name?.[0]}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">
                                {student.first_name} {student.last_name}
                              </h3>
                              <p className="text-indigo-100 text-sm">ID: {student.student_id}</p>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${student.is_assigned
                            ? 'bg-green-500 bg-opacity-20 text-green-100'
                            : 'bg-amber-500 bg-opacity-20 text-amber-100'
                            }`}>
                            {student.is_assigned ? 'Assigned' : 'Unassigned'}
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 truncate">{student.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Book className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{student.education_level || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{student.english_level || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">{student.province || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Progress Indicators */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Profile Completion</span>
                            <span className="font-medium">
                              {Math.round((() => {
                                const fields = ['first_name', 'last_name', 'education_level', 'english_level', 'bio'];
                                const completed = fields.filter(f => student[f]).length;
                                return (completed / fields.length) * 100;
                              })())}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.round((() => {
                                  const fields = ['first_name', 'last_name', 'education_level', 'english_level', 'bio'];
                                  const completed = fields.filter(f => student[f]).length;
                                  return (completed / fields.length) * 100;
                                })())}%`
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Outcome Badges */}
                        <div className="flex flex-wrap gap-1">
                          {student.college_admit && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              College Admit
                            </span>
                          )}
                          {student.scholarship_awarded && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Scholarship
                            </span>
                          )}
                          {student.stem_major && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              STEM
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
                        <button
                          onClick={() => handleViewStudentDetails(student)}
                          disabled={loadingActionId === student.id}
                          className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-full transition-colors"
                          title="View Details"
                        >
                          {loadingActionId === student.id ? (
                            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingStudent(student)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Enhanced Table View */
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Education
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Progress
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Outcomes
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                  <span className="text-indigo-800 font-medium text-sm">
                                    {student.first_name?.[0]}{student.last_name?.[0]}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {student.first_name} {student.last_name}
                                  </div>
                                  <div className="text-sm text-gray-500">{student.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{student.education_level || 'N/A'}</div>
                              <div className="text-sm text-gray-500">{student.english_level || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${student.is_assigned
                                ? 'bg-green-100 text-green-800'
                                : 'bg-amber-100 text-amber-800'
                                }`}>
                                {student.is_assigned ? 'Assigned' : 'Unassigned'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className="bg-indigo-600 h-2 rounded-full"
                                    style={{
                                      width: `${Math.round((() => {
                                        const fields = ['first_name', 'last_name', 'education_level', 'english_level', 'bio'];
                                        const completed = fields.filter(f => student[f]).length;
                                        return (completed / fields.length) * 100;
                                      })())}%`
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm text-gray-900">
                                  {Math.round((() => {
                                    const fields = ['first_name', 'last_name', 'education_level', 'english_level', 'bio'];
                                    const completed = fields.filter(f => student[f]).length;
                                    return (completed / fields.length) * 100;
                                  })())}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-1">
                                {student.college_admit && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">College</span>
                                )}
                                {student.scholarship_awarded && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Scholarship</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleViewStudentDetails(student)}
                                  disabled={loadingActionId === student.id}
                                  className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-full transition-colors"
                                  title="View Details"
                                >
                                  {loadingActionId === student.id ? (
                                    <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => setEditingStudent(student)}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {filteredStudents.length === 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          )
        }

        {/* Mentor Applications Tab Content */}
        {
          activeTab === 'mentors' && (
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
          )
        }

        {/* Mentors & Assignments Tab Content */}
        {
          activeTab === 'assignments' && (
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
          )
        }

        {/* Fellowship Settings Tab */}
        {
          activeTab === 'fellowship' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Fellowship Program Settings</h2>
                <p className="text-gray-600 mb-6">
                  Manage fellowship program details, requirements, and highlights that are displayed to users.
                </p>
                <Link
                  to="/admin/fellowship-settings"
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Settings className="h-5 w-5" />
                  <span>Manage Fellowship Settings</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          )
        }

        {/* Student Detail Modal */}
        {
          modalStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {modalStudent.first_name} {modalStudent.last_name}
                        </h2>
                        <p className="text-gray-600">{modalStudent.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setModalStudent(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            <strong>Name:</strong> {modalStudent.first_name} {modalStudent.last_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            <strong>Email:</strong> {modalStudent.email}
                          </span>
                        </div>
                        {modalStudent.phone_number && (
                          <div className="flex items-center space-x-3">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              <strong>Phone:</strong> {modalStudent.phone_number}
                            </span>
                          </div>
                        )}
                        {modalStudent.date_of_birth && (
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              <strong>Date of Birth:</strong> {new Date(modalStudent.date_of_birth).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {modalStudent.place_of_birth && (
                          <div className="flex items-center space-x-3">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              <strong>Place of Birth:</strong> {modalStudent.place_of_birth}
                            </span>
                          </div>
                        )}
                        {modalStudent.place_of_residence && (
                          <div className="flex items-center space-x-3">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              <strong>Residence:</strong> {modalStudent.place_of_residence}
                            </span>
                          </div>
                        )}
                        {modalStudent.province && (
                          <div className="flex items-center space-x-3">
                            <Globe className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              <strong>Province:</strong> {modalStudent.province}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Academic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Academic Information</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Book className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            <strong>Education Level:</strong> {modalStudent.education_level || 'Not specified'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <GraduationCap className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            <strong>English Level:</strong> {modalStudent.english_level || 'Not assessed'}
                          </span>
                        </div>
                        {modalStudent.gpa && (
                          <div className="flex items-center space-x-3">
                            <Award className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              <strong>GPA:</strong> {modalStudent.gpa}
                            </span>
                          </div>
                        )}
                        {modalStudent.toefl_score && (
                          <div className="flex items-center space-x-3">
                            <Award className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              <strong>TOEFL Score:</strong> {modalStudent.toefl_score}
                            </span>
                          </div>
                        )}
                        {modalStudent.school_type && (
                          <div className="flex items-center space-x-3">
                            <Book className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">
                              <strong>School Type:</strong> {modalStudent.school_type}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    {modalStudent.bio && (
                      <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">About</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">{modalStudent.bio}</p>
                      </div>
                    )}

                    {/* Interests */}
                    {modalStudent.interests && (
                      <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Interests</h3>
                        <p className="text-sm text-gray-700">{modalStudent.interests}</p>
                      </div>
                    )}

                    {/* Resume Section */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Resume</h3>
                      {modalStudent.resume ? (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-8 w-8 text-blue-600" />
                              <div>
                                <p className="font-medium text-gray-900">Resume Available</p>
                                <p className="text-sm text-gray-600">
                                  Uploaded on {new Date(modalStudent.resume.uploaded_at).toLocaleDateString()}
                                </p>
                                {modalStudent.resume.file_size && (
                                  <p className="text-xs text-gray-500">
                                    Size: {(modalStudent.resume.file_size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => window.open(modalStudent.resume.file_url, '_blank')}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                              >
                                View Resume
                              </button>
                              <a
                                href={modalStudent.resume.file_url}
                                download
                                className="px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                            </div>
                          </div>

                          {/* PDF Preview */}
                          <div className="mt-4">
                            <iframe
                              src={modalStudent.resume.file_url}
                              className="w-full h-96 border border-gray-300 rounded-lg"
                              title="Resume Preview"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">No resume uploaded yet</p>
                        </div>
                      )}
                    </div>

                    {/* Achievements */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Achievements</h3>
                      <div className="flex flex-wrap gap-2">
                        {modalStudent.college_admit && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            College Admitted
                          </span>
                        )}
                        {modalStudent.scholarship_awarded && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                            Scholarship Awarded
                          </span>
                        )}
                        {modalStudent.stem_major && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                            STEM Major
                          </span>
                        )}
                        {!modalStudent.college_admit && !modalStudent.scholarship_awarded && !modalStudent.stem_major && (
                          <span className="text-gray-500 text-sm">No achievements recorded yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default AdminDashboard;
