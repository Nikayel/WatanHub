import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/ApiService';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Loader, User, X } from 'lucide-react';

// This component analyzes profile completeness and provides AI-powered suggestions
const ProfileCompleteness = ({ profile, onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    // Calculate profile completion percentage based on our key fields
    const calculateCompletionPercentage = (profileData) => {
        if (!profileData) return 0;

        // Define important fields - these should be present in a complete profile
        const importantFields = [
            'first_name', 'last_name', 'date_of_birth', 'gender',
            'phone_number', 'city', 'country', 'high_school',
            'gpa', 'year_in_school', 'extracurricular_activities',
            'career_interests', 'preferred_universities'
        ];

        // Count how many important fields are filled
        const filledFields = importantFields.filter(field => {
            const value = profileData[field];
            return value !== null && value !== undefined && value !== '' && value !== '[]';
        }).length;

        return Math.round((filledFields / importantFields.length) * 100);
    };

    const analyzeProfile = async () => {
        if (!profile) return;

        setLoading(true);
        try {
            console.log("Analyzing profile with AI service");
            const result = await geminiService.analyzeProfileCompleteness(profile);
            console.log("AI analysis result:", result);
            setAnalysis(result);
        } catch (error) {
            console.error("Error analyzing profile:", error);
            setAnalysis("Unable to analyze profile completeness at this time.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Always expand on first render to make it visible
        setExpanded(true);

        // On first render or when profile changes significantly, check completeness
        const percentage = calculateCompletionPercentage(profile);

        console.log("Profile completeness:", percentage, "%");

        // Always analyze the profile when the component mounts or profile changes
        if (!dismissed && profile) {
            analyzeProfile();
        }
    }, [profile]); // Removed dismissed from dependencies to ensure analysis runs

    const handleDismiss = () => {
        setDismissed(true);
        if (onComplete) {
            onComplete();
        }
    };

    const completionPercentage = calculateCompletionPercentage(profile);

    if (dismissed || completionPercentage >= 90) {
        return null;
    }

    const getBackgroundColor = () => {
        if (completionPercentage < 40) return 'bg-red-50 border-red-200';
        if (completionPercentage < 70) return 'bg-yellow-50 border-yellow-200';
        return 'bg-green-50 border-green-200';
    };

    const getTextColor = () => {
        if (completionPercentage < 40) return 'text-red-700';
        if (completionPercentage < 70) return 'text-yellow-700';
        return 'text-green-700';
    };

    return (
        <div className={`rounded-lg border ${getBackgroundColor()} p-4 mb-6 overflow-hidden transition-all`}>
            <div className="flex items-start justify-between">
                <div className="flex items-center">
                    <div className="mr-3 p-2 rounded-full bg-white">
                        <User className={getTextColor()} size={20} />
                    </div>
                    <div>
                        <h3 className="font-medium">Profile Completeness</h3>
                        <div className="flex items-center mt-1">
                            <div className="w-full bg-gray-200 rounded-full h-2 max-w-[150px] mr-2">
                                <div
                                    className={`h-2 rounded-full ${completionPercentage < 40 ? 'bg-red-500' :
                                        completionPercentage < 70 ? 'bg-yellow-500' :
                                            'bg-green-500'
                                        }`}
                                    style={{ width: `${completionPercentage}%` }}
                                ></div>
                            </div>
                            <span className="text-sm font-medium">{completionPercentage}%</span>
                        </div>
                    </div>
                </div>

                <div className="flex">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-gray-500 hover:text-gray-700 mr-1"
                    >
                        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-500 hover:text-red-500"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="mt-4 transition-all">
                    {loading ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            <span>Analyzing your profile...</span>
                        </div>
                    ) : analysis ? (
                        <div className="bg-white rounded-md p-3 text-sm">
                            <div className="flex items-start mb-2">
                                <AlertTriangle className="text-amber-500 mt-0.5 mr-2 h-4 w-4 flex-shrink-0" />
                                <p className="font-medium">AI-powered recommendations to complete your profile:</p>
                            </div>
                            <div className="whitespace-pre-line text-gray-700 ml-6">
                                {analysis}
                            </div>
                            <div className="mt-3 flex justify-end">
                                <a
                                    href="/profile"
                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                >
                                    Edit Profile →
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-md p-3 flex items-center">
                            <CheckCircle className="text-green-500 mr-2 h-4 w-4" />
                            <span>Your profile has all the essential information.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfileCompleteness; 