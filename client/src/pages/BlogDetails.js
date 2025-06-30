import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, Eye, Clock, Share2, Bookmark, Edit, Trash } from 'lucide-react';
import '../components/ResponsiveBlogImages.css';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [relatedBlogs, setRelatedBlogs] = useState([]);

  useEffect(() => {
    const fetchBlog = async () => {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching blog:', error);
      } else {
        setBlog(data);

        // Fetch some related blogs
        const { data: relatedData, error: relatedError } = await supabase
          .from('blogs')
          .select('id, title, cover_image_url, created_at')
          .neq('id', id)
          .limit(3);

        if (!relatedError && relatedData) {
          setRelatedBlogs(relatedData);
        }
      }
      setLoading(false);
    };

    fetchBlog();
  }, [id]);

  useEffect(() => {
    const incrementViews = async () => {
      if (!id) return;

      // Fetch current views
      const { data: blogData, error: fetchError } = await supabase
        .from('blogs')
        .select('views')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching current views:', fetchError);
        return;
      }

      const currentViews = blogData?.views || 0;

      // Update views
      const { error: updateError } = await supabase
        .from('blogs')
        .update({ views: currentViews + 1 })
        .eq('id', id);

      if (updateError) {
        console.error('Error updating views:', updateError);
      }
    };

    incrementViews();
  }, [id]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('admin')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setIsAdmin(true);
      }
    };

    checkAdmin();
  }, [user]);

  const handleDelete = async () => {
    const confirm = window.confirm('Are you sure you want to delete this blog?');
    if (!confirm) return;

    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting blog:', error);
    } else {
      alert('Blog deleted successfully!');
      navigate('/');
    }
  };

  const calculateReadTime = (text) => {
    if (!text) return "2 min read";
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-gray-500">Loading article...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-red-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-red-800 mb-2">Article Not Found</h2>
          <p className="text-red-600 mb-6">The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            <ArrowLeft size={16} className="mr-2" />
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Sticky Navigation Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition group">
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Home</span>
          </Link>

          <div className="text-sm text-gray-600">
            {(blog.views || 0).toLocaleString()} views
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - 3 columns on large screens */}
          <div className="lg:col-span-3">
            <article className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* Article Header */}
              <div className="p-6 md:p-8 lg:p-10">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  {blog.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-8">
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-2" />
                    <span>{formatDate(blog.created_at)}</span>
                  </div>

                  <div className="flex items-center">
                    <Clock size={16} className="mr-2" />
                    <span>{calculateReadTime(blog.description)}</span>
                  </div>

                  <div className="flex items-center">
                    <Eye size={16} className="mr-2" />
                    <span>{(blog.views || 0).toLocaleString()} views</span>
                  </div>
                </div>

                {/* Hero Image and Content Side by Side */}
                {blog.cover_image_url ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
                    {/* Cover Image */}
                    <div className="relative overflow-hidden rounded-xl shadow-lg order-2 lg:order-1">
                      <img
                        src={blog.cover_image_url}
                        alt={blog.title}
                        className="w-full h-auto object-cover"
                        style={{ minHeight: '250px', maxHeight: '500px' }}
                      />
                    </div>

                    {/* Description Preview */}
                    <div className="flex flex-col justify-center order-1 lg:order-2">
                      <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">About this Article</h2>
                      <div className="prose prose-base lg:prose-lg">
                        <p className="text-gray-700 leading-relaxed text-sm lg:text-base">
                          {blog.description ? blog.description.substring(0, 250) + (blog.description.length > 250 ? '...' : '') : 'Read on to discover more insights and valuable content.'}
                        </p>
                      </div>

                      {/* Quick Share Actions */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 lg:mt-6">
                        <button
                          onClick={() => navigator.share && navigator.share({
                            title: blog.title,
                            url: window.location.href
                          })}
                          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm lg:text-base"
                        >
                          <Share2 size={16} className="mr-2" />
                          Share Article
                        </button>
                        <button className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition text-sm lg:text-base">
                          <Bookmark size={16} className="mr-2" />
                          Save for Later
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 lg:mb-8">
                    <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 lg:mb-4">About this Article</h2>
                    <p className="text-gray-700 leading-relaxed text-sm lg:text-base">
                      {blog.description ? blog.description.substring(0, 250) + (blog.description.length > 250 ? '...' : '') : 'Read on to discover more insights and valuable content.'}
                    </p>
                  </div>
                )}

                {/* Full Article Content */}
                <div className="prose prose-lg max-w-none blog-content">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-3">Full Article</h2>
                  <ReactMarkdown
                    components={{
                      img: ({ src, alt, ...props }) => (
                        <div className="my-8 rounded-lg overflow-hidden shadow-md">
                          <img
                            src={src}
                            alt={alt}
                            {...props}
                            onLoad={(e) => {
                              const img = e.target;
                              const isLandscape = img.naturalWidth > img.naturalHeight;
                              img.setAttribute('data-orientation', isLandscape ? 'landscape' : 'portrait');
                            }}
                            onError={(e) => {
                              e.target.setAttribute('data-error', 'true');
                            }}
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )
                    }}
                  >
                    {blog.description}
                  </ReactMarkdown>
                </div>

                {/* Admin Actions */}
                {isAdmin && (
                  <div className="mt-12 pt-8 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Actions</h3>
                    <div className="flex gap-4">
                      <Link
                        to={`/admin/blogs/edit/${id}`}
                        className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                      >
                        <Edit size={16} className="mr-2" />
                        Edit Article
                      </Link>

                      <button
                        onClick={handleDelete}
                        className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        <Trash size={16} className="mr-2" />
                        Delete Article
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          </div>

          {/* Sidebar - 1 column on large screens */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Table of Contents or Reading Progress could go here */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Article Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reading time:</span>
                    <span className="font-medium">{calculateReadTime(blog.description)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Views:</span>
                    <span className="font-medium">{(blog.views || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Published:</span>
                    <span className="font-medium">{formatDate(blog.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Related Articles */}
              {relatedBlogs.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Related Articles</h3>
                  <div className="space-y-4">
                    {relatedBlogs.map((related) => (
                      <Link
                        key={related.id}
                        to={`/blogs/${related.id}`}
                        className="group block"
                      >
                        <div className="flex space-x-3">
                          {related.cover_image_url ? (
                            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                              <img
                                src={related.cover_image_url}
                                alt={related.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                          ) : (
                            <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg"></div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition line-clamp-2 text-sm">
                              {related.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(related.created_at)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter Signup */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Stay Updated</h3>
                <p className="text-gray-600 text-sm mb-4">Get the latest articles and updates from WatanHub.</p>
                <Link
                  to="/get-involved"
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Join Community
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;