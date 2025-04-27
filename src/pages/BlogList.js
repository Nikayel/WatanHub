import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation, Link } from 'react-router-dom';
import { FileText, ChevronRight, Eye, Clock, Bookmark } from 'lucide-react';

export default function EnhancedBlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const featuredRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .order('views', { ascending: false });

        if (error) throw error;
        setBlogs(data);
      } catch (error) {
        console.error("Error fetching blogs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();

    const handleScroll = () => {
      const scrollPosition = window.scrollY;
    
      if (featuredRef.current) {
        const fadeStart = 500;
        const fadeDistance = 800;
        const opacity = Math.max(0, Math.min(1, 1 - (scrollPosition - fadeStart) / fadeDistance));
        featuredRef.current.style.opacity = opacity;
        featuredRef.current.style.transform = `translateY(${scrollPosition * 0.08}px)`;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const featuredBlog = blogs[0];
  const trendingBlogs = blogs.slice(1, 4);
  const remainingBlogs = blogs.slice(4);

  const formatMinutesAgo = (dateString) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const calculateReadTime = (text) => {
    if (!text) return "2 min read";
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return `${readTime} min read`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div id="next-section"  className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      {location.pathname.startsWith('/blogs') && location.pathname === '/blogs' && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 bg-white shadow-sm hover:bg-gray-50 text-gray-800 text-sm font-medium rounded-full transition duration-300"
          >
            ← Back to Home
          </Link>
        </div>
      )}

      {/* Featured Post - Full-width Hero */}
      {featuredBlog && (
        <div
          ref={featuredRef}
          className="relative overflow-hidden bg-gradient-to-r from-indigo-900 to-purple-900 text-white"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black to-transparent opacity-70"></div>
            {featuredBlog.cover_image_url && (
              <img
                src={featuredBlog.cover_image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-28 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="w-full md:w-3/5">
                <div className="flex items-center space-x-4 mb-6">
                  <span className="inline-flex items-center px-3 py-1 bg-indigo-500 bg-opacity-30 text-indigo-100 backdrop-blur-sm rounded-full text-xs">
                    <Bookmark size={14} className="mr-1" />
                    Featured Article
                  </span>
                  <span className="text-indigo-200 text-sm flex items-center">
                    <Clock size={14} className="mr-1" />
                    {calculateReadTime(featuredBlog.description)}
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">{featuredBlog.title}</h1>
                
                <p className="text-indigo-100 mb-8 text-lg max-w-lg">
                  {featuredBlog.description
                    ? `${featuredBlog.description.substring(0, 140)}...`
                    : "Dive into our featured article with the latest insights, trends, and exclusive content."}
                </p>
                
                <Link
                  to={`/blog/${featuredBlog.id}`}
                  className="group inline-flex items-center px-6 py-3 bg-white text-indigo-900 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:transform hover:scale-105"
                >
                  Read Full Article
                  <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              <div className="hidden md:block w-2/5 relative">
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-600 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-12 w-48 h-48 bg-purple-600 rounded-full opacity-20 blur-3xl"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trending Section */}
      {trendingBlogs.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800">
            Trending Now
          </h2>
          <p className="text-gray-500 mb-8">The most popular articles this week</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trendingBlogs.map((blog, index) => (
              <Link
                to={`/blog/${blog.id}`}
                key={blog.id}
                className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col transform hover:-translate-y-1"
              >
                <div className="relative h-48 overflow-hidden">
                  {blog.cover_image_url ? (
                    <img
                      src={blog.cover_image_url}
                      alt={blog.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center">
                      <FileText size={32} className="text-white" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex items-center space-x-2">
                    <span className="px-2 py-1 bg-black bg-opacity-70 text-white text-xs rounded-md backdrop-blur-sm">
                      #{index + 1} Trending
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold mb-2 text-gray-800 group-hover:text-indigo-600 transition-colors duration-300 line-clamp-2">
                    {blog.title}
                  </h3>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {blog.description
                      ? blog.description.substring(0, 100) + '...'
                      : "Read this trending article to discover valuable insights."}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-gray-500 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{formatMinutesAgo(blog.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      <span>{blog.views || 0} views</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Blog List */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-1 text-gray-800">
              Latest Articles
            </h2>
            <p className="text-gray-500">Stay updated with our newest content</p>
          </div>
          
          {/* Could add category filters here */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {remainingBlogs.map((blog, index) => (
            <Link
              to={`/blog/${blog.id}`}
              key={blog.id}
              className="group flex flex-col rounded-lg overflow-hidden transform transition duration-500"
              style={{
                opacity: 0,
                animation: `fadeIn 0.5s ease-out ${index * 0.1}s forwards`
              }}
            >
              <div className="relative h-48 overflow-hidden rounded-lg shadow-md">
                {blog.cover_image_url ? (
                  <img
                    src={blog.cover_image_url}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <FileText size={32} className="text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                
                <div className="absolute bottom-3 left-3 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <span className="inline-flex items-center px-2 py-1 bg-white text-gray-800 text-xs font-medium rounded">
                    Read article
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Clock size={12} className="mr-1" />
                  <span>{calculateReadTime(blog.description)}</span>
                  <span className="mx-2">•</span>
                  <span>{formatMinutesAgo(blog.created_at)}</span>
                </div>
                
                <h3 className="font-bold text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors duration-300">
                  {blog.title}
                </h3>

                <p className="text-gray-600 text-sm line-clamp-2">
                  {blog.description
                    ? blog.description.substring(0, 100) + '...'
                    : "Explore this article to learn more about the topic."}
                </p>
              </div>
              
              <div className="mt-auto pt-3 flex items-center justify-between text-gray-500 text-xs">
                <div className="flex items-center gap-1">
                  <Eye size={14} />
                  <span>{blog.views || 0} views</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {blogs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No articles found.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}