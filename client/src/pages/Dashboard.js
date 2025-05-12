import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { getStudentProfile } from '../lib/UserRoles';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Loader, Bell, MessageSquare, User, Calendar, ChevronRight, BookOpen, AlignLeft,
  CheckCircle, Clock, FileText, CheckSquare, AlertTriangle
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [assignedMentor, setAssignedMentor] = useState(null);
  const [mentorNotes, setMentorNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingNotes, setPendingNotes] = useState(0);
  const [acknowledgedNotes, setAcknowledgedNotes] = useState(0);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

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
      console.log("Fetching notes for mentorId:", mentorId, "studentId:", studentId);

      const { data, error } = await supabase
        .from('mentor_notes')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error in fetchMentorNotes query:', error);
        throw error;
      }

      console.log("Fetched mentor notes:", data?.length || 0, "notes");
      setMentorNotes(data || []);

      // Calculate pending and acknowledged notes
      const pending = data?.filter(note => !note.acknowledged).length || 0;
      const acknowledged = data?.filter(note => note.acknowledged).length || 0;

      console.log("Pending notes:", pending, "Acknowledged notes:", acknowledged);
      setPendingNotes(pending);
      setAcknowledgedNotes(acknowledged);

      // Find upcoming deadlines (next 7 days)
      const now = new Date();
      const sevenDaysLater = new Date(now);
      sevenDaysLater.setDate(now.getDate() + 7);

      const upcoming = data?.filter(note => {
        if (!note.deadline) return false;
        const deadlineDate = new Date(note.deadline);
        return deadlineDate >= now && deadlineDate <= sevenDaysLater && !note.acknowledged;
      }) || [];

      console.log("Upcoming deadlines:", upcoming.length);
      setUpcomingDeadlines(upcoming);

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
            console.log("Received new note:", newNote);
            setMentorNotes(prev => [newNote, ...prev]);

            // Update pending notes count
            setPendingNotes(prev => prev + 1);

            // Check if it has an upcoming deadline
            if (newNote.deadline) {
              const deadlineDate = new Date(newNote.deadline);
              if (deadlineDate >= now && deadlineDate <= sevenDaysLater) {
                setUpcomingDeadlines(prev => [newNote, ...prev]);
              }
            }

            // Show toast notification for new notes
            toast.success('New note from your mentor!', {
              description: `Task: ${newNote.task} - ${newNote.description.length > 30
                ? `${newNote.description.substring(0, 30)}...`
                : newNote.description}`
            });
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'mentor_notes',
            filter: `student_id=eq.${studentId}`
          },
          ({ new: updatedNote }) => {
            console.log("Received updated note:", updatedNote);
            setMentorNotes(prev => prev.map(note =>
              note.id === updatedNote.id ? updatedNote : note
            ));

            // Update counts if acknowledgment status changed
            if (updatedNote.acknowledged) {
              setPendingNotes(prev => Math.max(0, prev - 1));
              setAcknowledgedNotes(prev => prev + 1);

              // Remove from upcoming deadlines if now acknowledged
              setUpcomingDeadlines(prev => prev.filter(note => note.id !== updatedNote.id));
            }
          }
        )
        .subscribe();

      console.log("Successfully subscribed to real-time updates");
      return () => {
        console.log("Cleaning up notes subscription");
        supabase.removeChannel(notesChannel);
      };

    } catch (error) {
      console.error('Error fetching mentor notes:', error.message);
      return () => { }; // Return empty cleanup function in case of error
    }
  };

  const acknowledgeNote = async (noteId) => {
    try {
      console.log("Acknowledging note:", noteId);

      const { error } = await supabase
        .from('mentor_notes')
        .update({
          acknowledged: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', noteId);

      if (error) {
        console.error("Error acknowledging note:", error);
        throw error;
      }

      // Update local state
      setMentorNotes(prev => prev.map(note =>
        note.id === noteId ? { ...note, acknowledged: true, updated_at: new Date().toISOString() } : note
      ));

      // Update counts
      setPendingNotes(prev => Math.max(0, prev - 1));
      setAcknowledgedNotes(prev => prev + 1);

      // Update upcoming deadlines
      setUpcomingDeadlines(prev => prev.filter(note => note.id !== noteId));

      toast.success('Task marked as complete');
      console.log("Note successfully acknowledged");
    } catch (error) {
      console.error('Error acknowledging note:', error.message);
      toast.error('Failed to complete task');
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const data = await getStudentProfile(user.id);

      if (data) {
        setProfileData(data);
      } else {
        console.error('Error fetching student profile');
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

  // Function to get days remaining until deadline
  const getDaysRemaining = (deadlineString) => {
    if (!deadlineString) return null;

    const deadline = new Date(deadlineString);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Function to get appropriate status badge color
  const getStatusBadgeColor = (daysRemaining) => {
    if (daysRemaining <= 1) return 'bg-red-100 text-red-800';
    if (daysRemaining <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-blue-100 text-blue-800';
  };

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

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-4 px-4 text-center font-medium text-sm ${activeTab === 'overview'
              ? 'text-indigo-600 border-b-2 border-indigo-500'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-4 px-4 text-center font-medium text-sm ${activeTab === 'tasks'
              ? 'text-indigo-600 border-b-2 border-indigo-500'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            Tasks & Notes
            {pendingNotes > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {pendingNotes}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 py-4 px-4 text-center font-medium text-sm ${activeTab === 'announcements'
              ? 'text-indigo-600 border-b-2 border-indigo-500'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            Announcements
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
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
                    <>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-700">Mentor Notes</div>
                        <div className="text-2xl font-semibold text-green-900">{mentorNotes.length}</div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-sm text-yellow-700">Pending Tasks</div>
                        <div className="text-2xl font-semibold text-yellow-900">{pendingNotes}</div>
                      </div>
                    </>
                  )}
                  <Link to="/resources" className="block mt-4 bg-gray-50 hover:bg-gray-100 p-4 rounded-lg flex justify-between items-center transition">
                    <span className="font-medium text-gray-800">Resources</span>
                    <ChevronRight size={18} className="text-gray-400" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Announcements Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                    <Bell size={20} className="mr-2 text-indigo-600" />
                    Latest Announcements
                  </h2>
                  <button
                    onClick={() => setActiveTab('announcements')}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {announcements.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <MessageSquare size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">No announcements yet.</p>
                      <p className="text-sm text-gray-400 mt-1">Check back later for updates.</p>
                    </div>
                  ) : (
                    announcements.slice(0, 2).map((a) => (
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

          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Clock size={20} className="mr-2 text-indigo-600" />
                Upcoming Deadlines
              </h2>
              <div className="space-y-4">
                {upcomingDeadlines.map((note) => {
                  const daysRemaining = getDaysRemaining(note.deadline);
                  const badgeColor = getStatusBadgeColor(daysRemaining);

                  return (
                    <div key={note.id} className="bg-white border border-gray-100 hover:border-indigo-200 rounded-lg p-5 shadow-sm hover:shadow transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center mb-2">
                            <h3 className="text-lg font-semibold text-indigo-700 mr-2">{note.task}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${badgeColor}`}>
                              {daysRemaining <= 0 ? 'Due Today' : `${daysRemaining} days left`}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{note.description}</p>
                          <p className="text-sm text-gray-500">{note.content.substring(0, 100)}...</p>
                        </div>
                        <button
                          onClick={() => acknowledgeNote(note.id)}
                          className="flex items-center px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-lg hover:bg-green-200 transition"
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Mark Complete
                        </button>
                      </div>
                      <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                        <span>Deadline: {formatDate(note.deadline)}</span>
                        <button
                          onClick={() => setActiveTab('tasks')}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
        </>
      )}

      {activeTab === 'tasks' && assignedMentor && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <FileText size={20} className="mr-2 text-indigo-600" />
              Tasks & Notes from Your Mentor
            </h2>
            <div className="flex space-x-2">
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 flex items-center">
                <Clock size={12} className="mr-1" />
                Pending: {pendingNotes}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 flex items-center">
                <CheckSquare size={12} className="mr-1" />
                Completed: {acknowledgedNotes}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="text-md font-medium mb-2 text-gray-700">Filter Tasks</h3>
            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                All Tasks
              </button>
              <button className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-100">
                Pending
              </button>
              <button className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-100">
                Completed
              </button>
              <button className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-100">
                Upcoming Deadlines
              </button>
            </div>
          </div>

          {mentorNotes.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <AlignLeft size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No notes from your mentor yet.</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for updates from your mentor.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {mentorNotes.map((note) => {
                const daysRemaining = note.deadline ? getDaysRemaining(note.deadline) : null;

                return (
                  <div key={note.id} className="bg-white border border-gray-100 hover:border-indigo-200 rounded-lg p-5 shadow-sm hover:shadow transition">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-lg font-semibold text-indigo-700 mr-2">{note.task}</h3>
                          <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                            {note.acknowledged ? 'Completed' : 'Pending'}
                          </span>
                          {!note.acknowledged && note.deadline && daysRemaining <= 3 && (
                            <span className={`ml-2 text-xs px-2 py-1 rounded-full flex items-center ${getStatusBadgeColor(daysRemaining)}`}>
                              <AlertTriangle size={12} className="mr-1" />
                              {daysRemaining <= 0 ? 'Due Today!' : `${daysRemaining} days left`}
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-800 mb-2">{note.description}</h4>
                        <div className="mb-3 text-gray-700 whitespace-pre-wrap">{note.content}</div>

                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 rounded-md">
                            <span className="font-medium">Start:</span> {new Date(note.start_date).toLocaleDateString()}
                          </span>
                          {note.deadline && (
                            <span className="px-2 py-1 bg-gray-100 rounded-md">
                              <span className="font-medium">Deadline:</span> {new Date(note.deadline).toLocaleDateString()}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-gray-100 rounded-md">
                            <span className="font-medium">Created:</span> {formatDate(note.created_at)}
                          </span>
                        </div>
                      </div>

                      {!note.acknowledged && (
                        <div className="flex flex-col items-end justify-start">
                          <button
                            onClick={() => acknowledgeNote(note.id)}
                            className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Mark as Complete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Bell size={20} className="mr-2 text-indigo-600" />
            All Announcements
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
      )}
    </div>
  );
}
