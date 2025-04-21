import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AdminAnnouncementSend() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert([{ title: title.trim(), message: message.trim() }]);

      if (error) {
        console.error('Error sending announcement:', error);
        toast.error('Failed to send announcement.');
      } else {
        toast.success('Announcement sent successfully!');
        navigate('/admin/dashboard'); // Redirect to Admin Dashboard after sending
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm transition"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-8 text-center">Send New Announcement</h1>

      <form onSubmit={handleSendAnnouncement} className="space-y-6 bg-white p-6 rounded-xl shadow-lg">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring focus:border-blue-300"
            placeholder="Enter announcement title"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full border rounded-md px-4 py-2 focus:outline-none focus:ring focus:border-blue-300"
            placeholder="Write your announcement here..."
          ></textarea>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
          >
            {loading ? 'Sending...' : 'Send Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
}
