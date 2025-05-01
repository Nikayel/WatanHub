import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { safeSelect, safeDelete } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import { Clipboard, Edit, Trash2, Plus, Search, Filter, Eye, Calendar, ArrowUpDown } from 'lucide-react';

export default function AdminBlogManage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statsSummary, setStatsSummary] = useState({ total: 0, views: 0 });

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
        setBlogs(blogsData);
        
        // Calculate stats summary
        const totalBlogs = blogsData.length;
        const totalViews = blogsData.reduce((sum, blog) => sum + (blog.views || 0), 0);
        setStatsSummary({ total: totalBlogs, views: totalViews });
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
      
      // Update stats after deletion
      setStatsSummary(prev => ({
        total: prev.total - 1,
        views: prev.views - (blogs.find(b => b.id === id)?.views || 0)
      }));
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

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter and sort blogs
  const filteredBlogs = blogs
    .filter(blog => 
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (blog.description && blog.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortField === 'title') {
        return sortDirection === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (sortField === 'views') {
        return sortDirection === 'asc'
          ? (a.views || 0) - (b.views || 0)
          : (b.views || 0) - (a.views || 0);
      } else {
        // Default to created_at
        return sortDirection === 'asc'
          ? new Date(a.created_at) - new Date(b.created_at)
          : new Date(b.created_at) - new Date(a.created_at);
      }
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-purple-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-purple-50">
        <div className="text-center text-red-500 text-xl font-semibold">Access denied. Admins only.</div>
        <button 
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-50 pb-12">
      <div className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-purple-900">Manage Blogs</h1>
          <Link
            to="/admin/blogs/create"
            className="flex items-center gap-2 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm shadow-md transition-all transform hover:scale-105"
          >
            <Plus size={16} /> Create Blog
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Blogs</p>
                <h3 className="text-2xl font-bold text-gray-800">{statsSummary.total}</h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Views</p>
                <h3 className="text-2xl font-bold text-gray-800">{statsSummary.views}</h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Eye size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Average Views</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {statsSummary.total ? Math.round(statsSummary.views / statsSummary.total) : 0}
                </h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ArrowUpDown size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search blogs by title or description..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleSort('created_at')}
                className={`px-4 py-2 rounded-lg border ${
                  sortField === 'created_at' 
                    ? 'bg-purple-100 border-purple-300 text-purple-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Date {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button 
                onClick={() => handleSort('views')}
                className={`px-4 py-2 rounded-lg border ${
                  sortField === 'views' 
                    ? 'bg-purple-100 border-purple-300 text-purple-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Views {sortField === 'views' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button 
                onClick={() => handleSort('title')}
                className={`px-4 py-2 rounded-lg border ${
                  sortField === 'title' 
                    ? 'bg-purple-100 border-purple-300 text-purple-700' 
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>

        {/* Blogs Table */}
        <div className="overflow-x-auto bg-white rounded-xl shadow-md">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-purple-100 text-purple-800">
              <tr>
                <th className="py-4 px-6 font-semibold">Title</th>
                <th className="py-4 px-6 font-semibold">Created</th>
                <th className="py-4 px-6 font-semibold">Views</th>
                <th className="py-4 px-6 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBlogs.length > 0 ? (
                filteredBlogs.map(blog => (
                  <tr key={blog.id} className="border-b hover:bg-purple-50 transition-colors">
                    <td className="py-4 px-6 font-medium">{blog.title}</td>
                    <td className="py-4 px-6">{new Date(blog.created_at).toLocaleDateString()}</td>
                    <td className="py-4 px-6">{blog.views || 0}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/blog/${blog.id}`}
                          target="_blank"
                          className="flex items-center gap-1 px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-xs transition-colors"
                        >
                          <Eye size={14} /> View
                        </Link>
                        <button
                          onClick={() => handleCopy(blog)}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs transition-colors"
                        >
                          <Clipboard size={14} /> Copy
                        </button>
                        <Link
                          to={`/admin/blogs/edit/${blog.id}`}
                          className="flex items-center gap-1 px-3 py-1 bg-amber-400 hover:bg-amber-500 text-white rounded text-xs transition-colors"
                        >
                          <Edit size={14} /> Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(blog.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs transition-colors"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-400">
                    {searchTerm ? 'No blogs matching your search.' : 'No blogs found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination (Basic implementation) */}
        {filteredBlogs.length > 0 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-purple-300 rounded-lg bg-white text-purple-700 hover:bg-purple-50 disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                1
              </button>
              <button className="px-4 py-2 border border-purple-300 rounded-lg bg-white text-purple-700 hover:bg-purple-50 disabled:opacity-50" disabled>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}