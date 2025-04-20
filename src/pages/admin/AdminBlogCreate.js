import { useContext, useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

const AdminBlogCreate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [description, setDescription] = useState('');

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
      setLoading(false);
    };

    checkAdmin();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { error } = await supabase.from('blogs').insert([
      {
        title: title,
        cover_image_url: coverImageUrl,
        description: description,
        created_by: user.id,
      },
    ]);

    if (error) {
      alert('Error submitting blog');
      console.error(error);
    } else {
      alert('Blog posted successfully!');
      navigate('/blogs');
    }
  };

  if (loading) return <div className="p-4">Checking admin permissions...</div>;
  if (!isAdmin) return <div className="p-4 text-red-600">Access denied. Admins only.</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create a New Blog Post</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
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

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Publish Blog
        </button>
      </form>
    </div>
  );
};

export default AdminBlogCreate;
