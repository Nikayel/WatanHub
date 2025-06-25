import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    GraduationCap,
    Book,
    Award,
    FileText,
    MapPin,
    Phone,
    Mail,
    ChevronRight,
    TrendingUp,
    Lock,
    Unlock,
    Calendar,
    Upload,
    UserCheck,
    Shield,
    Target,
    BookOpen,
    Heart,
    Settings,
    Activity,
    Timer,
    Handshake,
    Play,
    Star,
    Bookmark
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { getStudentProfile } from '../lib/UserRoles';
import { toast } from 'sonner';
import ProfileCompleteness from '../components/ProfileCompleteness';
import StudentSchoolChoicesViewer from '../components/StudentSchoolChoicesViewer';
import SchoolChoiceManager from '../components/SchoolChoiceManager';
import ResumeUpload from '../components/ResumeUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import Three3DBackground from '../components/Three3DBackground';
import StudentDashboardHeader from '../components/StudentDashboardHeader';
import FellowshipSidebar from '../components/Dashboard/FellowshipSidebar';
import FellowshipContent from '../components/Dashboard/FellowshipContent';
import EnglishTestLock from '../components/EnglishTestLock';
import ProfileTutorial from '../components/ProfileTutorial';

const Dashboard = () => {
    const { user, profile, isProfileComplete } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeMainTab, setActiveMainTab] = useState('overview');
    const [activeSubTab, setActiveSubTab] = useState('dashboard');
    const [mentorInfo, setMentorInfo] = useState(null);
    const [hasResume, setHasResume] = useState(false);
    const [sessionData, setSessionData] = useState({
        currentSessionTime: 0,
        totalPlatformTime: 0,
        sessionsToday: 0
    });
    const [studentStats, setStudentStats] = useState({
        profileCompletion: 0,
        notesCount: 0,
        acknowledgedNotes: 0,
        upcomingMeetings: 0
    });

    // Profile walkthrough state
    const [showWalkthrough, setShowWalkthrough] = useState(false);

    // Session tracking
    const [sessionStartTime, setSessionStartTime] = useState(Date.now());

    useEffect(() => {
        if (user && profile) {
            fetchStudentStats();
            fetchMentorInfo();
            checkResumeStatus();
            initializeSession();
            fetchSessionData();
        }
    }, [user, profile]);

    // Session timer
    useEffect(() => {
        const timer = setInterval(() => {
            setSessionData(prev => ({
                ...prev,
                currentSessionTime: Math.floor((Date.now() - sessionStartTime) / 1000)
            }));
        }, 1000);

        return () => clearInterval(timer);
    }, [sessionStartTime]);

    // Save session on unmount
    useEffect(() => {
        const handleBeforeUnload = () => {
            saveCurrentSession();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            saveCurrentSession();
        };
    }, []);

    const initializeSession = () => {
        const startTime = Date.now();
        setSessionStartTime(startTime);
        localStorage.setItem('sessionStartTime', startTime.toString());
    };

    const saveCurrentSession = async () => {
        if (!user?.id) return;

        const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
        if (sessionDuration < 10) return; // Don't save sessions less than 10 seconds

        try {
            await supabase
                .from('user_sessions')
                .insert({
                    user_id: user.id,
                    session_start: new Date(sessionStartTime).toISOString(),
                    session_end: new Date().toISOString(),
                    duration_seconds: sessionDuration
                });
        } catch (error) {
            console.error('Error saving session:', error);
        }
    };

    const fetchSessionData = async () => {
        if (!user?.id) return;

        try {
            // Get today's sessions
            const today = new Date().toISOString().split('T')[0];

            const { data: todaySessions, error: todayError } = await supabase
                .from('user_sessions')
                .select('duration_seconds')
                .eq('user_id', user.id)
                .gte('session_start', `${today}T00:00:00`)
                .lt('session_start', `${today}T23:59:59`);

            // Get total platform time
            const { data: allSessions, error: totalError } = await supabase
                .from('user_sessions')
                .select('duration_seconds')
                .eq('user_id', user.id);

            if (!todayError && !totalError) {
                const totalPlatformTime = allSessions?.reduce((sum, session) => sum + (session.duration_seconds || 0), 0) || 0;
                const sessionsToday = todaySessions?.length || 0;

                setSessionData(prev => ({
                    ...prev,
                    totalPlatformTime,
                    sessionsToday
                }));
            }
        } catch (error) {
            console.error('Error fetching session data:', error);
        }
    };

    const checkResumeStatus = async () => {
        if (!user?.id) return;

        try {
            const { data, error } = await supabase
                .from('student_resumes')
                .select('id')
                .eq('student_id', user.id)
                .single();

            setHasResume(!!data && !error);
        } catch (error) {
            setHasResume(false);
        }
    };

    const fetchMentorInfo = async () => {
        try {
            if (!user?.id) return;

            // First, check if student is assigned to a mentor
            const { data: assignmentData, error: assignmentError } = await supabase
                .from('mentor_student')
                .select('mentor_id, assigned_at')
                .eq('student_id', user.id)
                .single();

            if (assignmentError || !assignmentData) {
                console.log('No mentor assignment found');
                setMentorInfo(null);
                return;
            }

            // Get mentor profile information
            const { data: mentorProfile, error: mentorError } = await supabase
                .from('profiles')
                .select('first_name, last_name, email, bio, education_level')
                .eq('id', assignmentData.mentor_id)
                .single();

            if (mentorError) {
                console.error('Error fetching mentor profile:', mentorError);
                return;
            }

            // Get mentor application details for additional info
            const { data: mentorApplication, error: appError } = await supabase
                .from('mentorapplications')
                .select('full_name, languages, bio, available_hours_per_week')
                .eq('email', mentorProfile.email)
                .eq('status', 'approved')
                .single();

            setMentorInfo({
                ...mentorProfile,
                ...(mentorApplication || {}),
                assigned_at: assignmentData.assigned_at
            });

        } catch (error) {
            console.error('Error fetching mentor info:', error);
        }
    };

    const fetchStudentStats = async () => {
        try {
            // Calculate profile completion with comprehensive field list
            const fields = [
                'first_name', 'last_name', 'email', 'education_level', 'english_level',
                'date_of_birth', 'place_of_birth', 'place_of_residence', 'bio', 'gender',
                'religion', 'interests', 'province', 'school_type', 'household_income_band',
                'parental_education', 'internet_speed', 'phone_number'
            ];
            const completedFields = fields.filter(field => {
                const value = profile[field];
                return value && value.toString().trim() !== '';
            }).length;
            const profileCompletion = Math.round((completedFields / fields.length) * 100);

            // Fetch student notes count
            const { data: notesData } = await supabase
                .from('mentor_notes')
                .select('acknowledged')
                .eq('student_id', user.id);

            const notesCount = notesData?.length || 0;
            const acknowledgedNotes = notesData?.filter(note => note.acknowledged)?.length || 0;

            setStudentStats({
                profileCompletion,
                notesCount,
                acknowledgedNotes,
                upcomingMeetings: 0
            });
        } catch (error) {
            console.error('Error fetching student stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteProfile = () => {
        if (isProfileComplete) {
            navigate('/profile');
        } else {
            setShowWalkthrough(true);
        }
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    };

    const formatTotalTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return 'Less than 1m';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Three3DBackground />
            <StudentDashboardHeader />

            {/* Profile Tutorial */}
            <ProfileTutorial />

            {/* Full-width Instagram-like Layout */}
            <div className="w-full">
                {/* Header Section */}
                <div className="bg-white shadow-sm border-b sticky top-0 z-40">
                    <div className="w-full px-4 sm:px-6 lg:px-20 xl:px-32">
                        <div className="py-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-800 font-bold text-lg">
                                            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                                        </div>
                                        <div>
                                            <h1 className="text-xl font-bold text-gray-900">
                                                {profile?.first_name} {profile?.last_name}
                                            </h1>
                                            {profile?.student_id && (
                                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                    <Shield className="h-3 w-3" />
                                                    <span>ID: {profile.student_id}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-600">
                                        <div className="flex items-center space-x-1">
                                            <Timer className="h-4 w-4" />
                                            <span>{formatTime(sessionData.currentSessionTime)}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Activity className="h-4 w-4" />
                                            <span>{sessionData.sessionsToday} today</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Tab Navigation */}
                            <div className="flex space-x-8">
                                <button
                                    onClick={() => setActiveMainTab('overview')}
                                    className={`pb-2 border-b-2 transition-colors font-medium ${activeMainTab === 'overview'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveMainTab('fellowship')}
                                    className={`pb-2 border-b-2 transition-colors font-medium ${activeMainTab === 'fellowship'
                                        ? 'border-indigo-600 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Fellowship
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Full Width */}
                <div className="w-full px-4 sm:px-6 lg:px-20 xl:px-32 py-6">
                    {activeMainTab === 'overview' && (
                        <div className="grid grid-cols-12 gap-6">
                            {/* Left Sidebar - 3 columns */}
                            <div className="col-span-12 lg:col-span-3 space-y-6">
                                {/* Quick Stats */}
                                <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <User className="h-4 w-4 text-indigo-600" />
                                                <span className="text-sm text-gray-600">Profile</span>
                                            </div>
                                            <span className="text-sm font-bold text-indigo-600">{studentStats.profileCompletion}%</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <FileText className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm text-gray-600">Notes</span>
                                            </div>
                                            <span className="text-sm font-bold text-blue-600">{studentStats.notesCount}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span className="text-sm text-gray-600">Reviewed</span>
                                            </div>
                                            <span className="text-sm font-bold text-green-600">{studentStats.acknowledgedNotes}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Clock className="h-4 w-4 text-purple-600" />
                                                <span className="text-sm text-gray-600">Platform Time</span>
                                            </div>
                                            <span className="text-sm font-bold text-purple-600">{formatTotalTime(sessionData.totalPlatformTime)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Profile Completeness - Only show if incomplete */}
                                {studentStats.profileCompletion < 100 && (
                                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                        <div className="flex items-center space-x-3 mb-4">
                                            <Target className="h-6 w-6 text-amber-600" />
                                            <h3 className="font-semibold text-gray-900">Complete Profile</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">Progress</span>
                                                <span className="text-sm font-bold text-amber-600">
                                                    {studentStats.profileCompletion}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-amber-600 h-2 rounded-full transition-all duration-500"
                                                    style={{ width: `${studentStats.profileCompletion}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-600 mb-4">
                                                Complete your profile to unlock all features and get better mentor matching.
                                            </p>
                                            <button
                                                onClick={handleCompleteProfile}
                                                className="w-full text-sm bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center"
                                            >
                                                {isProfileComplete ? 'Edit Profile' : 'Complete Profile'}
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Mentor Info */}
                                {mentorInfo ? (
                                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                        <div className="flex items-center space-x-3 mb-4">
                                            <UserCheck className="h-6 w-6 text-green-600" />
                                            <h3 className="font-semibold text-gray-900">Your Mentor</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-800 font-bold">
                                                    {mentorInfo.full_name ?
                                                        mentorInfo.full_name.charAt(0) :
                                                        (mentorInfo.first_name ? mentorInfo.first_name.charAt(0) : 'M')
                                                    }
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {mentorInfo.full_name || `${mentorInfo.first_name || ''} ${mentorInfo.last_name || ''}`.trim()}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Assigned {new Date(mentorInfo.assigned_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            {mentorInfo.languages && (
                                                <div className="flex flex-wrap gap-1">
                                                    {(Array.isArray(mentorInfo.languages) ? mentorInfo.languages : [mentorInfo.languages]).map((lang, index) => (
                                                        <span key={index} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                                            {lang}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {mentorInfo.bio && (
                                                <p className="text-xs text-gray-600 line-clamp-3">
                                                    {mentorInfo.bio}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                        <div className="flex items-center space-x-3 mb-4">
                                            <Users className="h-6 w-6 text-gray-400" />
                                            <h3 className="font-semibold text-gray-900">Mentor Assignment</h3>
                                        </div>
                                        <div className="text-center py-4">
                                            <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                            <p className="text-sm text-gray-600">
                                                You'll be assigned a mentor soon. Complete your profile to help us match you better!
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Main Content - 9 columns */}
                            <div className="col-span-12 lg:col-span-9">
                                {/* Tab Navigation */}
                                <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-6">
                                    <div className="border-b border-gray-200">
                                        <div className="flex overflow-x-auto">
                                            {[
                                                { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                                                { id: 'academics', label: 'Academics', icon: GraduationCap },
                                                ...(hasResume ? [] : [{ id: 'resume', label: 'Resume', icon: Upload }]),
                                                { id: 'notes', label: 'Notes', icon: FileText }
                                            ].map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveSubTab(tab.id)}
                                                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeSubTab === tab.id
                                                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <tab.icon className="h-4 w-4" />
                                                    <span>{tab.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tab Content */}
                                    <div className="p-6">
                                        {activeSubTab === 'dashboard' && (
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-bold text-gray-900">Welcome to Your Dashboard</h3>

                                                {/* Current Session Activity */}
                                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                                                    <h4 className="font-semibold text-blue-900 mb-4">Current Session</h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                                    <Timer className="h-5 w-5 text-blue-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">Session Time</p>
                                                                    <p className="text-xl font-bold text-blue-600">{formatTime(sessionData.currentSessionTime)}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                                    <Activity className="h-5 w-5 text-purple-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">Today's Sessions</p>
                                                                    <p className="text-xl font-bold text-purple-600">{sessionData.sessionsToday}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                                    <Clock className="h-5 w-5 text-green-600" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-medium text-gray-900">Total Time</p>
                                                                    <p className="text-xl font-bold text-green-600">{formatTotalTime(sessionData.totalPlatformTime)}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Quick Actions Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <button
                                                        onClick={() => setActiveSubTab('academics')}
                                                        className="p-6 text-left border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <GraduationCap className="h-8 w-8 text-indigo-600 group-hover:scale-110 transition-transform" />
                                                            <Lock className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                        <h4 className="font-semibold text-gray-900 mb-2">Academics</h4>
                                                        <p className="text-sm text-gray-500">Access tests and academic resources</p>
                                                    </button>

                                                    {!hasResume && (
                                                        <button
                                                            onClick={() => setActiveSubTab('resume')}
                                                            className="p-6 text-left border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors group"
                                                        >
                                                            <div className="flex items-center justify-between mb-3">
                                                                <Upload className="h-8 w-8 text-green-600 group-hover:scale-110 transition-transform" />
                                                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Required</span>
                                                            </div>
                                                            <h4 className="font-semibold text-gray-900 mb-2">Upload Resume</h4>
                                                            <p className="text-sm text-gray-500">Share your CV with mentors</p>
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => setActiveSubTab('notes')}
                                                        className="p-6 text-left border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <FileText className="h-8 w-8 text-blue-600 group-hover:scale-110 transition-transform" />
                                                            {studentStats.notesCount > 0 && (
                                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{studentStats.notesCount}</span>
                                                            )}
                                                        </div>
                                                        <h4 className="font-semibold text-gray-900 mb-2">Mentor Notes</h4>
                                                        <p className="text-sm text-gray-500">View feedback and guidance</p>
                                                    </button>

                                                    <button
                                                        onClick={() => navigate('/profile')}
                                                        className="p-6 text-left border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-colors group"
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <User className="h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform" />
                                                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">{studentStats.profileCompletion}%</span>
                                                        </div>
                                                        <h4 className="font-semibold text-gray-900 mb-2">Profile</h4>
                                                        <p className="text-sm text-gray-500">Manage your personal information</p>
                                                    </button>

                                                    <button
                                                        onClick={() => setActiveMainTab('fellowship')}
                                                        className="p-6 text-left border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors group"
                                                    >
                                                        <div className="flex items-center justify-between mb-3">
                                                            <Handshake className="h-8 w-8 text-indigo-600 group-hover:scale-110 transition-transform" />
                                                            <Star className="h-5 w-5 text-amber-500" />
                                                        </div>
                                                        <h4 className="font-semibold text-gray-900 mb-2">Fellowship</h4>
                                                        <p className="text-sm text-gray-500">Join our upcoming cohort</p>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {activeSubTab === 'academics' && (
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-bold text-gray-900">Academic Resources</h3>

                                                {/* English Test Lock Component */}
                                                <div className="bg-white border border-gray-200 rounded-xl p-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center space-x-3">
                                                            <GraduationCap className="h-6 w-6 text-indigo-600" />
                                                            <h4 className="font-medium text-gray-900">English Assessment</h4>
                                                        </div>
                                                        <Lock className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                                                <Lock className="h-6 w-6 text-gray-500" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-gray-700 mb-1">Assessment Locked</h4>
                                                                <p className="text-sm text-gray-600">
                                                                    Your mentor or admin will unlock this when you're ready to take the assessment.
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Other Academic Resources */}
                                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                                    <div className="flex items-center space-x-3">
                                                        <BookOpen className="h-8 w-8 text-gray-400" />
                                                        <div>
                                                            <h4 className="font-medium text-gray-900">More Resources Coming Soon</h4>
                                                            <p className="text-sm text-gray-500">
                                                                Additional academic resources will be available in future updates.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {activeSubTab === 'resume' && !hasResume && (
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-bold text-gray-900">Resume Upload</h3>
                                                <ResumeUpload
                                                    showTitle={false}
                                                    onUploadSuccess={() => {
                                                        setHasResume(true);
                                                        setActiveSubTab('dashboard');
                                                        toast.success('Resume uploaded successfully! The upload option has been removed from your dashboard.');
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {activeSubTab === 'notes' && (
                                            <div className="space-y-6">
                                                <h3 className="text-xl font-bold text-gray-900">Mentor Notes</h3>

                                                <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                                                    <div className="text-center">
                                                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                                        <h4 className="font-medium text-gray-900 mb-2">Notes Coming Soon</h4>
                                                        <p className="text-sm text-gray-500">
                                                            Your mentor's notes and feedback will appear here once they start providing guidance.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeMainTab === 'fellowship' && (
                        <div className="max-w-5xl mx-auto">
                            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Handshake className="h-10 w-10 text-indigo-600" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Fellowship Program</h2>
                                    <p className="text-xl text-gray-600 mb-8">
                                        Join our upcoming cohort and take your education journey to the next level.
                                    </p>

                                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-8 mb-8">
                                        <h3 className="text-xl font-semibold text-indigo-900 mb-3">Ready to Apply?</h3>
                                        <p className="text-indigo-700 mb-6 text-lg">
                                            Contact your mentor or reach out to us directly to learn more about enrollment in our upcoming fellowship cohort.
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                            {mentorInfo ? (
                                                <div className="flex items-center space-x-3 text-indigo-700 bg-white px-6 py-3 rounded-lg border border-indigo-200">
                                                    <Mail className="h-5 w-5" />
                                                    <span className="font-medium">
                                                        Contact your mentor: {mentorInfo.email || mentorInfo.full_name}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-3 text-indigo-700 bg-white px-6 py-3 rounded-lg border border-indigo-200">
                                                    <Mail className="h-5 w-5" />
                                                    <span className="font-medium">Email us: watanyouthgp@gmail.com</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                                        <div className="bg-gray-50 rounded-lg p-6">
                                            <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                                <GraduationCap className="h-7 w-7 text-blue-600" />
                                            </div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Academic Excellence</h4>
                                            <p className="text-sm text-gray-600">
                                                Advanced learning opportunities with dedicated mentorship and resources.
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-6">
                                            <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                                <Users className="h-7 w-7 text-green-600" />
                                            </div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Community</h4>
                                            <p className="text-sm text-gray-600">
                                                Connect with like-minded peers and build lasting professional relationships.
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-6">
                                            <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                                <Target className="h-7 w-7 text-purple-600" />
                                            </div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Career Growth</h4>
                                            <p className="text-sm text-gray-600">
                                                Gain skills and experience that will accelerate your career trajectory.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Profile Walkthrough Dialog */}
            {showWalkthrough && (
                <Dialog open={showWalkthrough} onOpenChange={setShowWalkthrough}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                                <Target className="h-5 w-5 text-indigo-600" />
                                <span>Complete Your Profile</span>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                To get the best mentorship experience, we need to know more about you.
                                Complete your profile to unlock all features and get matched with the right mentor.
                            </p>
                            <div className="bg-indigo-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-indigo-900">Current Progress</span>
                                    <span className="text-sm font-bold text-indigo-600">
                                        {studentStats.profileCompletion}%
                                    </span>
                                </div>
                                <div className="w-full bg-indigo-200 rounded-full h-2">
                                    <div
                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${studentStats.profileCompletion}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <button
                                onClick={() => setShowWalkthrough(false)}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                            >
                                Later
                            </button>
                            <button
                                onClick={() => {
                                    setShowWalkthrough(false);
                                    navigate('/profile');
                                }}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
                            >
                                Complete Profile <ChevronRight className="h-4 w-4 ml-1" />
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default Dashboard; 