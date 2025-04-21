import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SendAnnouncement() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
      } else {
        setStudents(data || []);
      }
    };

    fetchStudents();
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim() || selectedStudents.length === 0) {
      toast.error('Please fill in all fields and select at least one student.');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('notifications').insert(
        selectedStudents.map(studentId => ({
          recipient_id: studentId,
          title,
          message
        }))
      );

      if (error) throw error;

      toast.success('Announcement sent successfully!');
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Send announcement error:', err.message);
      toast.error('Failed to send announcement.');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (id) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter((studentId) => studentId !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm transition"
        >
          ← Back
        </button>
      </div>

      <h1 className="text-4xl font-bold mb-8 text-center">Send Announcement</h1>

      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Title</label>
          <input
            type="text"
            className="w-full border px-4 py-2 rounded"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter announcement title"
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Message</label>
          <textarea
            rows="4"
            className="w-full border px-4 py-2 rounded"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message..."
          ></textarea>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2 mb-4">Select Students</label>
          <div className="h-64 overflow-y-auto border rounded p-4 grid gap-2">
            {students.map((student) => (
              <label key={student.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={() => toggleStudent(student.id)}
                  className="form-checkbox h-4 w-4"
                />
                {student.first_name} {student.last_name} ({student.email})
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSend}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow transition"
          >
            {loading ? 'Sending...' : 'Send Announcement'}
          </button>
        </div>
      </div>
    </div>
  );
}
