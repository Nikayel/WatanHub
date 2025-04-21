import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';

export default function AdminBlogManage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

    checkAdminAndFetch();
  }, [user]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this blog?');
    if (!confirmDelete) return;

    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting blog:', error);
      toast.error('Failed to delete blog');
    } else {
      toast.success('Blog deleted successfully!');
      setBlogs(blogs.filter((blog) => blog.id !== id));
    }
  };

  const filteredBlogs = blogs.filter((blog) => {
    const title = blog.title?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return title.includes(query);
  });

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
    <div className="max-w-7xl mx-auto p-6">

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
      <h1 className="text-4xl font-bold mb-8 text-center">Manage Blogs</h1>

      {/* Search Input */}
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="Search blogs by title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border px-4 py-2 rounded w-full max-w-md focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>

      {/* Blogs List */}
      {filteredBlogs.length > 0 ? (
        <div className="space-y-6">
          {filteredBlogs.map((blog) => (
            <div
              key={blog.id}
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition flex flex-col md:flex-row justify-between items-start md:items-center"
            >
              <div>
                <h2 className="text-2xl font-semibold mb-2">{blog.title}</h2>
                <p className="text-gray-500 text-sm">{new Date(blog.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
                <Link
                  to={`/admin/blog/edit/${blog.id}`}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(blog.id)}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-12">No blogs found.</div>
      )}
    </div>
  );
}
