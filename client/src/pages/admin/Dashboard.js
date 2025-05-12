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

export default function AdminDashboard() {
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
    signupTrend: []
  });
  const [noteStats, setNoteStats] = useState({
    total: 0,
    acknowledged: 0,
    pending: 0,
    trend: []
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
    // Subscribe to mentor_notes table changes to update stats in real-time
    const channel = supabase
      .channel('admin-note-stats-changes')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mentor_notes'
        },
        async () => {
          console.log('Admin dashboard: Note stats update triggered by database change');
          // Refresh note statistics
          await fetchNoteStats();
        }
      )
      .subscribe();

    setNoteStatsChannel(channel);
    console.log('Admin dashboard: Real-time subscriptions set up');
  };

  const fetchStudents = async () => {
    const studentsData = await safeSelect('profiles', '*');
    if (studentsData) {
      setStudents(studentsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
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
      const currentYear = new Date().getFullYear();
      const ageData = studentsData.reduce((acc, student) => {
        if (student.birth_year) {
          const age = currentYear - parseInt(student.birth_year);
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
      const genderData = studentsData.reduce((acc, student) => {
        if (student.gender) {
          const existing = acc.find(item => item.name === student.gender);
          if (existing) {
            existing.value += 1;
          } else {
            acc.push({ name: student.gender, value: 1 });
          }
        }
        return acc;
      }, []);

      // Process religion data
      const religionData = studentsData.reduce((acc, student) => {
        if (student.religion) {
          const existing = acc.find(item => item.name === student.religion);
          if (existing) {
            existing.value += 1;
          } else {
            acc.push({ name: student.religion, value: 1 });
          }
        }
        return acc;
      }, []);

      // Process education level data
      const educationData = studentsData.reduce((acc, student) => {
        if (student.education_level) {
          const existing = acc.find(item => item.name === student.education_level);
          if (existing) {
            existing.value += 1;
          } else {
            acc.push({ name: student.education_level, value: 1 });
          }
        }
        return acc;
      }, []);

      // Process English level data
      const englishData = studentsData.reduce((acc, student) => {
        if (student.english_level) {
          const existing = acc.find(item => item.name === student.english_level);
          if (existing) {
            existing.value += 1;
          } else {
            acc.push({ name: student.english_level, value: 1 });
          }
        }
        return acc;
      }, []);

      // Process signup trend (by month)
      const signupData = [];
      const months = {};

      studentsData.forEach(student => {
        if (student.created_at) {
          const date = new Date(student.created_at);
          const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

          if (months[monthYear]) {
            months[monthYear] += 1;
          } else {
            months[monthYear] = 1;
          }
        }
      });

      // Convert to array and sort chronologically
      Object.keys(months).sort().forEach(key => {
        const [year, month] = key.split('-');
        const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'short' });
        signupData.push({
          name: `${monthName} ${year}`,
          value: months[key]
        });
      });

      setDemographicData({
        age: ageData.sort((a, b) => a.name.localeCompare(b.name)),
        gender: genderData,
        religion: religionData,
        educationLevel: educationData,
        englishLevel: englishData,
        signupTrend: signupData
      });

    } catch (error) {
      console.error('Error processing demographic data:', error);
    }
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
    const { data, error } = await supabase
      .from('mentor_student')
      .insert([{ mentor_id: mentorId, student_id: studentId }]);

    if (error) {
      toast.error('Assignment failed: ' + error.message);
      console.error(error);
      return;
    }
    await safeUpdate('profiles', { is_assigned: true }, 'id', studentId);
    toast.success('Student successfully assigned!');

    const newLyAssignedStudent = students.find((s) => s.id === studentId);
    if (newLyAssignedStudent) {
      setMentorStudents(prev => [...prev, newLyAssignedStudent]);
    }

    await fetchStudents();

    // ✅ Now send the assignment email
    await fetch('/api/email/student-assigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newLyAssignedStudent?.email,
        fullName: `${newLyAssignedStudent?.first_name} ${newLyAssignedStudent?.last_name}`,
        mentorName: selectedMentorForAssignment.full_name
      }),
    });

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {/* Age Distribution */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                <h4 className="font-medium text-gray-800 mb-3">Age Distribution</h4>
                <div className="h-64">
                  {demographicData.age.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={demographicData.age}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Students" fill="#8884d8" />
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
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
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
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
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
            </div>

            {/* Education and English Level */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Education Level */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
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
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
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

            {/* Mentorship Analytics */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
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

            {/* Note Acknowledgment Trend */}
            {noteStats.trend && noteStats.trend.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mt-6">
                <h4 className="font-medium text-gray-800 mb-3">Note Acknowledgment Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={noteStats.trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="acknowledged" name="Acknowledged Notes" fill="#82ca9d" />
                      <Bar dataKey="pending" name="Pending Notes" stackId="a" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
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

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Edit Student Profile</h2>
              <button onClick={() => setEditingStudent(null)} className="text-gray-500 hover:text-gray-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editingStudent.first_name || ''}
                    onChange={(e) => setEditingStudent({ ...editingStudent, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editingStudent.last_name || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, last_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Email */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingStudent.email || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Education Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                  <input
                    type="text"
                    value={editingStudent.education_level || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, education_level: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* English Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">English Level</label>
                  <input
                    type="text"
                    value={editingStudent.english_level || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, english_level: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* TOEFL Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TOEFL Score</label>
                  <input
                    type="number"
                    value={editingStudent.toefl_score || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, toefl_score: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={
                      editingStudent.date_of_birth
                        ? editingStudent.date_of_birth.split('T')[0]
                        : ''
                    }
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, date_of_birth: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Interests */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
                  <input
                    type="text"
                    value={editingStudent.interests || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, interests: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>

                {/* Bio */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    rows={4}
                    value={editingStudent.bio || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, bio: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-y"
                  ></textarea>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
