import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { safeSelect, safeUpdate, safeInsert } from '../../lib/supabase';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

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



  
  useEffect(() => {
    if (!user) return;

    const checkAdminAndFetch = async () => {
      const adminData = await safeSelect('admin', '*', { id: user.id });
      if (adminData && adminData.length > 0) {
        setIsAdmin(true);
        await fetchStudents();
        await fetchMentorApplications();
      } else {
        toast.error('Access denied. Admins only.');
      }
      setLoading(false);
    };

    checkAdminAndFetch();
  }, [user]);

  const fetchStudents = async () => {
    const studentsData = await safeSelect('profiles', '*');
    if (studentsData) {
      setStudents(studentsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }
  };
  
  const handleViewAssigned = async (mentor) => {
    setAssignmentMode(true);
    setSelectedMentorForAssignment(mentor);
  
    const res = await supabase
      .from('mentor_student')
      .select('profiles(*)')
      .eq('mentor_id', mentor.user_id);
  
    if (res.data) {
      setMentorStudents(res.data.map((r) => r.profiles));
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
    const result = await safeSelect('mentorapplications', '*', { status: 'approved' });
    if (result) setApprovedMentors(result);
  };
  
  

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    const result = await safeUpdate('profiles', editingStudent, 'id', editingStudent.id);
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
      // 1. Insert into mentors table
      const insertResult = await safeInsert('mentors', {
        full_name: application.full_name,
        languages: application.languages,
        bio: application.bio,
      });
  
      if (insertResult) {
        // 2. Update status in mentorApplications table
        await safeUpdate('mentorapplications', { status: 'approved' }, 'id', application.id);
        toast.success(`${application.full_name} approved as mentor!`);
        
        // 3. Optional: Refresh data from server to ensure consistency
        await fetchMentorApplications();
      }
    } catch (error) {
      // Revert if there's an error
      setMentorApplications(prev => 
        prev.map(app => 
          app.id === application.id ? { ...app, status: 'pending' } : app
        )
      );
      toast.error('Failed to approve mentor');
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
    await safeUpdate('profiles',{is_assigned: true}, 'id', studentId);
      toast.success('Student successfully assigned!');
      const newLyAssignedStudent = students.find((s) => s.id === studentId);
      if(newLyAssignedStudent) {
        setMentorStudents(prev => [...prev, newLyAssignedStudent]);
      }
      await fetchStudents();
   
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
                onClick={() => navigate(-1)}
                className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm transition flex items-center space-x-1"
              >
                <span>←</span>
                <span>Back</span>
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap border-b border-gray-200">
            <button
              onClick={() => setActiveTab('students')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Students ({students.length})
            </button>
            <button
              onClick={() => setActiveTab('mentors')}
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'mentors'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Mentor Applications ({mentorApplications.length})
            </button>
            <button
  onClick={() => setActiveTab('assignments')}
  className={`px-6 py-3 font-medium text-sm ${
    activeTab === 'assignments'
      ? 'border-b-2 border-indigo-600 text-indigo-600'
      : 'text-gray-500 hover:text-gray-700'
  }`}
>
  Mentors & Assignments
</button>
          </div>
        </div>
        {/* Activate the assignemnts button function */}
        <button
        
  onClick={() => setActiveTab('assignments')}
  className={`px-6 py-3 font-medium text-sm ${
    activeTab === 'assignments'
      ? 'border-b-2 border-indigo-600 text-indigo-600'
      : 'text-gray-500 hover:text-gray-700'
  }`}
>
  Mentors & Assignments
</button>
{/* //Conditional after user enters the assignment button UI */}
{activeTab === 'assignments' && (
  <div className="bg-white rounded-xl shadow-md p-6 mt-6">
    {!assignmentMode ? (
      <>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Approved Mentors</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Search mentors..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-2 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {approvedMentors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 font-medium">No approved mentors yet</p>
            <p className="text-sm text-gray-400 mt-1">Approved mentors will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {approvedMentors.map((mentor) => (
    <div
      key={mentor.id}
      className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="bg-indigo-50 p-3 border-b border-gray-200">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-lg mr-3">
            {mentor.full_name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-semibold text-lg">{mentor.full_name}</p>
            <p className="text-sm text-gray-600">{mentor.email}</p>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="mb-3">
          <p className="text-sm mb-1">
            <span className="font-medium text-indigo-600">Languages:</span>{' '}
            {mentor.languages?.join(', ') || 'N/A'}
          </p>
          <p className="text-sm">
            <span className="font-medium text-indigo-600">Bio:</span>{' '}
            <span className="text-gray-700">{mentor.bio || 'N/A'}</span>
          </p>
        </div>
        
        <div className="flex space-x-2 mt-3">
          <button
            onClick={() => {
              setSelectedMentorForAssignment(mentor);
              setAssignmentMode(true);
              handleViewAssigned(mentor);
            }}
            className="flex-1 py-2 px-3 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Assign Students
          </button>
          <button 
            onClick={() => {
              setSelectedMentorForAssignment(mentor);
              setAssignmentMode(true);
              handleViewAssigned(mentor);
            }}
            className="py-2 px-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            View Profile
          </button>
        </div>
      </div>
    </div>
  ))}
</div>

        )}
      </>
    ) : (
      <>
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => {
              setAssignmentMode(false);
              setSelectedMentorForAssignment(null);
              setMentorStudents([]);
            }}
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Mentors
          </button>
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-500">
              {mentorStudents.length} student{mentorStudents.length !== 1 ? 's' : ''} assigned
            </span>
            <button className="ml-2 text-sm bg-indigo-100 text-indigo-700 py-1 px-3 rounded-full hover:bg-indigo-200 transition-colors">
              Export List
            </button>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="flex-shrink-0 h-14 w-14 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4 mb-3 md:mb-0">
              {selectedMentorForAssignment.full_name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-800">
                {selectedMentorForAssignment.full_name}
              </h2>
              <div className="flex flex-wrap mt-1">
                <p className="text-sm text-gray-600 mr-4">
                  <span className="font-medium">Email:</span> {selectedMentorForAssignment.email}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Languages:</span> {selectedMentorForAssignment.languages.join(', ')}
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Bio:</span> {selectedMentorForAssignment.bio}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Assigned Students Section */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <h3 className="text-lg font-semibold mb-3 text-indigo-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Assigned Students
            </h3>
            
            {mentorStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 bg-gray-50 rounded-md border border-dashed border-gray-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                <p className="text-gray-500">No students assigned yet</p>
                <p className="text-xs text-gray-400 mt-1">Students will appear here once assigned</p>
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Filter assigned students..."
                    className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <ul className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                  {mentorStudents.map((student) => (
                    <li
                      key={student.id}
                      onClick={() => setViewingStudent(student)}
                      className="flex items-center py-3 px-2 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
                    >
                      <div className="flex-shrink-0 h-8 w-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-3">
                        {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{student.email}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmUnassign(student);
                        }}
                        className="text-xs text-red-600 hover:text-red-800 ml-4 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Unassign
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Available Students Section */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-indigo-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Available Students
              </h3>
              <div className="flex items-center">
                <span className="text-xs text-gray-500">
                  { students
                    .filter((s) => !s.is_assigned && !mentorStudents.find((m) => m.id === s.id))
                   .length
                     }{' '}
                      available
                </span>
              </div>
            </div>
            
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Search students..."
                className="w-full pl-8 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-1">
              {students
                .filter((s) => !mentorStudents.find((m) => m.id === s.id))
                .map((student) => (
                  <div
                    key={student.id}
                    className="border border-gray-200 p-3 rounded-lg shadow-sm hover:shadow transition group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center mr-2 text-sm font-medium">
                            {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                        </div>
                        
                        <div className="mt-2 pl-10">
                          {student.education_level && (
                            <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded mr-1 mb-1">
                              {student.education_level}
                            </span>
                          )}
                          {student.english_level && (
                            <span className="inline-block bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded mr-1 mb-1">
                              {student.english_level}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssignStudent(
                              selectedMentorForAssignment.user_id,
                              student.id
                            );
                          }}
                          className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Assign
                        </button>
                        <button
                          onClick={() => setViewingStudent(student)}
                          className="ml-2 text-sm px-2 py-1 text-gray-600 hover:text-indigo-600 transition"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        
        {/* Batch Assignment Options */}
        <div className="mt-4 p-3 border-t border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <button className="text-sm text-indigo-600 hover:text-indigo-800 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Students
            </button>
            <button className="text-sm text-indigo-600 hover:text-indigo-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Bulk Assign
            </button>
          </div>
          <div>
            <button className="text-sm px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
              Save Assignments
            </button>
          </div>
        </div>
      </>
    )}
    
    {/* Student Profile Modal */}
    {viewingStudent && (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full relative">
          <button
            onClick={() => setViewingStudent(null)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-medium mr-3">
              {viewingStudent.first_name.charAt(0)}{viewingStudent.last_name.charAt(0)}
            </div>
            <h2 className="text-xl font-semibold">
              {viewingStudent.first_name} {viewingStudent.last_name}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm"><span className="font-medium text-gray-700">Email:</span> {viewingStudent.email}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm"><span className="font-medium text-gray-700">Date of Birth:</span> {viewingStudent.date_of_birth || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm"><span className="font-medium text-gray-700">Education:</span> {viewingStudent.education_level || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm"><span className="font-medium text-gray-700">English Level:</span> {viewingStudent.english_level || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm"><span className="font-medium text-gray-700">TOEFL Score:</span> {viewingStudent.toefl_score || 'N/A'}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="font-medium text-gray-700 mb-1">Interests:</p>
            <p className="text-sm bg-gray-50 p-3 rounded">{viewingStudent.interests || 'N/A'}</p>
          </div>
          
          <div>
            <p className="font-medium text-gray-700 mb-1">Bio:</p>
            <p className="text-sm bg-gray-50 p-3 rounded">{viewingStudent.bio || 'N/A'}</p>
          </div>
          
          <div className="mt-5 flex justify-end space-x-3">
            {!mentorStudents.find(s => s.id === viewingStudent.id) ? (
              <button
                onClick={() => {
                  handleAssignStudent(selectedMentorForAssignment.user_id, viewingStudent.id);
                  setViewingStudent(null);
                }}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
              >
                Assign to Mentor
              </button>
            ) : (
              <button
                onClick={() => {
                  setConfirmUnassign(viewingStudent);
                  setViewingStudent(null);
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
              >
                Unassign from Mentor
              </button>
            )}
            <button
              onClick={() => setViewingStudent(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    
    {/* Unassign Confirmation Modal */}
    {confirmUnassign && (
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold">
              Unassign Student
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to unassign <span className="font-medium">{confirmUnassign.first_name} {confirmUnassign.last_name}</span> from this mentor?
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setConfirmUnassign(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const { error } = await supabase
                  .from('mentor_student')
                  .delete()
                  .eq('mentor_id', selectedMentorForAssignment.user_id)
                  .eq('student_id', confirmUnassign.id);
                  await safeUpdate('profiles',{is_assigned: false}, 'id', confirmUnassign.id);
                if (error) {
                  toast.error('Failed to unassign student');
                  console.error(error);
                } else {
                  toast.success('Student unassigned');
                  handleViewAssigned(selectedMentorForAssignment);
                  setConfirmUnassign(null);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Unassign
            </button>
          </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm resize-y"
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
