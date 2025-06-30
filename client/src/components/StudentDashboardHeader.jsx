import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Menu } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

const StudentDashboardHeader = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [studentInfo, setStudentInfo] = useState(null);

    useEffect(() => {
        const fetchStudentInfo = async () => {
            if (!user?.id) return;

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('first_name, student_id')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching student info:', error);
                } else if (data) {
                    setStudentInfo(data);
                } else if (profile) {
                    setStudentInfo({
                        first_name: profile.first_name,
                        student_id: profile.student_id
                    });
                }
            } catch (error) {
                console.error('Error fetching student info:', error);
                if (profile) {
                    setStudentInfo({
                        first_name: profile.first_name,
                        student_id: profile.student_id
                    });
                }
            }
        };

        fetchStudentInfo();
    }, [user, profile]);

    return (
        <div className="bg-white shadow-sm border-b">
            {/* Mobile Layout */}
            <div className="block sm:hidden">
                <div className="px-4 py-3 space-y-3">
                    {/* Top Row: Back button and Profile */}
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors p-2 -ml-2 rounded-lg hover:bg-blue-50"
                        >
                            <ArrowLeft className="h-5 w-5 mr-1" />
                            <span className="text-sm font-medium">Home</span>
                        </button>

                        <Link
                            to="/profile"
                            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors p-2 -mr-2 rounded-lg hover:bg-blue-50"
                        >
                            <User className="h-5 w-5 mr-1" />
                            <span className="text-sm font-medium">Profile</span>
                        </Link>
                    </div>

                    {/* Brand Row */}
                    <div className="text-center py-2">
                        <h1 className="text-2xl font-bold text-gray-900 mb-1">WatanHub</h1>
                        <div className="text-sm text-blue-600 font-medium">Student Dashboard</div>
                        {(studentInfo || profile) && (
                            <div className="text-xs text-gray-500 mt-2 px-4 py-1 bg-gray-50 rounded-full inline-block">
                                Welcome, {studentInfo?.first_name || profile?.first_name}
                                {(studentInfo?.student_id || profile?.student_id) && (
                                    <span className="text-gray-400"> • ID: {studentInfo?.student_id || profile?.student_id}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Desktop/Tablet Layout */}
            <div className="hidden sm:block">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        {/* Back Button */}
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors p-2 -ml-2 rounded-lg hover:bg-blue-50"
                        >
                            <ArrowLeft className="h-5 w-5 mr-2" />
                            <span className="font-medium">Back to Home</span>
                        </button>

                        {/* Logo/Title with Greeting */}
                        <div className="flex items-center">
                            <div className="text-center">
                                <div className="flex items-center space-x-3">
                                    <span className="text-2xl font-bold text-gray-900">WatanHub</span>
                                    <span className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                                        Student Dashboard
                                    </span>
                                </div>
                                {(studentInfo || profile) && (
                                    <div className="text-sm text-gray-600 mt-2">
                                        Welcome back, {studentInfo?.first_name || profile?.first_name}
                                        {(studentInfo?.student_id || profile?.student_id) && (
                                            <span className="text-gray-400"> • Student ID: {studentInfo?.student_id || profile?.student_id}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Button */}
                        <Link
                            to="/profile"
                            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors p-3 -mr-2 rounded-lg hover:bg-blue-50"
                        >
                            <User className="h-5 w-5 mr-2" />
                            <span className="font-medium">Profile</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboardHeader; 