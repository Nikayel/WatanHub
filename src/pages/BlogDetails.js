import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import ReactMarkdown from 'react-markdown';

const BlogDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
      }
      setLoading(false);
    };

    fetchBlog();
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="p-4 text-center text-red-500">
        Blog not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      <Link to="/blogs" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← Back to Blogs
      </Link>

      <h1 className="text-3xl sm:text-4xl font-bold mb-6">{blog.title}</h1>

      {blog.cover_image_url && (
        <img
          src={blog.cover_image_url}
          alt={blog.title}
          className="w-full h-60 sm:h-80 object-cover rounded-lg shadow mb-6"
        />
      )}

      <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
        <ReactMarkdown>{blog.description}</ReactMarkdown>
      </div>

      <p className="text-gray-500 text-xs sm:text-sm mt-10">
        Posted on {new Date(blog.created_at).toLocaleDateString()}
      </p>

      {isAdmin && (
        <div className="flex gap-4 mt-8">
          <Link
            to={`/admin/blogs/edit/${id}`}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Edit Blog
          </Link>

          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete Blog
          </button>
        </div>
      )}
    </div>
  );
};

export default BlogDetail;
