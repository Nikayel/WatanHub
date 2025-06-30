import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// Import only the icons we actually use to reduce bundle size
import {
    User,
    CheckCircle,
    Clock,
    FileText,
    ChevronRight,
    TrendingUp,
    Lock,
    Upload,
    UserCheck,
    Target,
    BookOpen,
    Handshake,
    Star,
    GraduationCap,
    Shield,
    Users,
    MessageSquare,
    Mail,
    RefreshCcw,
    AlertTriangle
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
import OfflineFellowshipContent from '../components/OfflineFellowshipContent';
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
    const [refreshing, setRefreshing] = useState(false);
    const [dataStale, setDataStale] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        // Only fetch data when we have both user and profile, and not already loading
        if (user && profile && loading) {
            const fetchAllData = async () => {
                try {
                    await Promise.all([
                        fetchStudentStats(),
                        fetchMentorInfo(),
                        checkResumeStatus(),
                        fetchSessionData()
                    ]);
                } catch (error) {
                    console.error('Error fetching dashboard data:', error);
                } finally {
                    setLoading(false);
                }
            };

            fetchAllData();
        } else if (!user && !loading) {
            // User is not authenticated and we're not loading
            console.log('Dashboard: No user, staying in non-loading state');
            setLoading(false);
        } else if (user && !profile) {
            // Set a simple timeout if profile is taking too long
            const profileTimeout = setTimeout(() => {
                console.log('Dashboard: Profile loading timeout, forcing load completion');
                setLoading(false);
            }, 5000); // 5 seconds

            return () => clearTimeout(profileTimeout);
        }
    }, [user, profile, loading]);

    const fetchSessionData = async (timestamp = null) => {
        if (!user?.id) return;

        try {
            // Check if user_sessions table exists before querying
            const { data: tableCheck } = await supabase
                .from('user_sessions')
                .select('id')
                .limit(1);

            if (tableCheck !== null) {
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
                    return;
                }
            }

            // If user_sessions table doesn't exist or query fails, set default values
            setSessionData(prev => ({
                ...prev,
                totalPlatformTime: 0,
                sessionsToday: 0
            }));
        } catch (error) {
            // Don't log errors for missing tables, just set defaults
            setSessionData(prev => ({
                ...prev,
                totalPlatformTime: 0,
                sessionsToday: 0
            }));
        }
    };

    const checkResumeStatus = async (timestamp = null) => {
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

    const fetchMentorInfo = async (timestamp = null) => {
        try {
            if (!user?.id) return;

            // First, check if student is assigned to a mentor
            const { data: assignmentData, error: assignmentError } = await supabase
                .from('mentor_student')
                .select('mentor_id, assigned_at')
                .eq('student_id', user.id)
                .single();

            if (assignmentError || !assignmentData) {
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

    const fetchStudentStats = async (timestamp = null) => {
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

            // Fetch student notes count - handle if mentor_notes table doesn't exist
            let notesCount = 0;
            let acknowledgedNotes = 0;

            try {
                const { data: notesData } = await supabase
                    .from('mentor_notes')
                    .select('acknowledged')
                    .eq('student_id', user.id);

                notesCount = notesData?.length || 0;
                acknowledgedNotes = notesData?.filter(note => note.acknowledged)?.length || 0;
            } catch (notesError) {
                // Table might not exist, use defaults
                notesCount = 0;
                acknowledgedNotes = 0;
            }

            setStudentStats({
                profileCompletion,
                notesCount,
                acknowledgedNotes,
                upcomingMeetings: 0
            });
        } catch (error) {
            console.error('Error fetching student stats:', error);
        }
    };

    // Remove all conflicting timeout logic - let AuthContext handle loading state

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleCompleteProfile = () => {
        if (isProfileComplete) {
            navigate('/profile');
        } else {
            setShowWalkthrough(true);
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

    const handleRefreshData = async () => {
        if (!user || !profile) return;

        setRefreshing(true);
        setDataStale(false);

        try {
            // Clear browser cache for API responses
            if ('caches' in window) {
                try {
                    const cacheNames = await caches.keys();
                    await Promise.all(
                        cacheNames.map(cacheName =>
                            caches.open(cacheName).then(cache => {
                                // Clear API cache entries
                                return cache.keys().then(keys => {
                                    const apiKeys = keys.filter(key =>
                                        key.url.includes('/api/') ||
                                        key.url.includes('supabase')
                                    );
                                    return Promise.all(apiKeys.map(key => cache.delete(key)));
                                });
                            })
                        )
                    );
                } catch (cacheError) {
                    console.log('Cache clearing failed:', cacheError);
                }
            }

            // Force refresh all dashboard data with cache busting
            const timestamp = Date.now();
            await Promise.all([
                fetchStudentStats(timestamp),
                fetchMentorInfo(timestamp),
                checkResumeStatus(timestamp),
                fetchSessionData(timestamp)
            ]);

            // Communicate with service worker to refresh cache
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'FORCE_REFRESH',
                    timestamp: timestamp
                });
            }

            toast.success('Dashboard data refreshed successfully');
        } catch (error) {
            console.error('Error refreshing dashboard data:', error);
            toast.error('Failed to refresh dashboard data. Please try again.');
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center space-y-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-gray-900">Loading Dashboard</h3>
                        <p className="text-sm text-gray-500 mt-1">Preparing your personalized experience...</p>
                    </div>

                    {/* Emergency access button after 3 seconds */}
                    <div className="mt-4">
                        <button
                            onClick={() => {
                                console.log('User requested emergency access');
                                setLoading(false);
                                toast.info('Loading forced complete. Some features may be limited.');
                            }}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm transition-colors"
                        >
                            Continue Anyway
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Handle case where auth failed or no user data
    if (!user && !loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="mb-4">
                        <Shield className="h-16 w-16 text-gray-400 mx-auto" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
                    <p className="text-gray-600 mb-6">Please sign in to access your dashboard.</p>
                    <div className="space-x-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
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

                                <div className="flex items-center space-x-2">
                                    {dataStale && (
                                        <div className="flex items-center space-x-1 text-amber-600 text-sm">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span>Data may be stale</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleRefreshData}
                                        disabled={refreshing}
                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center transition-colors disabled:opacity-50"
                                        title="Refresh dashboard data"
                                    >
                                        <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                    </button>
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
                        <div className="max-w-7xl mx-auto">
                            <FellowshipContent
                                userId={user.id}
                                userRole={profile?.user_type || 'student'}
                            />

                            {/* Mentor Contact Section */}
                            {mentorInfo && (
                                <div className="mt-8 bg-white rounded-xl shadow-md border border-gray-100 p-6">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                                            <Users className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">Your Mentor</h3>
                                            <p className="text-gray-600">{mentorInfo.first_name} {mentorInfo.last_name}</p>
                                        </div>
                                        <div className="ml-auto">
                                            <a
                                                href={`mailto:${mentorInfo.email}`}
                                                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                            >
                                                <Mail className="h-4 w-4" />
                                                <span>Contact</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}
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