import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { safeSelect, safeDelete, supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import {
  Clipboard, Edit, Trash2, Plus, Search, Filter, Eye, Calendar,
  ArrowUpDown, Globe, FileText, TrendingUp, Users, CheckCircle,
  XCircle, Clock, BarChart3
} from 'lucide-react';

export default function AdminBlogManage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statsSummary, setStatsSummary] = useState({
    total: 0,
    published: 0,
    draft: 0,
    views: 0,
    avgViews: 0
  });

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

        // Calculate enhanced stats summary
        const totalBlogs = blogsData.length;
        const publishedBlogs = blogsData.filter(blog => blog.published !== false).length;
        const draftBlogs = blogsData.filter(blog => blog.published === false).length;
        const totalViews = blogsData.reduce((sum, blog) => sum + (blog.views || 0), 0);
        const avgViews = totalBlogs ? Math.round(totalViews / totalBlogs) : 0;

        setStatsSummary({
          total: totalBlogs,
          published: publishedBlogs,
          draft: draftBlogs,
          views: totalViews,
          avgViews
        });
      }
    };

    checkAdminAndFetchBlogs();
  }, [user]);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this blog?');
    if (!confirmDelete) return;

    const success = await safeDelete('blogs', 'id', id);
    if (success) {
      const deletedBlog = blogs.find(b => b.id === id);
      setBlogs((prev) => prev.filter(blog => blog.id !== id));
      toast.success('Blog deleted successfully!');

      // Update stats after deletion
      setStatsSummary(prev => ({
        total: prev.total - 1,
        published: deletedBlog?.published !== false ? prev.published - 1 : prev.published,
        draft: deletedBlog?.published === false ? prev.draft - 1 : prev.draft,
        views: prev.views - (deletedBlog?.views || 0),
        avgViews: (prev.total - 1) ? Math.round((prev.views - (deletedBlog?.views || 0)) / (prev.total - 1)) : 0
      }));
    }
  };

  const handlePublishToggle = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('blogs')
        .update({ published: newStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating blog status:', error);
        toast.error('Failed to update blog status');
        return;
      }

      setBlogs(prev => prev.map(blog =>
        blog.id === id ? { ...blog, published: newStatus } : blog
      ));

      // Update stats
      setStatsSummary(prev => ({
        ...prev,
        published: newStatus ? prev.published + 1 : prev.published - 1,
        draft: newStatus ? prev.draft - 1 : prev.draft + 1
      }));

      toast.success(`Blog ${newStatus ? 'published' : 'unpublished'} successfully!`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while updating blog status');
    }
  };

  const handleCopy = (blog) => {
    const blogInfo = `
Title: ${blog.title}
Status: ${blog.published !== false ? 'Published' : 'Draft'}
Views: ${blog.views || 0}
Created: ${new Date(blog.created_at).toLocaleDateString()}
Description: ${blog.description || 'No description'}
URL: ${window.location.origin}/blogs/${blog.id}
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
    .filter(blog => {
      const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (blog.description && blog.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'published' && blog.published !== false) ||
        (statusFilter === 'draft' && blog.published === false);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortField === 'title') {
        return sortDirection === 'asc'
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (sortField === 'views') {
        return sortDirection === 'asc'
          ? (a.views || 0) - (b.views || 0)
          : (b.views || 0) - (a.views || 0);
      } else if (sortField === 'published') {
        return sortDirection === 'asc'
          ? (a.published === false ? -1 : 1) - (b.published === false ? -1 : 1)
          : (b.published === false ? -1 : 1) - (a.published === false ? -1 : 1);
      } else {
        // Default to created_at
        return sortDirection === 'asc'
          ? new Date(a.created_at) - new Date(b.created_at)
          : new Date(b.created_at) - new Date(a.created_at);
      }
    });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center text-red-600 text-xl font-semibold">Access denied. Admins only.</div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                Blog Management
              </h1>
              <p className="text-gray-600 mt-1">Create, edit, and manage your blog content</p>
            </div>
            <Link
              to="/admin/blogs/create"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-lg transition-all transform hover:scale-105"
            >
              <Plus size={18} /> Create New Blog
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Blogs</p>
                <h3 className="text-2xl font-bold text-gray-900">{statsSummary.total}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Published</p>
                <h3 className="text-2xl font-bold text-gray-900">{statsSummary.published}</h3>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium">Drafts</p>
                <h3 className="text-2xl font-bold text-gray-900">{statsSummary.draft}</h3>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock size={24} className="text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Total Views</p>
                <h3 className="text-2xl font-bold text-gray-900">{statsSummary.views.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Eye size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-600 text-sm font-medium">Avg Views</p>
                <h3 className="text-2xl font-bold text-gray-900">{statsSummary.avgViews}</h3>
              </div>
              <div className="p-3 bg-indigo-100 rounded-xl">
                <BarChart3 size={24} className="text-indigo-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search blogs by title or description..."
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
              </select>

              <button
                onClick={() => handleSort('created_at')}
                className={`px-4 py-3 rounded-xl border font-medium transition-colors ${sortField === 'created_at'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Date {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('views')}
                className={`px-4 py-3 rounded-xl border font-medium transition-colors ${sortField === 'views'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Views {sortField === 'views' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('published')}
                className={`px-4 py-3 rounded-xl border font-medium transition-colors ${sortField === 'published'
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
              >
                Status {sortField === 'published' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Blogs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBlogs.length > 0 ? (
            filteredBlogs.map(blog => (
              <div key={blog.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{blog.title}</h3>
                      {blog.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{blog.description}</p>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ml-3 ${blog.published !== false
                      ? 'bg-green-100 text-green-800'
                      : 'bg-amber-100 text-amber-800'
                      }`}>
                      {blog.published !== false ? 'Published' : 'Draft'}
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mb-4 gap-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(blog.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {blog.views || 0} views
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/blogs/${blog.id}`}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <Eye size={14} /> View
                    </Link>
                    <button
                      onClick={() => handleCopy(blog)}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Clipboard size={14} /> Copy
                    </button>
                    <Link
                      to={`/admin/blogs/edit/${blog.id}`}
                      className="flex items-center gap-1 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Edit size={14} /> Edit
                    </Link>
                    <button
                      onClick={() => handlePublishToggle(blog.id, blog.published !== false)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${blog.published !== false
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                        : 'bg-green-100 hover:bg-green-200 text-green-700'
                        }`}
                    >
                      {blog.published !== false ? (
                        <><XCircle size={14} /> Unpublish</>
                      ) : (
                        <><CheckCircle size={14} /> Publish</>
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(blog.id)}
                      className="flex items-center gap-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No blogs found' : 'No blogs created yet'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'Get started by creating your first blog post.'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Link
                    to="/admin/blogs/create"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                  >
                    <Plus size={18} /> Create Your First Blog
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results info */}
        {filteredBlogs.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            Showing {filteredBlogs.length} of {blogs.length} blogs
          </div>
        )}
      </div>
    </div>
  );
}