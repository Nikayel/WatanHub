import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { getStudentProfile } from '../lib/UserRoles';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Loader, Bell, MessageSquare, User, Calendar, ChevronRight, BookOpen, AlignLeft,
  CheckCircle, Clock, FileText, CheckSquare, AlertTriangle, Sparkles,
  GraduationCap, Bookmark, Book, LineChart, Quote, Target, Award, Zap, School,
  Brain, TrendingUp, BarChart, Edit, Users, BookMarked
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import SchoolChoiceManager from '../components/SchoolChoiceManager';
import StudentSchoolChoicesViewer from '../components/StudentSchoolChoicesViewer';
import ProfileCompleteness from '../components/ProfileCompleteness';
import Three3DBackground from '../components/Three3DBackground';

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

  // Changed from activeTab to mainTab and subTab
  const [mainTab, setMainTab] = useState('fellowship'); // Default to fellowship
  const [subTab, setSubTab] = useState('assignments'); // Default sub-tab for fellowship
  const [studyAbroadSubTab, setStudyAbroadSubTab] = useState('overview'); // Sub-tab for study abroad

  const [pendingNotes, setPendingNotes] = useState(0);
  const [acknowledgedNotes, setAcknowledgedNotes] = useState(0);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [confirmingNote, setConfirmingNote] = useState(null);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [noteFilter, setNoteFilter] = useState('all');
  const [motivationalQuote, setMotivationalQuote] = useState(MOTIVATIONAL_QUOTES[0]);
  const [showConfetti, setShowConfetti] = useState(false);

  // AI advisor state
  const [showAIAdvisor, setShowAIAdvisor] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState('');
  const [analyticsData, setAnalyticsData] = useState({
    profileCompleteness: 0,
    schoolChoicesCount: 0,
    tasksCompleted: 0,
    avgResponseTime: 0
  });

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
    // Force show welcome popup for testing
    const forceWelcome = localStorage.getItem('forceWelcome') === 'true';

    // Either show it because it's a new signup or manual override
    if (isNewSignup || forceWelcome) {
      console.log("Showing welcome popup for new user");
      // Show welcome popup
      setShowWelcomePopup(true);
      // Clear the flag once used
      localStorage.removeItem('newSignup');
      localStorage.removeItem('forceWelcome');
    }
  }, [user]);

  // Function to force show welcome popup (for testing)
  const forceShowWelcomePopup = () => {
    localStorage.setItem('forceWelcome', 'true');
    window.location.reload();
  };

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

  // ─── Fetch Analytics Data ─────────────────────────────────────────────────
  const fetchAnalyticsData = async () => {
    if (!user?.id) return;

    try {
      // Profile completeness - use the same fields as ProfileCompleteness component
      const criticalFields = ['first_name', 'last_name', 'email'];
      const veryImportantFields = ['date_of_birth', 'gender', 'phone_number', 'education_level', 'english_level'];
      const importantFields = ['interests', 'bio', 'toefl_score', 'place_of_birth', 'place_of_residence'];

      // New fields that may or may not exist yet
      const optionalFields = ['gpa', 'extracurricular_activities', 'province', 'school_type'];

      const allFields = [...criticalFields, ...veryImportantFields, ...importantFields, ...optionalFields];
      const completedFields = allFields.filter(field => {
        const value = profileData?.[field];
        return value !== null && value !== undefined && value !== '' && value !== '[]' && value.toString().trim() !== '';
      });

      // Calculate completion percentage with full 100% possible
      const completeness = Math.round((completedFields.length / allFields.length) * 100);

      // School choices count
      const { data: schoolChoices } = await supabase
        .from('student_school_choices')
        .select('id')
        .eq('student_id', user.id);

      // Calculate average response time for tasks
      const completedTasks = mentorNotes.filter(note => note.acknowledged);
      let avgResponseTime = 0;
      if (completedTasks.length > 0) {
        const responseTimes = completedTasks.map(note => {
          const created = new Date(note.created_at);
          const completed = new Date(note.updated_at);
          return Math.ceil((completed - created) / (1000 * 60 * 60 * 24)); // days
        });
        avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
      }

      setAnalyticsData({
        profileCompleteness: completeness,
        schoolChoicesCount: schoolChoices?.length || 0,
        tasksCompleted: acknowledgedNotes,
        avgResponseTime
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // ─── Generate AI Insights ─────────────────────────────────────────────────
  const generateAIInsights = async () => {
    if (!user?.id || !profileData) {
      setAiInsights('Please complete your profile to get personalized insights.');
      setShowAIAdvisor(true);
      return;
    }

    setAiLoading(true);
    try {
      // Create a detailed analysis without relying on external API
      let insights = `Based on your current progress, here's your personalized college roadmap:\n\n`;

      // Profile analysis
      if (analyticsData.profileCompleteness < 80) {
        insights += `📝 PROFILE COMPLETION (${analyticsData.profileCompleteness}%)\n`;
        insights += `Your profile needs more information to provide better guidance. Focus on:\n`;
        if (!profileData.gpa) insights += `• Add your GPA/grades\n`;
        if (!profileData.extracurricular_activities) insights += `• List your extracurricular activities\n`;
        if (!profileData.interests) insights += `• Describe your academic interests\n`;
        if (!profileData.date_of_birth) insights += `• Add your date of birth\n`;
        insights += `\n`;
      } else {
        insights += `✅ PROFILE: Well-completed profile (${analyticsData.profileCompleteness}%)\n\n`;
      }

      // School choices analysis
      if (analyticsData.schoolChoicesCount === 0) {
        insights += `🎓 SCHOOL CHOICES: Start building your list\n`;
        insights += `• Research and add 8-12 schools\n`;
        insights += `• Include 3-4 safety schools\n`;
        insights += `• Add 4-5 target schools\n`;
        insights += `• Consider 1-2 stretch schools\n\n`;
      } else if (analyticsData.schoolChoicesCount < 6) {
        insights += `🎓 SCHOOL CHOICES: Add more options (${analyticsData.schoolChoicesCount} schools)\n`;
        insights += `• Aim for 6-10 total schools for a balanced list\n`;
        insights += `• Ensure you have safety, target, and stretch schools\n\n`;
      } else {
        insights += `✅ SCHOOL CHOICES: Good selection (${analyticsData.schoolChoicesCount} schools)\n`;
        insights += `• Review your list balance across safety/target/stretch\n`;
        insights += `• Research application requirements for each school\n\n`;
      }

      // Task completion analysis
      if (pendingNotes > 0) {
        insights += `📋 TASKS: ${pendingNotes} pending tasks from your mentor\n`;
        insights += `• Complete these to stay on track\n`;
        if (analyticsData.avgResponseTime > 7) {
          insights += `• Try to respond faster (current average: ${analyticsData.avgResponseTime} days)\n`;
        }
        insights += `\n`;
      } else if (analyticsData.tasksCompleted > 0) {
        insights += `✅ TASKS: Great job staying on top of your tasks!\n`;
        insights += `• Keep this momentum going\n\n`;
      }

      // Personalized recommendations based on profile
      insights += `🎯 PERSONALIZED RECOMMENDATIONS:\n`;

      if (profileData.gpa && parseFloat(profileData.gpa) >= 3.7) {
        insights += `• Your strong GPA (${profileData.gpa}) opens doors to competitive schools\n`;
      } else if (profileData.gpa && parseFloat(profileData.gpa) >= 3.0) {
        insights += `• Your GPA (${profileData.gpa}) is solid - focus on strong essays and activities\n`;
      }

      if (profileData.toefl_score && parseInt(profileData.toefl_score) >= 100) {
        insights += `• Excellent TOEFL score (${profileData.toefl_score}) - language won't be a barrier\n`;
      } else if (profileData.toefl_score && parseInt(profileData.toefl_score) >= 80) {
        insights += `• Good TOEFL score (${profileData.toefl_score}) - most schools will accept this\n`;
      } else if (!profileData.toefl_score) {
        insights += `• Consider taking the TOEFL if applying to US schools\n`;
      }

      if (profileData.interests) {
        insights += `• Your interest in ${profileData.interests} can guide your school and major selection\n`;
      }

      insights += `\n📈 NEXT STEPS:\n`;
      insights += `1. ${analyticsData.profileCompleteness < 80 ? 'Complete your profile' : 'Keep profile updated'}\n`;
      insights += `2. ${analyticsData.schoolChoicesCount < 8 ? 'Add more schools to your list' : 'Research application deadlines'}\n`;
      insights += `3. ${pendingNotes > 0 ? 'Complete pending tasks' : 'Stay in touch with your mentor'}\n`;
      insights += `4. Research scholarship opportunities\n`;
      insights += `5. Prepare application essays and materials\n`;

      setAiInsights(insights);
      setShowAIAdvisor(true);
    } catch (error) {
      console.error('Error generating AI insights:', error);
      // Provide a helpful fallback message
      const fallbackInsights = `Here's your current progress summary:

📊 Profile Completion: ${analyticsData.profileCompleteness}%
🎓 Schools Added: ${analyticsData.schoolChoicesCount}
✅ Tasks Completed: ${analyticsData.tasksCompleted}
⏰ Pending Tasks: ${pendingNotes}

🎯 IMMEDIATE ACTIONS:
${analyticsData.profileCompleteness < 80 ? '• Complete your profile for better guidance\n' : ''}${analyticsData.schoolChoicesCount < 8 ? '• Add more schools to create a balanced list\n' : ''}${pendingNotes > 0 ? '• Complete pending tasks from your mentor\n' : ''}
📚 Research application requirements and deadlines
🎨 Start working on your application essays
💰 Look into scholarship opportunities

Keep up the great work on your college journey!`;

      setAiInsights(fallbackInsights);
      setShowAIAdvisor(true);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (profileData && mentorNotes) {
      fetchAnalyticsData();
    }
  }, [profileData, mentorNotes, acknowledgedNotes, pendingNotes, user?.id]);

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 relative">
      {/* 3D Background */}
      <Three3DBackground className="fixed inset-0" />

      {/* Welcome Dialog */}
      <WelcomeDialog />

      {/* Hidden button to force show welcome popup (only visible in development) */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={forceShowWelcomePopup}
          className="fixed bottom-4 right-4 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-md hover:bg-gray-300 z-50"
        >
          Test Welcome
        </button>
      )}

      {/* Header - Improved mobile layout with better spacing */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 rounded-xl shadow-md p-5 sm:p-8 mb-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="w-full">
              <div className="mb-4 flex justify-between items-center">
                <Link
                  to="/"
                  className="inline-flex items-center px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition backdrop-blur-sm"
                >
                  ← Home
                </Link>
                <Link to="/profile" className="sm:hidden flex items-center bg-white/20 hover:bg-white/30 transition px-3 py-1.5 rounded-lg backdrop-blur-sm">
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
            <Link to="/profile" className="hidden sm:flex items-center bg-white/20 hover:bg-white/30 transition px-4 py-2 rounded-lg mt-4 sm:mt-0 backdrop-blur-sm">
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
      </div>

      {/* Improved Three-Column Layout for Better Space Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Left Column - Quick Stats and Mentor Info (3 columns) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Mentor Section */}
          {assignedMentor && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <User size={18} className="mr-2 text-indigo-600" />
                Your Mentor
              </h2>
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {assignedMentor.full_name?.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium text-gray-900 truncate">{assignedMentor.full_name}</p>
                  <p className="text-xs text-gray-600 mb-1 truncate">{assignedMentor.email}</p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-indigo-600">Languages:</span> {assignedMentor.languages?.join(', ') || 'N/A'}
                  </p>
                  <button className="mt-2 px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition">
                    Message Mentor
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Essential Stats Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BarChart size={18} className="mr-2 text-indigo-600" />
              Progress Overview
            </h2>

            <div className="space-y-4">
              {/* Profile Completeness */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Profile</span>
                  <span className="text-lg font-bold text-blue-600">{analyticsData.profileCompleteness}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${analyticsData.profileCompleteness}%` }}
                  />
                </div>
                <Link
                  to="/profile"
                  className="inline-flex items-center text-xs text-blue-700 hover:text-blue-800 font-medium"
                >
                  <Edit size={12} className="mr-1" />
                  Update Profile
                </Link>
              </div>

              {/* School Progress */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Schools</span>
                  <span className="text-lg font-bold text-green-600">{analyticsData.schoolChoicesCount}</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">Target: 8-12 schools</p>
                <button
                  onClick={() => {
                    setMainTab('study-abroad');
                    setStudyAbroadSubTab('schools');
                  }}
                  className="inline-flex items-center text-xs text-green-700 hover:text-green-800 font-medium"
                >
                  <School size={12} className="mr-1" />
                  Manage Schools
                </button>
              </div>

              {/* Task Progress */}
              {assignedMentor && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Tasks</span>
                    <span className="text-lg font-bold text-purple-600">{pendingNotes}</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{analyticsData.tasksCompleted} completed</p>
                  <button
                    onClick={() => {
                      setMainTab('fellowship');
                      setSubTab('assignments');
                    }}
                    className="inline-flex items-center text-xs text-purple-700 hover:text-purple-800 font-medium"
                  >
                    <CheckSquare size={12} className="mr-1" />
                    View Tasks
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={generateAIInsights}
                disabled={aiLoading}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-lg border border-purple-200 transition-colors"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Brain size={16} className="text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-800">AI Insights</div>
                    <div className="text-xs text-gray-500">Get personalized advice</div>
                  </div>
                </div>
                <Sparkles size={16} className="text-purple-500" />
              </button>

              <button
                onClick={() => navigate('/resources')}
                className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-lg border border-emerald-200 transition-colors"
              >
                <div className="flex items-center">
                  <div className="p-2 bg-emerald-100 rounded-lg mr-3">
                    <BookOpen size={16} className="text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-800">Resources</div>
                    <div className="text-xs text-gray-500">Study materials</div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Center Column - Main Content Area (5 columns) */}
        <div className="lg:col-span-5">
          {/* Main Navigation Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
            <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-100">
              {[
                { key: 'fellowship', label: 'Fellowship', icon: Users, count: pendingNotes },
                { key: 'study-abroad', label: 'Study Abroad', icon: School, count: analyticsData.schoolChoicesCount },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setMainTab(tab.key)}
                  className={`py-4 px-6 text-center font-medium text-base whitespace-nowrap flex items-center ${mainTab === tab.key
                    ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Sub-tabs for Fellowship */}
            {mainTab === 'fellowship' && (
              <div className="flex overflow-x-auto scrollbar-hide bg-gray-50">
                {[
                  { key: 'assignments', label: 'Assignments', icon: CheckSquare, count: pendingNotes },
                  { key: 'courses', label: 'Courses', icon: BookMarked },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSubTab(tab.key)}
                    className={`py-3 px-4 text-center font-medium text-sm whitespace-nowrap flex items-center ${subTab === tab.key
                      ? 'text-indigo-600 border-b-2 border-indigo-400 bg-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                  >
                    <tab.icon className="h-4 w-4 mr-1.5" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Sub-tabs for Study Abroad */}
            {mainTab === 'study-abroad' && (
              <div className="flex overflow-x-auto scrollbar-hide bg-gray-50">
                {[
                  { key: 'overview', label: 'Overview', icon: LineChart },
                  { key: 'schools', label: 'Schools', icon: School, count: analyticsData.schoolChoicesCount },
                  { key: 'insights', label: 'AI Insights', icon: Brain },
                  { key: 'announcements', label: 'News', icon: Bell },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStudyAbroadSubTab(tab.key)}
                    className={`py-3 px-4 text-center font-medium text-sm whitespace-nowrap flex items-center ${studyAbroadSubTab === tab.key
                      ? 'text-indigo-600 border-b-2 border-indigo-400 bg-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                  >
                    <tab.icon className="h-4 w-4 mr-1.5" />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tab Content */}

          {/* Fellowship Tab Content */}
          {mainTab === 'fellowship' && subTab === 'assignments' && (
            <>
              {/* Assignment Tasks */}
              {assignedMentor && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                      <FileText size={18} className="mr-2 text-indigo-600" />
                      Tasks & Assignments from Your Mentor
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

                  {/* Display notes */}
                  {mentorNotes.length === 0 ? (
                    <div className="py-10 px-4 text-center bg-gray-50 rounded-lg border border-dashed">
                      <AlignLeft size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No assignments from your mentor yet.</p>
                      <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
                        Once your mentor adds tasks or assignments, they will appear here. You'll also receive a notification.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {mentorNotes.map(note => (
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
                              </div>

                              <h4 className="font-medium text-sm sm:text-base text-gray-700 mb-2">{note.description}</h4>
                              <div className="mb-3 text-sm text-gray-600 whitespace-pre-wrap">
                                {note.content}
                              </div>

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
                                <button
                                  onClick={() => acknowledgeNote(note.id)}
                                  className="flex items-center px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition shadow-sm"
                                >
                                  <CheckCircle size={16} className="mr-2" />
                                  Mark as Complete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!assignedMentor && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Mentor Assigned Yet</h3>
                  <p className="text-gray-600 mb-4">
                    You'll be assigned a mentor soon who will provide you with assignments and guidance.
                  </p>
                  <p className="text-sm text-gray-500">
                    Check back later or contact support if you have questions.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Fellowship - Courses Tab */}
          {mainTab === 'fellowship' && subTab === 'courses' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <BookMarked size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Courses Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                We're preparing comprehensive courses to help you with your fellowship applications.
              </p>
              <p className="text-sm text-gray-500">
                This section will include video lessons, practice exercises, and expert guidance.
              </p>
            </div>
          )}

          {/* Study Abroad Tab Content */}
          {mainTab === 'study-abroad' && studyAbroadSubTab === 'overview' && (
            <>
              {/* Profile Completeness Check */}
              {profileData && (
                <ProfileCompleteness
                  profile={profileData}
                  onComplete={() => toast.success('Dismissed profile analysis')}
                />
              )}

              {/* Enhanced Analytics Dashboard */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                    <BarChart className="mr-2 h-5 w-5 text-indigo-600" />
                    Your Progress Analytics
                  </h2>
                  <button
                    onClick={generateAIInsights}
                    disabled={aiLoading}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? (
                      <Loader size={16} className="animate-spin mr-2" />
                    ) : (
                      <Brain size={16} className="mr-2" />
                    )}
                    {aiLoading ? 'Analyzing...' : 'Get AI Insights'}
                    <Sparkles size={14} className="ml-1" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Profile Completeness */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <User size={20} className="text-blue-600" />
                      </div>
                      <span className="text-2xl font-bold text-blue-600">
                        {analyticsData.profileCompleteness}%
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Profile Complete</h3>
                    <p className="text-xs text-gray-600 mb-2">Higher completion = better mentor guidance</p>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${analyticsData.profileCompleteness}%` }}
                      />
                    </div>
                    <div className="mt-2">
                      <Link
                        to="/profile"
                        className="inline-flex items-center text-xs text-blue-700 hover:text-blue-800 font-medium"
                      >
                        <Edit size={12} className="mr-1" />
                        Update Profile
                      </Link>
                    </div>
                  </div>

                  {/* School Choices */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <School size={20} className="text-green-600" />
                      </div>
                      <span className="text-2xl font-bold text-green-600">
                        {analyticsData.schoolChoicesCount}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Schools Added</h3>
                    <p className="text-xs text-gray-600 mb-2">Aim for 8-12 balanced choices</p>
                    <div className="flex gap-1">
                      {[...Array(Math.min(12, Math.max(analyticsData.schoolChoicesCount, 3)))].map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded ${i < analyticsData.schoolChoicesCount ? 'bg-green-600' : 'bg-green-200'}`}
                        />
                      ))}
                    </div>
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setMainTab('study-abroad');
                          setStudyAbroadSubTab('schools');
                        }}
                        className="inline-flex items-center text-xs text-green-700 hover:text-green-800 font-medium"
                      >
                        <School size={12} className="mr-1" />
                        View Schools
                      </button>
                    </div>
                  </div>

                  {/* Task Performance */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <CheckSquare size={20} className="text-purple-600" />
                      </div>
                      <span className="text-2xl font-bold text-purple-600">
                        {analyticsData.tasksCompleted}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Tasks Done</h3>
                    <p className="text-xs text-gray-600 mb-2">{pendingNotes} remaining tasks</p>
                    <div className="text-xs text-purple-700 bg-purple-100 rounded px-2 py-1">
                      {analyticsData.tasksCompleted > 0 ? `${Math.round((analyticsData.tasksCompleted / (analyticsData.tasksCompleted + pendingNotes)) * 100)}% completion rate` : 'No tasks yet'}
                    </div>
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setMainTab('fellowship');
                          setSubTab('assignments');
                        }}
                        className="inline-flex items-center text-xs text-purple-700 hover:text-purple-800 font-medium"
                      >
                        <CheckSquare size={12} className="mr-1" />
                        View Tasks
                      </button>
                    </div>
                  </div>

                  {/* Response Time */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="p-2 bg-orange-100 rounded-full">
                        <Clock size={20} className="text-orange-600" />
                      </div>
                      <span className="text-2xl font-bold text-orange-600">
                        {analyticsData.avgResponseTime || 0}d
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-1">Avg Response</h3>
                    <p className="text-xs text-gray-600 mb-2">Days to complete tasks</p>
                    <div className="text-xs text-orange-700 bg-orange-100 rounded px-2 py-1">
                      {analyticsData.avgResponseTime <= 3 ? 'Excellent!' : analyticsData.avgResponseTime <= 7 ? 'Good pace' : 'Consider faster responses'}
                    </div>
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setMainTab('fellowship');
                          setSubTab('assignments');
                        }}
                        className="inline-flex items-center text-xs text-orange-700 hover:text-orange-800 font-medium"
                      >
                        <Clock size={12} className="mr-1" />
                        Faster Responses
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Study Abroad - Schools Tab */}
          {mainTab === 'study-abroad' && studyAbroadSubTab === 'schools' && (
            <div className="animate-fadeIn space-y-6">
              {/* Header Card with Instructions */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-blue-100 rounded-xl mr-4">
                      <GraduationCap size={24} className="text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Your College List</h2>
                      <p className="text-blue-700 text-sm">Build a balanced portfolio of target, safety, and stretch schools</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center mb-2">
                        <Target className="text-blue-600 mr-2" size={18} />
                        <span className="font-semibold text-blue-800">Target Schools</span>
                      </div>
                      <p className="text-sm text-gray-600">4-5 schools matching your academic profile</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="text-green-600 mr-2" size={18} />
                        <span className="font-semibold text-green-800">Safety Schools</span>
                      </div>
                      <p className="text-sm text-gray-600">2-3 schools with high acceptance probability</p>
                    </div>

                    <div className="bg-white rounded-lg p-4 border border-purple-200">
                      <div className="flex items-center mb-2">
                        <Sparkles className="text-purple-600 mr-2" size={18} />
                        <span className="font-semibold text-purple-800">Stretch Schools</span>
                      </div>
                      <p className="text-sm text-gray-600">1-2 ambitious choices for your dreams</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* School Choices Viewer */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <StudentSchoolChoicesViewer studentId={user?.id} forMentor={false} />
              </div>

              {/* Add Schools Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <School className="mr-2 text-indigo-600" size={20} />
                    Add New School
                  </h3>
                  <div className="text-sm text-gray-500">
                    Build your list step by step
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <AlertTriangle size={18} className="text-amber-600 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Remember to research each school thoroughly:</p>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        <li>Check program requirements and deadlines</li>
                        <li>Consider location, cost, and campus culture</li>
                        <li>Ensure a balanced mix across categories</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <SchoolChoiceManager />
              </div>
            </div>
          )}

          {/* Study Abroad - AI Insights Tab */}
          {mainTab === 'study-abroad' && studyAbroadSubTab === 'insights' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-purple-600" />
                  AI-Powered College Insights
                  <Sparkles className="ml-2 h-4 w-4 text-purple-500" />
                </h2>
                <button
                  onClick={generateAIInsights}
                  disabled={aiLoading}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                >
                  {aiLoading ? (
                    <Loader size={16} className="animate-spin mr-2" />
                  ) : (
                    <Brain size={16} className="mr-2" />
                  )}
                  {aiLoading ? 'Generating Insights...' : 'Refresh Insights'}
                </button>
              </div>

              {aiInsights ? (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-start">
                      <div className="p-3 bg-purple-100 rounded-full mr-4">
                        <Brain size={24} className="text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-purple-800 mb-3">
                          Your Personalized College Roadmap
                        </h3>
                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {aiInsights}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Brain size={32} className="text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Insights Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Get personalized AI insights about your college journey based on your profile and progress.
                  </p>
                  <button
                    onClick={generateAIInsights}
                    disabled={aiLoading || !profileData}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                  >
                    Generate Your Insights
                    <Sparkles size={16} className="ml-2" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Study Abroad - Announcements Tab */}
          {mainTab === 'study-abroad' && studyAbroadSubTab === 'announcements' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <Bell size={18} className="mr-2 text-indigo-600" />
                Latest Announcements
              </h2>
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <MessageSquare size={28} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No announcements yet</p>
                    <p className="text-xs text-gray-400 mt-1">Check back later for updates</p>
                  </div>
                ) : (
                  announcements.map((a) => (
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
          )}
        </div>

        {/* Right Column - Secondary Info and Insights (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                <Clock size={16} className="mr-2 text-amber-600" />
                Upcoming
              </h3>
              <div className="space-y-3">
                {upcomingDeadlines.slice(0, 3).map((note) => {
                  const daysRemaining = getDaysRemaining(note.deadline);
                  return (
                    <div key={note.id} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-amber-800 truncate">{note.task}</h4>
                      <p className="text-xs text-amber-700 mt-1">{formatDate(note.deadline)}</p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full">
                        {daysRemaining <= 0 ? 'Due Today' : `${daysRemaining} days`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Motivational Quote */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border border-indigo-200 p-4">
            <div className="flex items-start">
              <Quote className="h-5 w-5 text-indigo-400 mr-2 flex-shrink-0 mt-1" />
              <div>
                <p className="italic text-indigo-900 text-sm leading-relaxed">{motivationalQuote.text}</p>
                <p className="text-indigo-600 text-xs mt-2">— {motivationalQuote.author}</p>
              </div>
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
              <Bell size={16} className="mr-2 text-indigo-600" />
              Latest News
            </h3>
            <div className="space-y-3">
              {announcements.slice(0, 2).map((announcement) => (
                <div key={announcement.id} className="border-l-4 border-indigo-200 pl-3">
                  <h4 className="text-sm font-medium text-gray-800 truncate">{announcement.title}</h4>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{announcement.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(announcement.created_at)}</p>
                </div>
              ))}
              {announcements.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No recent announcements</p>
              )}
            </div>
          </div>

          {/* Achievement Badge */}
          {acknowledgedNotes > 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border border-green-200 p-4 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-base font-semibold text-green-800">Great Progress!</h3>
              <p className="text-sm text-green-700 mt-1">
                You've completed {acknowledgedNotes} tasks
              </p>
              <div className="mt-2 text-xs text-green-600">
                {Math.floor((acknowledgedNotes / (acknowledgedNotes + pendingNotes)) * 100)}% completion rate
              </div>
            </div>
          )}
        </div>
      </div >

      {/* Confetti Effect for Task Completion */}
      {
        showConfetti && (
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
        )
      }

      {/* AI Insights Modal */}
      {
        showAIAdvisor && (
          <Dialog open={showAIAdvisor} onOpenChange={setShowAIAdvisor}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-purple-600" />
                  Your AI College Advisor
                  <Sparkles className="ml-2 h-4 w-4 text-purple-500" />
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-start">
                    <div className="p-3 bg-purple-100 rounded-full mr-4">
                      <Brain size={24} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-purple-800 mb-3">
                        Your Personalized College Roadmap
                      </h3>
                      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {aiInsights}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Items */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <Target size={16} className="mr-2" />
                      Immediate Actions
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Complete your profile if under 100%</li>
                      <li>• Add more school choices if under 8</li>
                      <li>• Complete pending tasks from mentor</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                      <TrendingUp size={16} className="mr-2" />
                      Long-term Goals
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Research scholarship opportunities</li>
                      <li>• Prepare for standardized tests</li>
                      <li>• Build strong extracurricular profile</li>
                    </ul>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <button
                  onClick={() => setShowAIAdvisor(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Got it!
                </button>
                <button
                  onClick={generateAIInsights}
                  disabled={aiLoading}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                >
                  {aiLoading ? 'Refreshing...' : 'Refresh Insights'}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }

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
    </div >
  );
}

export default Dashboard;
