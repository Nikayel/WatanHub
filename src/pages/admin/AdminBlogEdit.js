import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

export default function AdminBlogEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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

  const handleChange = (e) => {
    setBlog({
      ...blog,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const { error } = await supabase
      .from('blogs')
      .update({
        title: blog.title,
        cover_image_url: blog.cover_image_url,
        description: blog.description,
      })
      .eq('id', id);

    setUpdating(false);

    if (error) {
      console.error('Error updating blog:', error);
      alert('Failed to update blog. Please try again.');
    } else {
      toast.success('Blog updated successfully!');
      navigate('/admin/blogs/manage'); // or wherever you list/manage blogs
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
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
  console.log('Blog:', blog);
console.log('Loading:', loading);
console.log('ID from URL:', id);


  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Edit Blog</h1>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={blog.title || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Cover Image URL</label>
          <input
            type="text"
            name="cover_image_url"
            value={blog.cover_image_url || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={blog.description || ''}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
            rows="4"
          />
        </div>

        <div className="text-center">
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update Blog'}
          </Button>
        </div>
      </form>
    </div>
  );
}
