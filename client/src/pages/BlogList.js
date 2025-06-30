import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation, Link } from 'react-router-dom';
import { FileText, ChevronRight, Eye, Clock, Bookmark, TrendingUp, Calendar, BookOpen } from 'lucide-react';

export default function EnhancedBlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const featuredRef = useRef(null);
  const blogRefs = useRef(Array(10).fill().map(() => ({ current: null })));
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

    // Enhanced scroll effect that keeps content visible longer
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;

      // Create parallax effect for featured blog
      if (featuredRef.current) {
        const featuredRect = featuredRef.current.getBoundingClientRect();
        const featuredVisibility = 1 - Math.max(0, Math.min(1, -featuredRect.top / (windowHeight * 0.8)));

        featuredRef.current.style.opacity = featuredVisibility;
        featuredRef.current.style.transform = `translateY(${scrollPosition * 0.08}px)`;
      }

      // Apply scroll effects to individual blog posts
      blogRefs.current.forEach((ref, index) => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const distanceFromTop = rect.top;

          // Calculate visibility - appears when entering viewport and stays visible until fully scrolled past
          // Apple-style persistence where content fades in and stays visible until scrolled well past
          const visibilityThreshold = windowHeight * 0.9;

          // Item becomes visible when entering the viewport and stays fully visible until it's 20% out
          const visibility = distanceFromTop <= visibilityThreshold ? 1 :
            1 - Math.min(1, (distanceFromTop - visibilityThreshold) / (windowHeight * 0.2));

          // Apply scale effect
          const scale = 0.95 + (0.05 * Math.min(1, visibility));
          const translateY = (1 - visibility) * 30;

          ref.current.style.opacity = visibility;
          ref.current.style.transform = `translateY(${translateY}px) scale(${scale})`;
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    // Trigger initial animation
    setTimeout(handleScroll, 100);

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

  const formatDate = (dateString) => {
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

  const cleanText = (text) => {
    // Remove markdown and HTML, clean up text
    if (!text) return '';
    return text.replace(/[#*`_~\[\]()]/g, '').replace(/\n+/g, ' ').trim();
  };

  const loadMore = async () => {
    setLoadingMore(true);
    // Implement load more logic here
    setTimeout(() => {
      setLoadingMore(false);
      setHasMore(false); // For demo purposes
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              WatanHub Stories
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
              Discover insights, updates, and inspiring stories from our community
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Featured Article */}
        {featuredBlog && (
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-2xl font-bold text-gray-900">Featured Article</h2>
            </div>

            <Link
              to={`/blogs/${featuredBlog.id}`}
              className="group block bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="grid md:grid-cols-2 gap-0">
                <div className="relative h-64 md:h-full overflow-hidden">
                  {featuredBlog.cover_image_url ? (
                    <img
                      src={featuredBlog.cover_image_url}
                      alt={featuredBlog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <FileText className="w-16 h-16 text-white opacity-80" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent md:hidden"></div>
                </div>

                <div className="p-6 md:p-8 lg:p-10 flex flex-col justify-center">
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(featuredBlog.created_at)}
                    <span className="mx-2">•</span>
                    <Clock className="w-4 h-4 mr-1" />
                    {calculateReadTime(featuredBlog.description)}
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                    {featuredBlog.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed mb-6 line-clamp-3">
                    {cleanText(featuredBlog.description).substring(0, 200)}...
                  </p>

                  <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                    <span className="mr-2">Read Full Story</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {(featuredBlog ? blogs.slice(1) : blogs).map((blog, index) => (
            <Link
              key={blog.id}
              to={`/blogs/${blog.id}`}
              ref={blogRefs.current[index]}
              className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
            >
              <div className="relative overflow-hidden">
                {blog.cover_image_url ? (
                  <div className="aspect-video">
                    <img
                      src={blog.cover_image_url}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                    <FileText className="w-12 h-12 text-white opacity-80" />
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-800">
                    Article
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center text-xs text-gray-500 mb-3">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatMinutesAgo(blog.created_at)}
                  <span className="mx-2">•</span>
                  <Clock className="w-3 h-3 mr-1" />
                  {calculateReadTime(blog.description)}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {blog.title}
                </h3>

                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                  {blog.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    <span className="mr-1">Read More</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>

                  {blog.views && (
                    <div className="flex items-center text-xs text-gray-400">
                      <Eye className="w-3 h-3 mr-1" />
                      {blog.views.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && blogs.length > 0 && (
          <div className="text-center mt-12">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Loading...
                </>
              ) : (
                <>
                  Load More Articles
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        )}

        {/* Empty State */}
        {blogs.length === 0 && !loading && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Articles Yet</h3>
            <p className="text-gray-600">Check back soon for our latest insights and stories.</p>
          </div>
        )}
      </div>
    </div>
  );
}