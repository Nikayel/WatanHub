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
    Calendar
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
import EnglishTestLock from '../components/EnglishTestLock';

const Dashboard = () => {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [studentStats, setStudentStats] = useState({
        profileCompletion: 0,
        notesCount: 0,
        acknowledgedNotes: 0,
        upcomingMeetings: 0
    });

    useEffect(() => {
        if (user && profile) {
            fetchStudentStats();
        }
    }, [user, profile]);

    const fetchStudentStats = async () => {
        try {
            // Calculate profile completion
            const fields = [
                'first_name', 'last_name', 'email', 'education_level',
                'english_level', 'bio', 'date_of_birth', 'place_of_birth',
                'place_of_residence', 'interests', 'province', 'school_type'
            ];
            const completedFields = fields.filter(field => profile[field]).length;
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
                upcomingMeetings: 0 // Will be implemented when meetings feature is added
            });
        } catch (error) {
            console.error('Error fetching student stats:', error);
        } finally {
            setLoading(false);
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

            {/* Mobile-Optimized Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-4">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Student Dashboard</h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Welcome back, {profile?.first_name}!
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Mobile-Responsive Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6">
                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500">Profile Complete</p>
                                <p className="text-xl sm:text-2xl font-bold text-indigo-600">
                                    {studentStats.profileCompletion}%
                                </p>
                            </div>
                            <User className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500">Mentor Notes</p>
                                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                                    {studentStats.notesCount}
                                </p>
                            </div>
                            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500">Acknowledged</p>
                                <p className="text-xl sm:text-2xl font-bold text-green-600">
                                    {studentStats.acknowledgedNotes}
                                </p>
                            </div>
                            <Award className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-3 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs sm:text-sm text-gray-500">Meetings</p>
                                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                                    {studentStats.upcomingMeetings}
                                </p>
                            </div>
                            <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                        </div>
                    </div>
                </div>

                {/* Mobile-Responsive Tab Navigation */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-6">
                    <div className="border-b border-gray-200">
                        <div className="flex overflow-x-auto">
                            {[
                                { id: 'overview', label: 'Overview', icon: TrendingUp },
                                { id: 'profile', label: 'Profile', icon: User },
                                { id: 'tests', label: 'Tests', icon: Award },
                                { id: 'notes', label: 'Notes', icon: FileText }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-indigo-600 text-indigo-600 bg-indigo-50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    <span className="hidden sm:inline">{tab.label}</span>
                                    <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-4 sm:p-6">
                        {activeTab === 'overview' && (
                            <div className="space-y-4 sm:space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Dashboard Overview</h3>

                                {/* Profile Completion Progress */}
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 sm:p-6 border border-indigo-100">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-gray-900">Profile Completion</h4>
                                        <span className="text-sm font-medium text-indigo-600">
                                            {studentStats.profileCompletion}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                        <div
                                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${studentStats.profileCompletion}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Complete your profile to unlock more features and get better mentor support.
                                    </p>
                                    {studentStats.profileCompletion < 100 && (
                                        <button
                                            onClick={() => setActiveTab('profile')}
                                            className="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center"
                                        >
                                            Complete Profile <ChevronRight className="h-4 w-4 ml-1" />
                                        </button>
                                    )}
                                </div>

                                {/* Quick Actions Grid - Mobile Responsive */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <button
                                        onClick={() => setActiveTab('tests')}
                                        className="p-4 text-left border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                                    >
                                        <Award className="h-6 w-6 text-indigo-600 mb-2" />
                                        <p className="font-medium text-gray-900">English Test</p>
                                        <p className="text-sm text-gray-500">Take assessments and tests</p>
                                    </button>

                                    <button
                                        onClick={() => setActiveTab('notes')}
                                        className="p-4 text-left border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors"
                                    >
                                        <FileText className="h-6 w-6 text-green-600 mb-2" />
                                        <p className="font-medium text-gray-900">Mentor Notes</p>
                                        <p className="text-sm text-gray-500">View feedback and guidance</p>
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tests' && (
                            <div className="space-y-4 sm:space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Tests & Assessments</h3>

                                {/* English Test Lock Component */}
                                <EnglishTestLock isStudent={true} />

                                {/* Other Tests Coming Soon */}
                                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <Clock className="h-8 w-8 text-gray-400" />
                                        <div>
                                            <h4 className="font-medium text-gray-900">More Tests Coming Soon</h4>
                                            <p className="text-sm text-gray-500">
                                                Additional assessments will be available in future updates.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="space-y-4 sm:space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">My Profile</h3>

                                {/* Profile Information Grid - Mobile Responsive */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <span>{profile?.first_name} {profile?.last_name}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                    <span className="break-all">{profile?.email}</span>
                                                </div>
                                                {profile?.phone_number && (
                                                    <div className="flex items-center space-x-2">
                                                        <Phone className="h-4 w-4 text-gray-400" />
                                                        <span>{profile.phone_number}</span>
                                                    </div>
                                                )}
                                                {profile?.place_of_residence && (
                                                    <div className="flex items-center space-x-2">
                                                        <MapPin className="h-4 w-4 text-gray-400" />
                                                        <span>{profile.place_of_residence}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 mb-3">Academic Information</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <Book className="h-4 w-4 text-gray-400" />
                                                    <span>{profile?.education_level || 'Not specified'}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <GraduationCap className="h-4 w-4 text-gray-400" />
                                                    <span>{profile?.english_level || 'Not assessed'}</span>
                                                </div>
                                                {profile?.toefl_score && (
                                                    <div className="flex items-center space-x-2">
                                                        <Award className="h-4 w-4 text-gray-400" />
                                                        <span>TOEFL: {profile.toefl_score}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {profile?.bio && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <h4 className="font-medium text-gray-900 mb-2">About Me</h4>
                                        <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            <div className="space-y-4 sm:space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900">Mentor Notes</h3>

                                <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <Clock className="h-8 w-8 text-gray-400" />
                                        <div>
                                            <h4 className="font-medium text-gray-900">Notes Coming Soon</h4>
                                            <p className="text-sm text-gray-500">
                                                Your mentor's notes and feedback will appear here.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard; 