import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import StudentSurvey from '../components/StudentSurvey';
import { toast } from 'sonner';

const OnboardingSurvey = () => {
    const { user, isStudent } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in
        if (!user) {
            toast.error('Please log in to access this page');
            navigate('/login');
            return;
        }

        // Check if user is a student
        if (!isStudent) {
            toast.error('This survey is for students only');
            navigate('/');
            return;
        }

        setLoading(false);
    }, [user, isStudent, navigate]);

    const handleSurveyComplete = () => {
        // Redirect to dashboard or home page after survey completion
        toast.success('Thank you for completing the survey!');
        navigate('/');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Welcome to WatanHub</h1>
                    <p className="mt-4 text-lg text-gray-600">
                        Help us understand your background so we can better support your educational journey
                    </p>
                </div>

                <div className="mt-8">
                    <StudentSurvey onComplete={handleSurveyComplete} />
                </div>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/')}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                        Skip for now
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                        You can complete this survey later from your profile
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OnboardingSurvey; 