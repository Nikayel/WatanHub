import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import { Clipboard, Edit, Trash2, Plus } from 'lucide-react';

export default function AdminBlogManage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAndFetchBlogs = async () => {
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
        fetchBlogs();
      } else {
        setLoading(false);
      }
    };

    const fetchBlogs = async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        setBlogs(data);
      }
      setLoading(false);
    };

    checkAdminAndFetchBlogs();
  }, [user]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this blog?');
    if (!confirmDelete) return;

    const { error } = await supabase.from('blogs').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete blog.');
    } else {
      toast.success('Blog deleted successfully!');
      setBlogs(blogs.filter(blog => blog.id !== id));
    }
  };

  const handleCopy = (blog) => {
    const blogInfo = `
Title: ${blog.title}
Views: ${blog.views || 0}
Description: ${blog.description || 'No description available'}
    `;
    navigator.clipboard.writeText(blogInfo.trim());
    toast.success('Blog info copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="text-center text-red-500 py-20">Access Denied. Admins only.</div>;
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

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">Manage Blogs</h1>
        <Link
          to="/admin/blogs/create"
          className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm shadow-md"
        >
          <Plus size={16} /> Create New Blog
        </Link>
      </div>

      {/* Blogs Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow p-6">
        <table className="min-w-full text-sm text-left">
          <thead className="border-b">
            <tr>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Created At</th>
              <th className="py-3 px-4">Views</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.map(blog => (
              <tr key={blog.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{blog.title}</td>
                <td className="py-3 px-4">{new Date(blog.created_at).toLocaleDateString()}</td>
                <td className="py-3 px-4">{blog.views || 0}</td>
                <td className="py-3 px-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCopy(blog)}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs"
                  >
                    <Clipboard size={14} /> Copy
                  </button>
                  <Link
                    to={`/admin/blogs/edit/${blog.id}`}
                    className="flex items-center gap-1 px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded text-xs"
                  >
                    <Edit size={14} /> Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(blog.id)}
                    className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {blogs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No blogs available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
