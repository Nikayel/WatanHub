import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { getStudentProfile } from '../lib/UserRoles';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Loader, Bell, MessageSquare, User, Calendar, ChevronRight, BookOpen, AlignLeft,
  CheckCircle, Clock, FileText, CheckSquare, AlertTriangle, Sparkles,
  GraduationCap, Bookmark, Book, LineChart, Quote, Target, Award, Zap, School
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '../components/ui/dialog';
import SchoolChoiceManager from '../components/SchoolChoiceManager';

// Inspirational quotes for students
const MOTIVATIONAL_QUOTES = [
  { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "William Butler Yeats" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" },
  { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
  { text: "The only person who is educated is the one who has learned how to learn and change.", author: "Carl Rogers" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Your education is a dress rehearsal for a life that is yours to lead.", author: "Nora Ephron" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
];

const Dashboard = () => {
  const { user, isMentor, isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [assignedMentor, setAssignedMentor] = useState(null);
  const [mentorNotes, setMentorNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingNotes, setPendingNotes] = useState(0);
  const [acknowledgedNotes, setAcknowledgedNotes] = useState(0);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [confirmingNote, setConfirmingNote] = useState(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [noteFilter, setNoteFilter] = useState('all');
  const [motivationalQuote, setMotivationalQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();

  // Select a random motivational quote on initial load
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setMotivationalQuote(MOTIVATIONAL_QUOTES[randomIndex]);
  }, []);

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

  useEffect(() => {
    // Redirect mentors to mentor dashboard
    if (isMentor) {
      navigate('/mentor/dashboard');
    }
    // Redirect admins to admin dashboard
    else if (isAdmin) {
      navigate('/admin/dashboard');
    }
    // Regular students remain on this dashboard
  }, [isMentor, isAdmin, navigate]);

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
      // If not confirming yet, just set the confirming state
      if (confirmingNote !== noteId) {
        setConfirmingNote(noteId);
        return;
      }

      // If already confirming, proceed with acknowledgment
      setConfirmingNote(null);
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

      // Show success message with confetti effect
      toast.success('Task marked as complete');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);

      console.log("Note successfully acknowledged");
    } catch (error) {
      console.error('Error acknowledging note:', error.message);
      toast.error('Failed to complete task');
    }
  };

  // Toggle note expansion
  const toggleNoteExpansion = (noteId) => {
    setExpandedNotes(prev => ({
      ...prev,
      [noteId]: !prev[noteId]
    }));
  };

  // Cancel acknowledgment confirmation
  const cancelAcknowledgment = () => {
    setConfirmingNote(null);
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

  // Check for first-time login
  useEffect(() => {
    if (!user) return;

    const isNewSignup = localStorage.getItem('newSignup') === 'true';
    if (isNewSignup) {
      // Show welcome popup
      setShowWelcomePopup(true);
      // Clear the flag once used
      localStorage.removeItem('newSignup');
    }
  }, [user]);

  const closeWelcomePopup = () => {
    setShowWelcomePopup(false);
  };

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

  // Add the welcome dialog right before the return statement
  const WelcomeDialog = () => (
    <Dialog open={showWelcomePopup} onOpenChange={setShowWelcomePopup}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to WatanHub!
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-indigo-100 rounded-full">
              <Sparkles className="h-8 w-8 text-indigo-600" />
            </div>
          </div>

          <h3 className="text-lg font-medium text-center mb-4">
            You're all set to start your journey!
          </h3>

          <div className="space-y-3 text-gray-600">
            <p className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>We'll connect you with a mentor within 72 hours.</span>
            </p>

            <p className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Most communications will happen through WhatsApp once you're connected.</span>
            </p>

            <p className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Your data is protected and only used to improve your experience.</span>
            </p>

            <p className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Check the dashboard regularly for updates from your mentor.</span>
            </p>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={closeWelcomePopup}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
          >
            Get Started
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Render Coming Soon content
  const renderComingSoon = (title, description, icon) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-indigo-100 p-4 rounded-full mb-4">
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">{description}</p>
        <div className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md">
          <Bookmark className="mr-2 h-4 w-4" />
          <span>Coming Soon</span>
        </div>
      </div>
    </div>
  );

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
      {/* Welcome Dialog */}
      <WelcomeDialog />

      {/* Header - Improved mobile layout with better spacing */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 rounded-xl shadow-md p-5 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="w-full">
            <div className="mb-4 flex justify-between items-center">
              <Link
                to="/"
                className="inline-flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition"
              >
                ← Home
              </Link>
              <Link to="/profile" className="sm:hidden flex items-center bg-white/20 hover:bg-white/30 transition px-3 py-1.5 rounded-lg">
                <User size={16} className="mr-1.5" />
                <span className="text-sm">Profile</span>
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              {profileData
                ? `Welcome, ${profileData.first_name} ${profileData.last_name || ''}!`
                : 'Welcome!'}
            </h1>
            {profileData?.student_id && (
              <p className="mt-1 text-indigo-100 text-sm">
                Student ID: <span className="font-semibold">{profileData.student_id}</span>
              </p>
            )}

            <p className="mt-2 text-indigo-100 text-sm">Here's what's happening today</p>
          </div>
          <Link to="/profile" className="hidden sm:flex items-center bg-white/20 hover:bg-white/30 transition px-4 py-2 rounded-lg mt-4 sm:mt-0">
            <User size={18} className="mr-2" />
            <span>My Profile</span>
          </Link>
        </div>

        {/* Motivational Quote Section - Better mobile spacing */}
        <div className="mt-4 sm:mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/20">
          <div className="flex items-start">
            <Quote className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-200 mr-2 sm:mr-3 flex-shrink-0 mt-1" />
            <div>
              <p className="italic text-white text-sm sm:text-base">{motivationalQuote.text}</p>
              <p className="text-indigo-200 text-xs sm:text-sm mt-1">— {motivationalQuote.author}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-friendly and better organized Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column - Quick Stats and Mentor Info */}
        <div className="lg:col-span-4 space-y-6">
          {/* Mentor Section - Moved up for better visibility on both mobile and desktop */}
          {assignedMentor && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User size={18} className="mr-2 text-indigo-600" />
                Your Mentor
              </h2>
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="h-14 w-14 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg flex items-center justify-center text-xl font-medium flex-shrink-0">
                  {assignedMentor.full_name?.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base sm:text-lg font-medium text-gray-900 truncate">{assignedMentor.full_name}</p>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{assignedMentor.email}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    <span className="font-medium text-indigo-600">Languages:</span> {assignedMentor.languages?.join(', ') || 'N/A'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">
                    <span className="font-medium text-indigo-600">Bio:</span> {assignedMentor.bio || 'No bio available.'}
                  </p>
                  <button className="mt-2 px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition">
                    Message Mentor
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats - Now more organized for mobile */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar size={18} className="mr-2 text-indigo-600" />
              Quick Stats
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-3">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 sm:p-4 rounded-lg col-span-2 sm:col-span-2 lg:col-span-1">
                <div className="text-sm text-indigo-700">Today's Date</div>
                <div className="text-lg sm:text-xl font-semibold text-indigo-900">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric'
                  })}
                </div>
              </div>

              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs sm:text-sm text-gray-500">Announcements</div>
                  <div className="text-xl font-semibold text-gray-800">{announcements.length}</div>
                </div>
                <Bell size={18} className="text-indigo-600" />
              </div>

              {assignedMentor && (
                <>
                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm text-green-700">Notes</div>
                      <div className="text-xl font-semibold text-green-900">{mentorNotes.length}</div>
                    </div>
                    <FileText size={18} className="text-green-600" />
                  </div>

                  <div className="bg-amber-50 p-3 sm:p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm text-amber-700">Pending</div>
                      <div className="text-xl font-semibold text-amber-900">{pendingNotes}</div>
                    </div>
                    <Clock size={18} className="text-amber-600" />
                  </div>

                  <div className="bg-blue-50 p-3 sm:p-4 rounded-lg flex items-center justify-between col-span-2 sm:col-span-1">
                    <div>
                      <div className="text-xs sm:text-sm text-blue-700">Completed</div>
                      <div className="text-xl font-semibold text-blue-900">{acknowledgedNotes}</div>
                    </div>
                    <CheckCircle size={18} className="text-blue-600" />
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <Link to="/resources" className="block bg-gray-50 hover:bg-gray-100 p-3 rounded-lg flex justify-between items-center transition">
                <div className="flex items-center">
                  <BookOpen size={16} className="text-indigo-600 mr-2" />
                  <span className="font-medium text-gray-800">Resources</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>

              <Link to="/profile" className="block bg-gray-50 hover:bg-gray-100 p-3 rounded-lg flex justify-between items-center transition">
                <div className="flex items-center">
                  <User size={16} className="text-indigo-600 mr-2" />
                  <span className="font-medium text-gray-800">Profile</span>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Link>
            </div>
          </div>

          {/* Quick Navigation - Made more mobile-friendly */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Navigation</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  title: 'Tasks',
                  icon: <CheckSquare size={18} />,
                  description: 'View tasks',
                  action: () => setActiveTab('tasks'),
                  color: 'from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100',
                  iconBg: 'bg-blue-100 text-blue-600'
                },
                {
                  title: 'News',
                  icon: <Bell size={18} />,
                  description: 'Updates',
                  action: () => setActiveTab('announcements'),
                  color: 'from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100',
                  iconBg: 'bg-purple-100 text-purple-600'
                },
                {
                  title: 'Profile',
                  icon: <User size={18} />,
                  path: '/profile',
                  description: 'Edit profile',
                  color: 'from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100',
                  iconBg: 'bg-emerald-100 text-emerald-600'
                }
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => item.path ? navigate(item.path) : item.action()}
                  className={`bg-gradient-to-br ${item.color} rounded-xl p-3 text-center transition shadow-sm hover:shadow flex flex-col items-center justify-center cursor-pointer`}
                >
                  <div className={`rounded-full w-8 h-8 flex items-center justify-center ${item.iconBg} mb-2`}>
                    {item.icon}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800">{item.title}</h3>
                  <p className="text-xs text-gray-500 hidden sm:block">{item.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Main Content Area */}
        <div className="lg:col-span-8">
          {/* Navigation Tabs - Improved for mobile */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-100">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-4 text-center font-medium text-sm whitespace-nowrap ${activeTab === 'overview'
                  ? 'text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center">
                  <LineChart className="h-4 w-4 mr-1.5" />
                  <span>Overview</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('tasks')}
                className={`py-3 px-4 text-center font-medium text-sm whitespace-nowrap ${activeTab === 'tasks'
                  ? 'text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center">
                  <CheckSquare className="h-4 w-4 mr-1.5" />
                  <span>Tasks & Notes</span>
                  {pendingNotes > 0 && (
                    <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {pendingNotes}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('schools')}
                className={`py-3 px-4 text-center font-medium text-sm whitespace-nowrap ${activeTab === 'schools'
                  ? 'text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center">
                  <School className="h-4 w-4 mr-1.5" />
                  <span>Schools</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`py-3 px-4 text-center font-medium text-sm whitespace-nowrap ${activeTab === 'announcements'
                  ? 'text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center">
                  <Bell className="h-4 w-4 mr-1.5" />
                  <span>Announcements</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`py-3 px-4 text-center font-medium text-sm whitespace-nowrap ${activeTab === 'courses'
                  ? 'text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1.5" />
                  <span>Courses</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`py-3 px-4 text-center font-medium text-sm whitespace-nowrap ${activeTab === 'assignments'
                  ? 'text-indigo-600 border-b-2 border-indigo-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1.5" />
                  <span>Assignments</span>
                </div>
              </button>
            </div>
          </div>

          {/* Keep the rest of the content for each tab */}
          {activeTab === 'courses' && (
            renderComingSoon(
              "Courses Coming Soon",
              "We're currently developing an exciting collection of courses to help you on your educational journey. Stay tuned for updates!",
              <GraduationCap className="h-8 w-8 text-indigo-600" />
            )
          )}

          {activeTab === 'assignments' && (
            renderComingSoon(
              "Assignments Coming Soon",
              "Our team is working on a comprehensive assignment system to help track your progress and achievements. Check back soon!",
              <Book className="h-8 w-8 text-indigo-600" />
            )
          )}

          {/* Add the Schools tab content */}
          {activeTab === 'schools' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <School size={18} className="mr-2 text-indigo-600" />
                  My College Choices
                </h2>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Select your target, safety, and stretch schools to help your mentor guide your college application journey.
              </p>
              <SchoolChoiceManager />
            </div>
          )}

          {activeTab === 'overview' && (
            <>
              {/* Upcoming Deadlines - Improved for mobile */}
              {upcomingDeadlines.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Clock size={18} className="mr-2 text-indigo-600" />
                    Upcoming Deadlines
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {upcomingDeadlines.map((note) => {
                      const daysRemaining = getDaysRemaining(note.deadline);
                      const badgeColor = getStatusBadgeColor(daysRemaining);

                      return (
                        <div key={note.id} className="bg-white border border-gray-100 hover:border-indigo-200 rounded-lg p-4 shadow-sm hover:shadow transition">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="text-base sm:text-lg font-semibold text-indigo-700 mr-2">{note.task}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>
                                  {daysRemaining <= 0 ? 'Due Today' : `${daysRemaining} days left`}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-2 line-clamp-2">{note.description}</p>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-between items-center">
                            <span className="text-xs text-gray-500">Due: {formatDate(note.deadline)}</span>
                            <button
                              onClick={() => acknowledgeNote(note.id)}
                              className="flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-lg hover:bg-green-200 transition"
                            >
                              <CheckCircle size={12} className="mr-1" />
                              Complete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Announcements Preview - Better mobile layout */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Bell size={18} className="mr-2 text-indigo-600" />
                    Latest Announcements
                  </h2>
                  <button
                    onClick={() => setActiveTab('announcements')}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    View All
                    <ChevronRight size={14} className="ml-1" />
                  </button>
                </div>
                <div className="space-y-4">
                  {announcements.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <MessageSquare size={28} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">No announcements yet</p>
                      <p className="text-xs text-gray-400 mt-1">Check back later for updates</p>
                    </div>
                  ) : (
                    announcements.slice(0, 2).map((a) => (
                      <div key={a.id} className="bg-white border border-gray-100 hover:border-indigo-200 rounded-lg p-4 shadow-sm hover:shadow transition group">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                          <h3 className="text-base font-semibold text-indigo-700 group-hover:text-indigo-800">{a.title}</h3>
                          <div className="text-xs text-gray-400 mt-1 sm:mt-0 flex items-center">
                            <Calendar size={12} className="mr-1" />
                            {formatDate(a.created_at)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{a.message}</p>
                        {a.cta_link && (
                          <div className="mt-2 text-right">
                            <Link to={a.cta_link} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center justify-end">
                              <span>Learn more</span>
                              <ChevronRight size={14} className="ml-1" />
                            </Link>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Achievement Section */}
              {activeTab === 'overview' && acknowledgedNotes > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-200 p-5 mb-6">
                  <h2 className="text-lg font-semibold text-amber-800 mb-4 flex items-center">
                    <Award className="mr-2 h-5 w-5 text-amber-600" />
                    Your Achievements
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-amber-100 flex items-center">
                      <div className="rounded-full bg-amber-100 p-2 mr-3">
                        <CheckSquare className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-800">{acknowledgedNotes}</div>
                        <div className="text-xs text-gray-600">Tasks Completed</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-amber-100 flex items-center">
                      <div className="rounded-full bg-amber-100 p-2 mr-3">
                        <Target className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-800">{pendingNotes}</div>
                        <div className="text-xs text-gray-600">Tasks In Progress</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm border border-amber-100 flex items-center">
                      <div className="rounded-full bg-amber-100 p-2 mr-3">
                        <Zap className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-800">{Math.floor((acknowledgedNotes / (acknowledgedNotes + pendingNotes)) * 100)}%</div>
                        <div className="text-xs text-gray-600">Completion Rate</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Tasks tab content - Better mobile layout */}
          {activeTab === 'tasks' && assignedMentor && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FileText size={18} className="mr-2 text-indigo-600" />
                  Tasks & Notes from Your Mentor
                </h2>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 flex items-center">
                    <Clock size={12} className="mr-1" />
                    <span className="whitespace-nowrap">Total: {mentorNotes.length}</span>
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 flex items-center">
                    <Clock size={12} className="mr-1" />
                    <span className="whitespace-nowrap">Pending: {pendingNotes}</span>
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 flex items-center">
                    <CheckSquare size={12} className="mr-1" />
                    <span className="whitespace-nowrap">Completed: {acknowledgedNotes}</span>
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-indigo-800">Task Completion</h3>
                  <span className="text-sm font-medium text-indigo-800">
                    {mentorNotes.length > 0
                      ? `${Math.round((acknowledgedNotes / mentorNotes.length) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: mentorNotes.length > 0
                        ? `${(acknowledgedNotes / mentorNotes.length) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  onClick={() => setNoteFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${noteFilter === 'all'
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  All Tasks
                </button>
                <button
                  onClick={() => setNoteFilter('pending')}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${noteFilter === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setNoteFilter('acknowledged')}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${noteFilter === 'acknowledged'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  Completed
                </button>
              </div>

              {/* Display filtered notes */}
              {mentorNotes.length === 0 ? (
                <div className="py-10 px-4 text-center bg-gray-50 rounded-lg border border-dashed">
                  <AlignLeft size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-medium">No notes from your mentor yet.</p>
                  <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                    Once your mentor adds tasks or notes, they will appear here. You'll also receive a notification.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Display filtered notes */}
                  {mentorNotes
                    .filter(note => {
                      if (noteFilter === 'all') return true;
                      if (noteFilter === 'pending') return !note.acknowledged;
                      if (noteFilter === 'acknowledged') return note.acknowledged;
                      return true;
                    })
                    .map(note => {
                      const isExpanded = expandedNotes[note.id] === true;
                      const daysRemaining = note.deadline ? getDaysRemaining(note.deadline) : null;

                      return (
                        <div
                          key={note.id}
                          className={`bg-white p-5 rounded-lg border shadow-sm transition-all ${note.acknowledged
                            ? 'border-l-4 border-l-green-500 border-t border-r border-b border-gray-100'
                            : 'border-l-4 border-l-amber-500 border-t border-r border-b border-gray-100'
                            }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-800">{note.task}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${note.acknowledged
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-amber-100 text-amber-800'
                                  }`}>
                                  {note.acknowledged ? 'Completed' : 'Pending'}
                                </span>
                                {!note.acknowledged && note.deadline && daysRemaining <= 3 && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full flex items-center ${getStatusBadgeColor(daysRemaining)}`}>
                                    <AlertTriangle size={10} className="mr-1" />
                                    {daysRemaining <= 0 ? 'Due Today!' : `${daysRemaining} days left`}
                                  </span>
                                )}
                              </div>

                              <h4 className="font-medium text-sm sm:text-base text-gray-700 mb-2">{note.description}</h4>

                              {/* Display truncated or full content based on expanded state */}
                              <div className={`mb-3 text-sm text-gray-600 whitespace-pre-wrap transition-all duration-200 ${isExpanded ? '' : 'line-clamp-2'
                                }`}>
                                {note.content}
                              </div>

                              {/* Show expand/collapse button if content is long */}
                              {note.content && note.content.length > 100 && (
                                <button
                                  onClick={() => toggleNoteExpansion(note.id)}
                                  className="text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm font-medium mb-2 flex items-center"
                                >
                                  {isExpanded ? (
                                    <>
                                      <span>Show less</span>
                                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                      </svg>
                                    </>
                                  ) : (
                                    <>
                                      <span>Read more</span>
                                      <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </>
                                  )}
                                </button>
                              )}

                              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-3">
                                <span className="px-2 py-1 bg-gray-100 rounded-md">
                                  <span className="font-medium">Start:</span> {formatDate(note.start_date)}
                                </span>
                                {note.deadline && (
                                  <span className="px-2 py-1 bg-gray-100 rounded-md">
                                    <span className="font-medium">Deadline:</span> {formatDate(note.deadline)}
                                  </span>
                                )}
                                <span className="px-2 py-1 bg-gray-100 rounded-md">
                                  <span className="font-medium">Created:</span> {formatDate(note.created_at)}
                                </span>
                                {note.acknowledged && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-md">
                                    <span className="font-medium">Completed on:</span> {formatDate(note.updated_at)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {!note.acknowledged && (
                              <div className="flex flex-col items-end justify-start">
                                {confirmingNote === note.id ? (
                                  <div className="flex flex-col space-y-2">
                                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-800 mb-2 max-w-xs">
                                      <p className="font-medium mb-1">Please confirm:</p>
                                      <p className="text-xs">I have completed this task and understand this will be marked as acknowledged.</p>
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => acknowledgeNote(note.id)}
                                        className="flex items-center px-3 py-1.5 bg-green-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-green-700 transition"
                                      >
                                        <CheckCircle size={14} className="mr-1" />
                                        Confirm
                                      </button>
                                      <button
                                        onClick={cancelAcknowledgment}
                                        className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-300 transition"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => acknowledgeNote(note.id)}
                                    className="flex items-center px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition shadow-sm"
                                  >
                                    <CheckCircle size={16} className="mr-2" />
                                    Mark as Complete
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Keep the announcements tab content as is, it's well structured */}
          {activeTab === 'announcements' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              {/* ... existing code ... */}
            </div>
          )}
        </div>
      </div>

      {/* Confetti Effect for Task Completion */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="absolute top-0 left-0 w-full h-full confetti-container">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-5%`,
                  backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                  width: `${Math.random() * 10 + 5}px`,
                  height: `${Math.random() * 10 + 5}px`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${Math.random() * 3 + 2}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add confetti animation styles and scrollbar hiding */}
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .confetti {
          position: absolute;
          animation: confettiFall linear forwards;
        }

        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
}

export default Dashboard;
