import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Calendar,
    Clock,
    Eye,
    ArrowRight,
    BookOpen,
    TrendingUp,
    ChevronRight,
    FileText,
    Users,
    Globe,
    Sparkles,
    User
} from 'lucide-react';
import { motion } from 'framer-motion';

const BlogHomepageSection = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('blogs')
                    .select('*')
                    .order('views', { ascending: false })
                    .limit(6); // Get top 6 blogs

                if (error) throw error;
                setBlogs(data || []);
            } catch (err) {
                console.error('Error fetching blogs:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const calculateReadTime = (text) => {
        if (!text) return "2 min read";
        const cleanText = cleanDescription(text);
        const wordsPerMinute = 200;
        const wordCount = cleanText.split(/\s+/).length;
        const readTime = Math.ceil(wordCount / wordsPerMinute);
        return `${readTime} min read`;
    };

    const cleanDescription = (text) => {
        if (!text) return '';

        // Remove markdown image syntax: ![alt text](url)
        let cleaned = text.replace(/!\[.*?\]\(.*?\)/g, '');

        // Remove standalone URLs (http/https)
        cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '');

        // Remove extra whitespace and newlines
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        return cleaned;
    };

    const truncateText = (text, maxLength = 120) => {
        if (!text) return '';
        const cleaned = cleanDescription(text);
        return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned;
    };

    if (loading) {
        return (
            <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading latest articles...</p>
                    </div>
                </div>
            </section>
        );
    }

    if (error || blogs.length === 0) {
        return (
            <section className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Articles Yet</h3>
                        <p className="text-gray-600">Check back soon for our latest insights and updates.</p>
                    </div>
                </div>
            </section>
        );
    }

    const featuredBlog = blogs[0];
    const otherBlogs = blogs.slice(1, 5); // Show 4 additional blogs

    return (
        <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Latest Insights
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Stories That Matter
                    </h2>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                        Discover the latest insights, updates, and stories from our community.
                        Stay informed about opportunities, achievements, and impactful initiatives.
                    </p>
                </div>

                {/* Blog Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
                    {blogs.slice(0, 6).map((blog, index) => (
                        <motion.article
                            key={blog.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2"
                        >
                            <Link to={`/blogs/${blog.id}`} className="block">
                                <div className="relative overflow-hidden">
                                    {blog.cover_image_url ? (
                                        <div className="aspect-w-16 aspect-h-10 md:aspect-h-12 lg:aspect-h-10">
                                            <img
                                                src={blog.cover_image_url}
                                                alt={blog.title}
                                                className="w-full h-48 md:h-56 lg:h-48 object-cover group-hover:scale-110 transition-transform duration-700"
                                                loading="lazy"
                                                onError={(e) => {
                                                    console.error('🖼️ Image failed to load:', {
                                                        src: e.target.src,
                                                        blogId: blog.id,
                                                        title: blog.title,
                                                        error: 'Image load failure'
                                                    });

                                                    // Try to detect if it's a Supabase storage URL
                                                    if (e.target.src.includes('supabase')) {
                                                        console.log('🔧 Supabase storage image failed - check:');
                                                        console.log('1. Storage bucket exists and is public');
                                                        console.log('2. RLS policies allow public access');
                                                        console.log('3. CORS settings include your domain');
                                                    }

                                                    // Set a fallback placeholder
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = `
                                                        <div class="h-48 md:h-56 lg:h-48 bg-gradient-to-br from-red-400 via-orange-400 to-yellow-500 flex items-center justify-center">
                                                            <div class="text-center text-white p-6">
                                                                <svg class="w-12 h-12 mx-auto mb-3 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                                                </svg>
                                                                <div class="text-sm font-medium opacity-90">Image Unavailable</div>
                                                                <div class="text-xs opacity-70 mt-1">Production loading issue</div>
                                                            </div>
                                                        </div>
                                                    `;
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-48 md:h-56 lg:h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center">
                                            <div className="text-center text-white p-6">
                                                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-80" />
                                                <div className="text-lg font-medium opacity-90">
                                                    {blog.title.split(' ').slice(0, 3).join(' ')}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    {/* Category Badge */}
                                    <div className="absolute top-4 left-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-800">
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            {blog.category || 'Article'}
                                        </span>
                                    </div>

                                    {/* Read Time */}
                                    <div className="absolute top-4 right-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-black/20 backdrop-blur-sm text-white">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {calculateReadTime(blog.description)}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center text-sm text-gray-500 mb-3">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {formatDate(blog.created_at)}
                                        {blog.views && (
                                            <>
                                                <span className="mx-2">•</span>
                                                <Eye className="w-4 h-4 mr-1" />
                                                {blog.views.toLocaleString()} views
                                            </>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 line-clamp-2">
                                        {blog.title}
                                    </h3>

                                    <p className="text-gray-600 leading-relaxed line-clamp-3 mb-4">
                                        {blog.description}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                                            <span className="mr-2">Read More</span>
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>

                                        {blog.author && (
                                            <div className="flex items-center text-sm text-gray-500">
                                                <User className="w-4 h-4 mr-1" />
                                                {blog.author}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </motion.article>
                    ))}
                </div>

                {/* Call to Action */}
                <div className="text-center">
                    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
                        <div className="max-w-2xl mx-auto">
                            <Globe className="w-12 h-12 text-blue-600 mx-auto mb-6" />
                            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                                Explore All Our Stories
                            </h3>
                            <p className="text-gray-600 text-lg mb-8">
                                Dive deeper into our complete collection of articles, insights, and community updates.
                                Discover stories that inspire, inform, and connect our global community.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    to="/blogs"
                                    className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                >
                                    <BookOpen className="w-5 h-5 mr-2" />
                                    View All Articles
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </Link>
                                <Link
                                    to="/get-involved"
                                    className="inline-flex items-center px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all duration-300"
                                >
                                    <Users className="w-5 h-5 mr-2" />
                                    Join Our Community
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BlogHomepageSection; 