import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { safeSelect, safeDelete } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import { Clipboard, Edit, Trash2, Plus } from 'lucide-react';

export default function AdminBlogManage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    if (!user) return;

    const checkAdminAndFetchBlogs = async () => {
      const adminData = await safeSelect('admin', '*', { id: user.id });
      if (adminData && adminData.length > 0) {
        setIsAdmin(true);
        await fetchBlogs();
      } else {
        toast.error('Access denied. Admins only.');
      }
      setLoading(false);
    };

    const fetchBlogs = async () => {
      const blogsData = await safeSelect('blogs', '*');
      if (blogsData) {
        setBlogs(blogsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    };

    checkAdminAndFetchBlogs();
  }, [user]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this blog?');
    if (!confirmDelete) return;

    const success = await safeDelete('blogs', 'id', id);
    if (success) {
      setBlogs((prev) => prev.filter(blog => blog.id !== id));
      toast.success('Blog deleted successfully!');
    }
  };

  const handleCopy = (blog) => {
    const blogInfo = `
Title: ${blog.title}
Views: ${blog.views || 0}
Description: ${blog.description || 'No description'}
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
    return <div className="text-center text-red-500 py-20">Access denied. Admins only.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Blogs</h1>
        <Link
          to="/admin/blogs/create"
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm shadow-md"
        >
          <Plus size={16} /> Create Blog
        </Link>
      </div>

      {/* Blogs Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow p-6">
        <table className="min-w-full text-sm text-left">
          <thead className="border-b">
            <tr>
              <th className="py-3 px-4">Title</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4">Views</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blogs.length > 0 ? (
              blogs.map(blog => (
                <tr key={blog.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{blog.title}</td>
                  <td className="py-3 px-4">{new Date(blog.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{blog.views || 0}</td>
                  <td className="py-3 px-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => handleCopy(blog)}
                      className="flex items-center gap-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
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
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-8 text-gray-400">No blogs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
