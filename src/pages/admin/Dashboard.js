import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { safeSelect, safeUpdate, safeInsert } from '../../lib/supabase';
import { toast } from 'sonner';

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

  const fetchMentorApplications = async () => {
    const applications = await safeSelect('mentorapplications', '*', { status: 'pending' });
    if (applications) {
      setMentorApplications(applications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }
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
    }
  };

  const handleRejectMentor = async (applicationId) => {
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


  };
}

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
    return <div className="p-4 text-center text-red-600">Access Denied. Admins only.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm"
        >
          ← Back
        </button>
      </div>

      {/* Page Title */}
      <h1 className="text-4xl font-bold mb-8 text-center">Admin Dashboard</h1>

      {/* Manage Blogs and Send Announcements */}
      <div className="flex flex-wrap justify-center gap-4 mb-10">
        <Link to="/admin/blogs/manage" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition">
          Manage Blogs
        </Link>
        <Link to="/admin/announcements/send" className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow transition">
          Send Announcement
        </Link>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="Search students by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border px-4 py-2 rounded w-full max-w-md focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow p-6 mb-16">
        <table className="min-w-full text-sm text-left">
          <thead className="border-b">
            <tr>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Education</th>
              <th className="py-3 px-4">English</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <>
                  <tr key={student.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{student.first_name} {student.last_name}</td>
                    <td className="py-3 px-4">{student.email}</td>
                    <td className="py-3 px-4">{student.education_level || 'N/A'}</td>
                    <td className="py-3 px-4">{student.english_level || 'N/A'}</td>
                    <td className="py-3 px-4 flex flex-wrap gap-2">
                      <button onClick={() => handleCopy(student)} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs">Copy</button>
                      <button onClick={() => setExpanded(expanded === student.id ? null : student.id)} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs">
                        {expanded === student.id ? 'Hide' : 'View More'}
                      </button>
                      <button onClick={() => setEditingStudent(student)} className="px-3 py-1 bg-blue-200 hover:bg-blue-300 rounded text-xs">Edit</button>
                    </td>
                  </tr>

                  {expanded === student.id && (
                    <tr key={`details-${student.id}`} className="bg-gray-50">
                      <td colSpan="5" className="py-4 px-6">
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
                <td colSpan="5" className="text-center py-10 text-gray-400">No students found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mentor Applications Section */}
      <div className="mt-20">
        <h2 className="text-3xl font-bold mb-8 text-center">Mentor Applications</h2>

        <div className="overflow-x-auto bg-white rounded-xl shadow p-6">
          <table className="min-w-full text-sm text-left">
            <thead className="border-b">
              <tr>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">email</th>
                <th className="py-3 px-4">DOB</th>
                <th className="py-3 px-4">Languages</th>
                <th className="py-3 px-4">Hours/Week</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mentorApplications.length > 0 ? (
                mentorApplications.map((app) => (
                  <tr key={app.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{app.full_name}</td>
                    <td className="py-3 px-4">{app.email}</td>
                    <td className="py-3 px-4">{new Date(app.dob).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{app.languages.join(', ')}</td>
                    <td className="py-3 px-4">{app.available_hours_per_week} hrs</td>
                    <td className="py-3 px-4 flex flex-wrap gap-2">
                      <button onClick={() => handleApproveMentor(app)} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs">Approve</button>
                      <button onClick={() => handleRejectMentor(app.id)} className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs">Reject</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-400">No pending mentor applications.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg w-full max-w-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6">Edit Student</h2>
            <div className="grid gap-4">
              {['first_name', 'last_name', 'email', 'education_level', 'english_level', 'toefl_score', 'interests', 'bio'].map((field) => (
                <input
                  key={field}
                  type="text"
                  placeholder={field.replace('_', ' ').toUpperCase()}
                  value={editingStudent[field] || ''}
                  onChange={(e) => setEditingStudent({ ...editingStudent, [field]: e.target.value })}
                  className="border px-4 py-2 rounded"
                />
              ))}
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setEditingStudent(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700">Cancel</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
