import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';

const StudentDashboardHeader = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [studentInfo, setStudentInfo] = useState(null);

    useEffect(() => {
        const fetchStudentInfo = async () => {
            if (!user?.id) return;

            try {
                const { data, error } = await supabase
                    .from('students')
                    .select('first_name, student_id')
                    .eq('user_id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching student info:', error);
                } else {
                    setStudentInfo(data);
                }
            } catch (error) {
                console.error('Error fetching student info:', error);
            }
        };

        fetchStudentInfo();
    }, [user]);

    return (
        <div className="bg-white shadow-sm border-b px-4 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    <span className="font-medium">Back to Home</span>
                </button>

                {/* Logo/Title with Greeting */}
                <div className="flex items-center">
                    <div className="text-center">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-gray-900">WatanHub</span>
                            <span className="text-sm text-gray-500 ml-2">Student Dashboard</span>
                        </div>
                        {studentInfo && (
                            <div className="text-xs text-gray-600 mt-1">
                                Hi, {studentInfo.first_name} • ID: {studentInfo.student_id}
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Button */}
                <Link
                    to="/profile"
                    className="flex items-center text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-100"
                >
                    <User className="h-5 w-5 mr-2" />
                    <span className="font-medium">Profile</span>
                </Link>
            </div>
        </div>
    );
};

export default StudentDashboardHeader; 