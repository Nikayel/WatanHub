import { useState } from 'react';
import { createBlog } from '../services/blogsService';

function AdminCreateBlog() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await createBlog({ title, description, coverImageUrl });
      setSuccess(true);
      setTitle('');
      setDescription('');
      setCoverImageUrl('');
    } catch (error) {
      console.error('Error creating blog:', error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Create New Blog Post</h1>
      {success && <p className="text-green-600 mb-4">Blog posted successfully!</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Cover Image URL"
          value={coverImageUrl}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full p-2 border rounded h-40"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Posting...' : 'Post Blog'}
        </button>
      </form>
    </div>
  );
}

export default AdminCreateBlog;
