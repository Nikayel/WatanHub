import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';

const StudentDashboardHeader = () => {
    const navigate = useNavigate();

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

                {/* Logo/Title */}
                <div className="flex items-center">
                    <span className="text-xl font-bold text-gray-900">WatanHub</span>
                    <span className="text-sm text-gray-500 ml-2">Student Dashboard</span>
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