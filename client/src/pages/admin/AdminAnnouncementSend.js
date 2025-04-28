import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { safeInsert } from '../../lib/supabase'; // using our safe util

export default function AdminAnnouncementSend() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();

    if (!title.trim() || !message.trim()) {
      toast.error('Title and Message are required.');
      return;
    }

    setLoading(true);

    const result = await safeInsert('announcements', [{ title: title.trim(), message: message.trim() }]);
    
    if (result) {
      toast.success('Announcement sent successfully!');
      navigate('/admin/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold text-center mb-8">Send New Announcement</h1>

      <form onSubmit={handleSendAnnouncement} className="bg-white p-6 rounded-xl shadow space-y-6">
        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border px-4 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
            placeholder="Enter title"
            required
          />
        </div>

        <div>
          <label className="block mb-2 text-sm font-medium text-gray-700">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full border px-4 py-2 rounded focus:outline-none focus:ring focus:border-blue-300"
            placeholder="Enter announcement message"
            required
          ></textarea>
        </div>

        <div className="text-right">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
