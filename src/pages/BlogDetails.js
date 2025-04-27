import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, Eye, Clock, Share2, Bookmark, Edit, Trash } from 'lucide-react';

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
      navigate('/blogs');
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
          <Link to="/blogs" className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            <ArrowLeft size={16} className="mr-2" />
            Return to Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Navigation Bar */}
      <div className="sticky top-0 z-10 bg-white bg-opacity-90 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/blogs" className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition">
            <ArrowLeft size={18} className="mr-2" />
            Back to Articles
          </Link>
          
          <div className="flex items-center space-x-3">
            <button className="flex items-center p-2 text-gray-600 hover:text-indigo-600 transition">
              <Share2 size={18} />
            </button>
            <button className="flex items-center p-2 text-gray-600 hover:text-indigo-600 transition">
              <Bookmark size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      {blog.cover_image_url && (
        <div className="relative w-full h-64 md:h-96 overflow-hidden">
          <img
            src={blog.cover_image_url}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-50"></div>
        </div>
      )}

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Title and Meta */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">{blog.title}</h1>
          
          <div className="flex flex-col md:flex-row md:items-center text-gray-500 text-sm md:space-x-6">
            <div className="flex items-center mb-2 md:mb-0">
              <Calendar size={16} className="mr-2" />
              <span>{formatDate(blog.created_at)}</span>
            </div>
            
            <div className="flex items-center mb-2 md:mb-0">
              <Clock size={16} className="mr-2" />
              <span>{calculateReadTime(blog.description)}</span>
            </div>
            
            <div className="flex items-center">
              <Eye size={16} className="mr-2" />
              <span>{(blog.views || 0)} views</span>
            </div>
          </div>
        </div>
        
        {/* Article Body */}
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown>{blog.description}</ReactMarkdown>
        </div>
        
        {/* Admin Actions */}
        {isAdmin && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Actions</h3>
            <div className="flex gap-4">
              <Link
                to={`/admin/blogs/edit/${id}`}
                className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition"
              >
                <Edit size={16} className="mr-2" />
                Edit Article
              </Link>

              <button
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
              >
                <Trash size={16} className="mr-2" />
                Delete Article
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Related Articles */}
      {relatedBlogs.length > 0 && (
        <div className="bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">You Might Also Like</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((related) => (
                <Link
                  key={related.id}
                  to={`/blog/${related.id}`}
                  className="group bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition flex flex-col"
                >
                  <div className="relative h-40 overflow-hidden">
                    {related.cover_image_url ? (
                      <img
                        src={related.cover_image_url}
                        alt={related.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-400 flex items-center justify-center">
                        <div className="text-white text-lg">No Image</div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 group-hover:text-indigo-600 transition line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2">
                      {formatDate(related.created_at)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogDetail;