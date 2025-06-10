import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    User,
    Bell,
    CheckCircle,
    Clock,
    CheckSquare,
    Loader,
    Sparkles,
    Brain,
    BarChart,
    LineChart,
    School,
    Edit,
    MessageSquare,
    Users,
    GraduationCap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { getStudentProfile } from '../lib/UserRoles';
import { toast } from 'sonner';
import ProfileCompleteness from '../components/ProfileCompleteness';
import StudentSchoolChoicesViewer from '../components/StudentSchoolChoicesViewer';
import SchoolChoiceManager from '../components/SchoolChoiceManager';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import Three3DBackground from '../components/Three3DBackground';
import StudentDashboardHeader from '../components/StudentDashboardHeader';
import FellowshipSidebar from '../components/Dashboard/FellowshipSidebar';
import FellowshipContent from '../components/Dashboard/FellowshipContent';

const Dashboard = () => {
    const { user } = useAuth();

    // State management
    const [mainTab, setMainTab] = useState('fellowship');
    const [subTab, setSubTab] = useState('assignments');
    const [studyAbroadSubTab, setStudyAbroadSubTab] = useState('overview');
    const [profileData, setProfileData] = useState(null);
    const [mentorNotes, setMentorNotes] = useState([]);
    const [assignedMentor, setAssignedMentor] = useState(null);
    const [acknowledgedNotes, setAcknowledgedNotes] = useState(0);
    const [pendingNotes, setPendingNotes] = useState(0);
    const [announcements, setAnnouncements] = useState([]);
    const [showWelcomePopup, setShowWelcomePopup] = useState(false);
    const [aiInsights, setAiInsights] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [showAIAdvisor, setShowAIAdvisor] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [analyticsData, setAnalyticsData] = useState({
        profileCompleteness: 0,
        schoolChoicesCount: 0,
        tasksCompleted: 0,
        avgResponseTime: 0
    });



    // Fetch assigned mentor
    const fetchMentor = async () => {
        if (!user?.id) return;

        try {
            // First get the student ID from the students table using user_id
            const { data: studentData, error: studentError } = await supabase
                .from('students')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (studentError || !studentData) {
                console.log('Student record not found:', studentError);
                return;
            }

            // Now get the mentor connection using the student ID
            const { data: mentorConnection, error } = await supabase
                .from('mentor_student')
                .select(`
                    *,
                    mentors:mentor_id (
                        id, 
                        full_name,
                        bio,
                        languages,
                        available_hours_per_week,
                        users:user_id (
                            email
                        )
                    )
                `)
                .eq('student_id', studentData.id)
                .limit(1)
                .single();

            if (error) {
                console.log('No mentor assigned yet:', error);
                return;
            }

            if (mentorConnection && mentorConnection.mentors) {
                setAssignedMentor(mentorConnection.mentors);
                await fetchMentorNotes(mentorConnection.mentor_id, user.id);
            }
        } catch (error) {
            console.error('Error fetching mentor:', error);
        }
    };

    // Fetch mentor notes/tasks
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

            // Count acknowledged and pending notes
            const acknowledged = data?.filter(note => note.acknowledged)?.length || 0;
            const pending = data?.filter(note => !note.acknowledged)?.length || 0;

            setAcknowledgedNotes(acknowledged);
            setPendingNotes(pending);



        } catch (error) {
            console.error('Error fetching mentor notes:', error);
        }
    };

    // Acknowledge a task
    const acknowledgeNote = async (noteId) => {
        try {
            const { error } = await supabase
                .from('mentor_notes')
                .update({
                    acknowledged: true,
                    acknowledged_at: new Date().toISOString()
                })
                .eq('id', noteId);

            if (error) throw error;

            // Show confetti effect
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);

            // Refresh mentor notes
            if (assignedMentor && user?.id) {
                await fetchMentorNotes(assignedMentor.id, user.id);
            }

            toast.success('Task completed! Great job! 🎉');
        } catch (error) {
            console.error('Error acknowledging note:', error);
            toast.error('Failed to update task status');
        }
    };

    // Fetch student profile
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

    // Fetch announcements
    useEffect(() => {
        const fetchAnnouncements = async () => {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });
            if (!error) setAnnouncements(data);
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

    // Welcome popup logic
    useEffect(() => {
        if (!user) return;

        const isNewSignup = localStorage.getItem('newSignup') === 'true';
        const forceWelcome = localStorage.getItem('forceWelcome') === 'true';

        if (isNewSignup || forceWelcome) {
            setShowWelcomePopup(true);
            localStorage.removeItem('newSignup');
            localStorage.removeItem('forceWelcome');
        }
    }, [user]);

    // Fetch mentor on mount
    useEffect(() => {
        fetchMentor();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const closeWelcomePopup = () => {
        setShowWelcomePopup(false);
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });

    const getDaysRemaining = (deadlineString) => {
        if (!deadlineString) return null;
        const deadline = new Date(deadlineString);
        const now = new Date();
        const diffTime = deadline - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Fetch analytics data
    const fetchAnalyticsData = useCallback(async () => {
        if (!user?.id) return;

        try {
            // Profile completeness calculation - based on actual profile schema
            const criticalFields = ['first_name', 'last_name', 'email'];
            const veryImportantFields = ['date_of_birth', 'gender', 'phone_number', 'education_level', 'english_level'];
            const importantFields = ['interests', 'bio', 'place_of_birth', 'place_of_residence'];
            const optionalFields = ['gpa', 'toefl_score', 'extracurricular_activities', 'province', 'school_type', 'religion'];

            const allFields = [...criticalFields, ...veryImportantFields, ...importantFields, ...optionalFields];
            const completedFields = allFields.filter(field => {
                const value = profileData?.[field];
                return value !== null && value !== undefined && value !== '' && value !== '[]' && value.toString().trim() !== '';
            });

            const completeness = Math.min(100, Math.round((completedFields.length / allFields.length) * 100));

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
                    return Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
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
    }, [user?.id, profileData, mentorNotes, acknowledgedNotes]);

    // Generate AI insights
    const generateAIInsights = async () => {
        if (!user?.id || !profileData) {
            toast.error('Complete your profile first to get personalized insights');
            return;
        }

        setAiLoading(true);
        try {
            const prompt = `As an expert college counselor, analyze this student profile and provide personalized advice:

Student Profile:
- Name: ${profileData.first_name} ${profileData.last_name}
- Education Level: ${profileData.education_level}
- GPA: ${profileData.gpa || 'Not provided'}
- English Level: ${profileData.english_level}
- TOEFL Score: ${profileData.toefl_score || 'Not provided'}
- Interests: ${profileData.interests || 'Not provided'}
- Bio: ${profileData.bio || 'Not provided'}
- Profile Completeness: ${analyticsData.profileCompleteness}%
- School Choices: ${analyticsData.schoolChoicesCount}
- Tasks Completed: ${analyticsData.tasksCompleted}

Please provide:
1. Personalized college application strategy
2. Specific recommendations for improving their profile
3. Timeline suggestions for application deadlines
4. Scholarship and financial aid opportunities they should explore
5. Academic and extracurricular recommendations

Keep the response under 500 words and make it actionable and encouraging.`;

            const response = await fetch('/api/gemini-proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error('Failed to get AI insights');
            }

            const data = await response.json();
            setAiInsights(data.response || 'Unable to generate insights at the moment.');
            setShowAIAdvisor(true);
        } catch (error) {
            console.error('Error generating AI insights:', error);
            toast.error('Failed to generate insights. Please try again.');
        } finally {
            setAiLoading(false);
        }
    };

    // Fetch analytics when dependencies change
    useEffect(() => {
        fetchAnalyticsData();
    }, [fetchAnalyticsData]);

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

    return (
        <div className="min-h-screen bg-gray-50">
            <Three3DBackground />
            <StudentDashboardHeader />
            <WelcomeDialog />

            {/* Navigation Header */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex overflow-x-auto scrollbar-hide">
                        {[
                            { key: 'fellowship', label: 'Fellowship', icon: Users, count: pendingNotes },
                            { key: 'study-abroad', label: 'Study Abroad', icon: School, count: analyticsData.schoolChoicesCount },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setMainTab(tab.key)}
                                className={`py-3 px-6 text-center font-medium text-base whitespace-nowrap flex items-center ${mainTab === tab.key
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

                    {/* Sub-tabs for Study Abroad only */}
                    {mainTab === 'study-abroad' && (
                        <div className="flex overflow-x-auto scrollbar-hide bg-gray-50 -mx-4 sm:-mx-6 px-4 sm:px-6">
                            {[
                                { key: 'overview', label: 'Overview', icon: LineChart },
                                { key: 'schools', label: 'Schools', icon: School, count: analyticsData.schoolChoicesCount },
                                { key: 'insights', label: 'AI Insights', icon: Brain },
                                { key: 'announcements', label: 'News', icon: Bell },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setStudyAbroadSubTab(tab.key)}
                                    className={`py-2 px-4 text-center font-medium text-sm whitespace-nowrap flex items-center ${studyAbroadSubTab === tab.key
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
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {mainTab === 'fellowship' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Fellowship Sidebar */}
                        <FellowshipSidebar
                            subTab={subTab}
                            setSubTab={setSubTab}
                            pendingNotes={pendingNotes}
                            analyticsData={analyticsData}
                            assignedMentor={assignedMentor}
                        />

                        {/* Fellowship Content */}
                        <FellowshipContent
                            subTab={subTab}
                            assignedMentor={assignedMentor}
                            mentorNotes={mentorNotes}
                            acknowledgeNote={acknowledgeNote}
                            formatDate={formatDate}
                            getDaysRemaining={getDaysRemaining}
                        />
                    </div>
                ) : (
                    /* Study Abroad Content */
                    <div className="space-y-6">
                        {/* Study Abroad Overview */}
                        {studyAbroadSubTab === 'overview' && (
                            <>
                                {profileData && (
                                    <ProfileCompleteness
                                        profile={profileData}
                                        onComplete={() => toast.success('Dismissed profile analysis')}
                                    />
                                )}

                                {/* Analytics Dashboard */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                                            <BarChart className="mr-2 h-5 w-5 text-indigo-600" />
                                            Your Progress Analytics
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
                                            {aiLoading ? 'Analyzing...' : 'Get AI Insights'}
                                            <Sparkles size={14} className="ml-1" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Analytics Cards */}
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
                                            <p className="text-xs text-gray-600 mb-2">Higher completion = better guidance</p>
                                            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${analyticsData.profileCompleteness}%` }}
                                                />
                                            </div>
                                            {analyticsData.profileCompleteness < 100 ? (
                                                <Link
                                                    to="/profile"
                                                    className="inline-flex items-center text-xs text-blue-700 hover:text-blue-800 font-medium"
                                                >
                                                    <Edit size={12} className="mr-1" />
                                                    Complete Profile
                                                </Link>
                                            ) : (
                                                <div className="text-xs text-green-700 font-medium flex items-center">
                                                    <CheckCircle size={12} className="mr-1" />
                                                    100% Complete!
                                                </div>
                                            )}
                                        </div>

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
                                            <p className="text-xs text-gray-600">Target: 8-12 schools total</p>
                                        </div>

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
                                            <p className="text-xs text-gray-600">{pendingNotes} remaining</p>
                                        </div>

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
                                            <p className="text-xs text-gray-600">Days to complete tasks</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Schools Tab */}
                        {studyAbroadSubTab === 'schools' && (
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="p-3 bg-blue-100 rounded-xl mr-4">
                                            <GraduationCap size={24} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">Your College List</h2>
                                            <p className="text-blue-700 text-sm">Build a balanced portfolio of schools</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                    <StudentSchoolChoicesViewer studentId={user?.id} forMentor={false} />
                                </div>

                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <School className="mr-2 text-indigo-600" size={20} />
                                        Add New School
                                    </h3>
                                    <SchoolChoiceManager />
                                </div>
                            </div>
                        )}

                        {/* AI Insights Tab */}
                        {studyAbroadSubTab === 'insights' && (
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
                                        {aiLoading ? 'Generating...' : 'Get Insights'}
                                    </button>
                                </div>

                                {aiInsights ? (
                                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
                                        <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                            {aiInsights}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Brain size={32} className="mx-auto text-gray-400 mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Insights Yet</h3>
                                        <p className="text-gray-600 mb-4">
                                            Get personalized AI insights about your college journey.
                                        </p>
                                        <button
                                            onClick={generateAIInsights}
                                            disabled={aiLoading || !profileData}
                                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50"
                                        >
                                            Generate Insights
                                            <Sparkles size={16} className="ml-2" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Announcements Tab */}
                        {studyAbroadSubTab === 'announcements' && (
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
                                        </div>
                                    ) : (
                                        announcements.map((announcement) => (
                                            <div key={announcement.id} className="bg-white border border-gray-100 rounded-lg p-4 hover:shadow-sm transition">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-base font-semibold text-indigo-700">{announcement.title}</h3>
                                                    <span className="text-xs text-gray-400">{formatDate(announcement.created_at)}</span>
                                                </div>
                                                <p className="text-sm text-gray-700">{announcement.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Confetti Effect */}
            {
                showConfetti && (
                    <div className="fixed inset-0 pointer-events-none z-50">
                        <div className="absolute top-0 left-0 w-full h-full">
                            {Array.from({ length: 100 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute animate-pulse"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        top: `-5%`,
                                        backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                                        width: `${Math.random() * 10 + 5}px`,
                                        height: `${Math.random() * 10 + 5}px`,
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
                                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {aiInsights}
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
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )
            }

            <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
        </div >
    );
};

export default Dashboard; 