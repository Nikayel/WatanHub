import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    const email = student.email.toLowerCase();
    const query = searchQuery.toLowerCase();
  
    return (
      fullName.includes(query) ||
      email.includes(query)
    );
  });
 

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: adminData } = await supabase
        .from('admin')
        .select('*')
        .eq('id', user.id)
        .single();

      if (adminData) {
        setIsAdmin(true);
        fetchStudents();
      } else {
        setLoading(false);
      }
    };

    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        setStudents(data);
      }
      setLoading(false);
    };

    checkAdminAndFetch();
  }, [user]);

  const handleCopy = (student) => {
    const info = `
      Name: ${student.first_name} ${student.last_name}
      Email: ${student.email}
      Education Level: ${student.education_level || 'N/A'}
      English Level: ${student.english_level || 'N/A'}
      Interests: ${student.interests || 'N/A'}
      TOEFL Score: ${student.toefl_score || 'N/A'}
      Bio: ${student.bio || 'N/A'}
    `;
    navigator.clipboard.writeText(info.trim());
    toast.success('Student info copied to clipboard!');
  };

  const handleSaveEdit = async () => {
    const { error } = await supabase
      .from('profiles')
      .update(editingStudent)
      .eq('id', editingStudent.id);

    if (error) {
      toast.error('Error updating student');
    } else {
      toast.success('Student updated successfully!');
      setEditingStudent(null);
      // Refetch students to show updated info
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setStudents(data);
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
    return <div className="p-4 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm transition"
        >
          ← Back
        </button>
      </div>

      {/* Page Title */}
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Admin Dashboard</h1>

      {/* Manage Blogs Button */}
      <div className="flex justify-center mb-12">
        <Link
          to="/admin/blogs/manage"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition"
        >
          Manage Blogs
        </Link>
      </div>

      {/* Students Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow p-6">
      <div className="mb-6 flex justify-center">
  <input
    type="text"
    placeholder="Search students by name or email..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="border px-4 py-2 rounded w-full max-w-md focus:outline-none focus:ring focus:border-blue-300"
  />
</div>

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
            {filteredStudents.map((student) => (
              <>
              <tr key={student.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{student.first_name} {student.last_name}</td>
                <td className="py-3 px-4">{student.email}</td>
                <td className="py-3 px-4">{student.education_level || 'N/A'}</td>
                <td className="py-3 px-4">{student.english_level || 'N/A'}</td>
                <td className="py-3 px-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleCopy(student)}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setExpanded(expanded === student.id ? null : student.id)}
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs"
                  >
                    {expanded === student.id ? 'Hide' : 'View More'}
                  </button>
                  <button
                    onClick={() => setEditingStudent(student)}
                    className="px-3 py-1 bg-blue-200 hover:bg-blue-300 text-blue-700 rounded text-xs"
                  >
                    Edit
                  </button>
                </td>
              </tr>

              {/* Expandable Details Row */}
              {expanded === student.id && (
                <tr>
                  <td colSpan="5" className="py-4 px-6 bg-gray-50 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            ))}
          </tbody>
        </table>

        {students.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No students found.</p>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg w-full max-w-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Student</h2>
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
              <button
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
