import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Loader, Bell, MessageSquare, User, Calendar, ChevronRight, BookOpen, AlignLeft
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [assignedMentor, setAssignedMentor] = useState(null);
  const [mentorNotes, setMentorNotes] = useState([]);

  useEffect(() => {
    if (!user) return;

    let notesCleanup = null;

    const fetchMentor = async () => {
      const { data: mentorStudentData, error: mentorStudentError } = await supabase
        .from('mentor_student')
        .select('mentor_id')
        .eq('student_id', user.id)
        .maybeSingle();

      console.log("User ID:", user.id);
      console.log("mentor_student data:", mentorStudentData);

      if (mentorStudentError || !mentorStudentData?.mentor_id) {
        console.error('Error fetching mentor_student:', mentorStudentError || 'No mentor assigned');
        return;
      }

      const { data: mentor, error: mentorError } = await supabase
        .from('mentors')
        .select('user_id, full_name, email, languages, bio')
        .eq('user_id', mentorStudentData.mentor_id)
        .maybeSingle();

      console.log("Mentor profile:", mentor);

      if (mentorError) {
        console.error('Error fetching mentor:', mentorError);
      } else {
        setAssignedMentor(mentor);

        // Fetch mentor notes once we have the mentor
        notesCleanup = await fetchMentorNotes(mentorStudentData.mentor_id, user.id);
      }
    };

    fetchMentor();

    return () => {
      if (notesCleanup) notesCleanup();
    };
  }, [user]);

  const fetchMentorNotes = async (mentorId, studentId) => {
    try {
      const { data, error } = await supabase
        .from('mentor_notes')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMentorNotes(data || []);

      // Subscribe to real-time updates for mentor notes
      const notesChannel = supabase
        .channel('mentor-notes-changes')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'mentor_notes',
            filter: `student_id=eq.${studentId}`
          },
          ({ new: newNote }) => {
            setMentorNotes(prev => [newNote, ...prev]);
            // Show toast notification for new notes
            toast.success('New note from your mentor!', {
              description: newNote.content.length > 50
                ? `${newNote.content.substring(0, 50)}...`
                : newNote.content
            });
          }
        )
        .subscribe();

      return () => supabase.removeChannel(notesChannel);

    } catch (error) {
      console.error('Error fetching mentor notes:', error.message);
      return () => { }; // Return empty cleanup function in case of error
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, student_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfileData(data);
      }
    };

    fetchProfile();
  }, [user]);



  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setAnnouncements(data);
      setLoading(false);
    };
    fetchAnnouncements();

    const channel = supabase
      .channel('realtime-announcements')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' },
        ({ new: row }) => setAnnouncements(prev => [row, ...prev]))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'announcements' },
        ({ new: row }) => setAnnouncements(prev => prev.map(a => (a.id === row.id ? row : a))))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'announcements' },
        ({ old }) => setAnnouncements(prev => prev.filter(a => a.id !== old.id)))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-white rounded-lg shadow-sm p-8 flex flex-col items-center">
          <Loader className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md p-6 sm:p-8 mb-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <div className="mb-8">
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-lg transition"
              >
                ← Back to Home
              </Link>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">
              {profileData
                ? `Welcome, ${profileData.first_name} ${profileData.last_name || ''}!`
                : 'Welcome!'}
            </h1>
            {profileData?.student_id && (
              <p className="mt-1 text-indigo-100 text-sm sm:text-base">
                Student ID: <span className="font-semibold">{profileData.student_id}</span>
              </p>
            )}

            <p className="mt-2 text-indigo-100">Here's what's happening today</p>
          </div>
          <Link to="/profile" className="mt-4 sm:mt-0 flex items-center bg-white bg-opacity-20 hover:bg-opacity-30 transition px-4 py-2 rounded-lg">
            <User size={18} className="mr-2" />
            <span>My Profile</span>
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar size={20} className="mr-2 text-indigo-600" />
              Quick Stats
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-500">Announcements</div>
                <div className="text-2xl font-semibold text-gray-800">{announcements.length}</div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <div className="text-sm text-indigo-700">Today's Date</div>
                <div className="text-xl font-semibold text-indigo-900">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric'
                  })}
                </div>
              </div>
              {assignedMentor && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-700">Mentor Notes</div>
                  <div className="text-2xl font-semibold text-green-900">{mentorNotes.length}</div>
                </div>
              )}
              <Link to="/resources" className="block mt-4 bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex justify-between items-center transition">
                <span className="font-medium text-gray-800">Resources</span>
                <ChevronRight size={18} className="text-gray-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Bell size={20} className="mr-2 text-indigo-600" />
              Announcements
            </h2>
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <MessageSquare size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">No announcements yet.</p>
                  <p className="text-sm text-gray-400 mt-1">Check back later for updates.</p>
                </div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="bg-white border border-gray-100 hover:border-indigo-200 rounded-lg p-5 shadow-sm hover:shadow transition group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-indigo-700 group-hover:text-indigo-800">{a.title}</h3>
                      <div className="text-xs text-gray-400 mt-1 sm:mt-0 flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {formatDate(a.created_at)} at {formatTime(a.created_at)}
                      </div>
                    </div>
                    <p className="text-gray-700">{a.message}</p>
                    {a.cta_link && (
                      <div className="mt-3 text-right">
                        <Link to={a.cta_link} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center justify-end">
                          <span>Learn more</span>
                          <ChevronRight size={16} className="ml-1" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mentor */}
      {assignedMentor && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <User size={20} className="mr-2 text-indigo-600" />
            Your Assigned Mentor
          </h2>
          <div className="flex items-start space-x-4">
            <div className="h-14 w-14 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xl font-medium">
              {assignedMentor.full_name?.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">{assignedMentor.full_name}</p>
              <p className="text-sm text-gray-600 mb-2">{assignedMentor.email}</p>
              <p className="text-sm text-gray-500">
                <span className="font-medium text-indigo-600">Languages:</span> {assignedMentor.languages?.join(', ') || 'N/A'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                <span className="font-medium text-indigo-600">Bio:</span> {assignedMentor.bio || 'No bio available.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mentor Notes */}
      {assignedMentor && (
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <BookOpen size={20} className="mr-2 text-indigo-600" />
            Notes from Your Mentor
          </h2>

          {mentorNotes.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <AlignLeft size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No notes from your mentor yet.</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for updates from your mentor.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mentorNotes.map((note) => (
                <div key={note.id} className="bg-indigo-50 border border-indigo-100 rounded-lg p-5 shadow-sm">
                  <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                  <div className="mt-2 text-right text-xs text-gray-500">
                    {formatDate(note.created_at)} at {formatTime(note.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Courses', 'Assignments', 'Resources'].map((item, index) => (
            <Link key={index} to={`/${item.toLowerCase()}`} className="bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 rounded-xl p-6 text-center transition shadow-sm hover:shadow flex flex-col items-center justify-center">
              <div className="bg-white rounded-full p-3 shadow-sm mb-3">
                <div className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center text-indigo-600">
                  {index === 0 && <Calendar size={20} />}
                  {index === 1 && <MessageSquare size={20} />}
                  {index === 2 && <User size={20} />}
                </div>
              </div>
              <h3 className="font-semibold text-gray-800">{item}</h3>
              <p className="text-sm text-gray-500 mt-1">View your {item.toLowerCase()}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
