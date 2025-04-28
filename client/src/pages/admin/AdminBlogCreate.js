import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeInsert, safeSelect } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function AdminBlogCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!user) return;

    const checkAdmin = async () => {
      const adminData = await safeSelect('admin', '*', { id: user.id });
      if (adminData && adminData.length > 0) {
        setIsAdmin(true);
      } else {
        toast.error('Access denied. Admins only.');
      }
      setLoading(false);
    };

    checkAdmin();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error('Title and Description are required.');
      return;
    }

    const payload = [{
      title: title.trim(),
      cover_image_url: coverImageUrl.trim(),
      description: description.trim(),
      created_by: user.id,
    }];

    const result = await safeInsert('blogs', payload);

    if (result) {
      toast.success('Blog posted successfully!');
      navigate('/admin/blogs/manage');
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Checking permissions...</div>;
  }

  if (!isAdmin) {
    return <div className="p-4 text-center text-red-600">Access denied. Admins only.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Create New Blog Post</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter blog title"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Cover Image URL</label>
          <input
            type="text"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter image URL (optional)"
          />
        </div>

        <div>
          <label className="block mb-1">Description (Markdown Supported)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded h-48"
            placeholder="Enter blog description"
            required
          />
        </div>

        <div>
          <label className="block mb-1">Live Preview</label>
          <div className="prose border p-4 rounded bg-white">
            <ReactMarkdown>{description || '*Start typing to preview*'}</ReactMarkdown>
          </div>
        </div>

        <div className="text-right">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Publish
          </button>
        </div>
      </form>
    </div>
  );
}
