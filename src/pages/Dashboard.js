import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching announcements:', error);
      } else {
        setAnnouncements(data);
      }
    };

    fetchAnnouncements();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-8 text-center">Dashboard</h1>

      <div className="space-y-6">
        {announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div 
              key={announcement.id}
              className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
            >
              <h2 className="text-2xl font-bold text-indigo-600">{announcement.title}</h2>
              <p className="mt-2 text-gray-700">{announcement.content}</p>
              <p className="mt-2 text-sm text-gray-400">
                Sent: {new Date(announcement.created_at).toLocaleString()}
              </p>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500">No announcements yet.</p>
        )}
      </div>
    </div>
  );
}
