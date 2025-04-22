import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { safeSelect, safeUpdate } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

export default function AdminBlogEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) {
      toast.error('Invalid blog ID.');
      navigate('/admin/blogs/manage');
      return;
    }

    const fetchBlog = async () => {
      const blogData = await safeSelect('blogs', '*', { id });
      if (blogData && blogData.length > 0) {
        setBlog(blogData[0]);
      } else {
        toast.error('Blog not found.');
        navigate('/admin/blogs/manage');
      }
      setLoading(false);
    };

    fetchBlog();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBlog((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!blog.title.trim() || !blog.description.trim()) {
      toast.error('Title and Description are required.');
      return;
    }

    setUpdating(true);

    const result = await safeUpdate('blogs', {
      title: blog.title.trim(),
      cover_image_url: blog.cover_image_url.trim(),
      description: blog.description.trim(),
    }, 'id', id);

    if (result) {
      toast.success('Blog updated successfully!');
      navigate('/admin/blogs/manage');
    }

    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Blog not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Edit Blog Post</h1>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <label className="block mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={blog.title || ''}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
            required
          />
        </div>

        <div>
          <label className="block mb-2">Cover Image URL</label>
          <input
            type="text"
            name="cover_image_url"
            value={blog.cover_image_url || ''}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
          />
        </div>

        <div>
          <label className="block mb-2">Description</label>
          <textarea
            name="description"
            value={blog.description || ''}
            onChange={handleChange}
            className="w-full border rounded px-4 py-2"
            rows="6"
            required
          />
        </div>

        <div className="text-center">
          <Button
            type="submit"
            disabled={updating}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition"
          >
            {updating ? 'Updating...' : 'Update Blog'}
          </Button>
        </div>
      </form>
    </div>
  );
}
