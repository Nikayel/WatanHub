import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import ReactMarkdown from 'react-markdown';

const AdminBlogEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

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
        setTitle(data.title);
        setCoverImageUrl(data.cover_image_url || '');
        setDescription(data.description);
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

  const handleUpdate = async (e) => {
    e.preventDefault();

    const { error } = await supabase
      .from('blogs')
      .update({
        title,
        cover_image_url: coverImageUrl,
        description,
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating blog:', error);
    } else {
      alert('Blog updated successfully!');
      navigate(`/blogs/${id}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="p-4 text-center text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Edit Blog</h1>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Cover Image URL</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Description (Markdown Supported)</label>
          <textarea
            className="w-full p-2 border rounded h-48"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-1">Live Preview</label>
          <div className="prose border p-4 rounded max-w-none bg-white">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        </div>

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Update Blog
        </button>
      </form>
    </div>
  );
};

export default AdminBlogEdit;
