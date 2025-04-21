import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation, Link } from 'react-router-dom';
import { FileText, ChevronRight, Eye, Clock } from 'lucide-react';

export default function EnhancedBlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const featuredRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('blogs')
          .select('*')
          .order('created_at', { ascending: false });

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
        const opacity = Math.max(0, Math.min(1, 1 - (scrollPosition - 100) / 300));
        featuredRef.current.style.transform = `translateY(${scrollPosition * 0.2}px)`;
        featuredRef.current.style.opacity = opacity;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const featuredBlog = blogs[0];

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
    {location.pathname.startsWith('/blogs') && location.pathname === '/blogs' && (
  <div className="max-w-6xl mx-auto px-4 py-6">
    <Link
      to="/"
      className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition duration-300"
    >
      ← Back to Home
    </Link>
  </div>
)}

      {/* Featured Post */}
      {featuredBlog && (
        <div
          className="relative h-96 bg-gray-100 overflow-hidden"
          ref={featuredRef}
        >
          {featuredBlog.cover_image_url && (
            <div className="absolute inset-0 opacity-20">
              <img
                src={featuredBlog.cover_image_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-30" />
          <div className="relative max-w-6xl mx-auto h-full flex items-center px-4">
            <div className="max-w-lg">
              <span className="inline-block px-3 py-1 bg-white bg-opacity-70 text-gray-800 rounded-full text-xs mb-4">
                Featured Post
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">{featuredBlog.title}</h1>
              <p className="text-gray-700 mb-6">
                {featuredBlog.description
                  ? `${featuredBlog.description.substring(0, 120)}...`
                  : "Check out our featured blog post with the latest insights and trends."}
              </p>
              <Link
                to={`/blog/${featuredBlog.id}`}
                className="px-6 py-3 bg-white bg-opacity-90 text-gray-800 rounded-lg font-medium flex items-center w-fit hover:bg-gray-200 transition-colors duration-300"
              >
                Read Article
                <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Blog List Section */}
      <div className="max-w-6xl mx-auto px-4 py-16" ref={scrollRef}>
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-gray-800 text-center">
          Latest Articles
        </h2>


        {/* Grid of Blog Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog, index) => (
            <Link
              to={`/blog/${blog.id}`}
              key={blog.id}
              className="group bg-white bg-opacity-90 rounded-xl overflow-hidden shadow hover:shadow-lg transition-all duration-300 flex flex-col"
              style={{
                transform: `translateY(${index * 5}px)`,
                opacity: 0,
                animation: `fadeIn 0.5s ease-out ${index * 0.1}s forwards`
              }}
            >
              <div className="relative h-48 overflow-hidden">
                {blog.cover_image_url ? (
                  <img
                    src={blog.cover_image_url}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center">
                    <FileText size={32} className="text-white" />
                  </div>
                )}
              </div>

              <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-xl font-bold mb-2 text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                  {blog.title}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {blog.description
                    ? blog.description.substring(0, 100) + '...'
                    : "Read this interesting article to learn more about the topic."}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-200 flex items-center justify-between text-gray-500 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{formatMinutesAgo(blog.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Eye size={14} />
                    <span>{blog.views || 0}</span>
                  </div>
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
