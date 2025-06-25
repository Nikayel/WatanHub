import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/ApiService';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Loader, User, X } from 'lucide-react';
import { motion } from 'framer-motion';
import Logger from '../utils/logger';

// This component analyzes profile completeness and provides AI-powered suggestions
const ProfileCompleteness = ({ profile, onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [completionData, setCompletionData] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Calculate profile completion percentage based on our key fields
    const calculateCompletionPercentage = (profileData) => {
        if (!profileData) return 0;

        // Define field categories based on actual schema fields available
        const criticalFields = ['first_name', 'last_name', 'email'];
        const veryImportantFields = ['date_of_birth', 'gender', 'phone_number', 'education_level', 'english_level'];
        const importantFields = ['interests', 'bio', 'toefl_score', 'place_of_birth', 'place_of_residence'];

        // New fields that may or may not exist yet (will be ignored if not in DB)
        const optionalFields = ['gpa', 'extracurricular_activities', 'province', 'school_type'];

        // Combine all fields that we will check
        const allFields = [...criticalFields, ...veryImportantFields, ...importantFields, ...optionalFields];

        const completedFields = allFields.filter(field => {
            const value = profileData[field];
            return value !== null && value !== undefined && value !== '' && value !== '[]' && value.toString().trim() !== '';
        });

        // Calculate completion percentage - allow full 100% when completed
        const totalFields = allFields.length;
        const completedCount = completedFields.length;
        const completeness = Math.round((completedCount / totalFields) * 100);

        Logger.debug(`Profile completion analysis:
        Critical (${criticalFields.filter(f => completedFields.includes(f)).length}/${criticalFields.length}): ${criticalFields.filter(f => completedFields.includes(f))}
        Very Important (${veryImportantFields.filter(f => completedFields.includes(f)).length}/${veryImportantFields.length}): ${veryImportantFields.filter(f => completedFields.includes(f))}
        Important (${importantFields.filter(f => completedFields.includes(f)).length}/${importantFields.length}): ${importantFields.filter(f => completedFields.includes(f))}
        Optional (${optionalFields.filter(f => completedFields.includes(f)).length}/${optionalFields.length}): ${optionalFields.filter(f => completedFields.includes(f))}
        Total: ${completedCount}/${totalFields} = ${completeness}%`);

        return completeness;
    };

    const analyzeProfile = async () => {
        if (!profile) return;

        setLoading(true);
        try {
            Logger.info("Starting profile analysis");
            const result = await geminiService.analyzeProfileCompleteness(profile);
            Logger.info("Profile analysis completed");
            setAnalysis(result);
        } catch (error) {
            Logger.error("Profile analysis failed:", error);
            setAnalysis("Unable to analyze profile completeness at this time.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setExpanded(true);

        const percentage = calculateCompletionPercentage(profile);
        Logger.debug("Profile completeness calculated:", percentage, "%");

        // Calculate additional completion data if profile exists
        if (profile) {
            const data = calculateCompletion();
            setCompletionData(data);
        }

        // Only analyze the profile when incomplete - set threshold to 90%
        if (!dismissed && profile && percentage < 90) {
            analyzeProfile();
        } else {
            setAnalysis(null);
        }
    }, [profile]);

    const handleDismiss = () => {
        setDismissed(true);
        if (onComplete) onComplete();
    };

    // Don't show if profile is very complete (90%+) and no current analysis
    const percentage = calculateCompletionPercentage(profile);
    if (percentage >= 90 && !analysis) {
        return null;
    }

    const getBackgroundColor = () => {
        if (percentage < 25) return 'bg-red-50 border-red-200';
        if (percentage < 50) return 'bg-yellow-50 border-yellow-200';
        return 'bg-green-50 border-green-200';
    };

    const getTextColor = () => {
        if (percentage < 25) return 'text-red-700';
        if (percentage < 50) return 'text-yellow-700';
        return 'text-green-700';
    };

    const calculateCompletion = () => {
        if (!profile) return { percentage: 0, details: {} };

        const fields = {
            'Basic Info': {
                'Full Name': !!profile.full_name,
                'Email': !!profile.email,
                'Phone': !!profile.phone_number,
                'Date of Birth': !!profile.date_of_birth,
                'Address': !!profile.address,
                'Gender': !!profile.gender
            },
            'Academic': {
                'Current School': !!profile.current_school,
                'Grade Level': !!profile.grade_level,
                'GPA': !!profile.gpa,
                'Intended Major': !!profile.intended_major
            },
            'Background': {
                'Country of Origin': !!profile.country_of_origin,
                'Languages Spoken': !!profile.languages_spoken,
                'Immigration Status': !!profile.immigration_status,
                'Parent/Guardian Info': !!profile.parent_guardian_info
            },
            'Goals & Interests': {
                'Career Goals': !!profile.career_goals,
                'Interests/Hobbies': !!profile.interests_hobbies,
                'Extracurricular Activities': !!profile.extracurricular_activities,
                'Community Involvement': !!profile.community_involvement
            },
            'Survey Data': {
                'Financial Need': profile.financial_need !== null,
                'Academic Support Need': profile.academic_support_need !== null
            }
        };

        Logger.debug(`Profile completion details:`, fields);

        const totalFields = Object.values(fields).reduce((sum, section) => sum + Object.keys(section).length, 0);
        const completedFields = Object.values(fields).reduce((sum, section) =>
            sum + Object.values(section).filter(Boolean).length, 0);

        return {
            percentage: Math.round((completedFields / totalFields) * 100),
            details: fields,
            completed: completedFields,
            total: totalFields
        };
    };

    const analyzeWithAI = async () => {
        setIsAnalyzing(true);
        try {
            Logger.log("Analyzing profile with AI service");
            const result = await fetch('/api/analyze-profile', { method: 'POST', body: JSON.stringify(profile) });
            Logger.log("AI analysis result:", result);
            setIsAnalyzing(false);
            if (onComplete) onComplete(result);
        } catch (error) {
            Logger.error("Error analyzing profile:", error);
            setIsAnalyzing(false);
        }
    };



    return (
        <div className={`rounded-xl border ${getBackgroundColor()} p-4 sm:p-6 mb-6 overflow-hidden transition-all shadow-sm`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center min-w-0 flex-1">
                    <div className="mr-3 p-2 rounded-full bg-white shadow-sm flex-shrink-0">
                        <User className={getTextColor()} size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-2">Profile Completeness</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-full max-w-[120px] sm:max-w-[150px] bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-500 ${percentage < 30 ? 'bg-red-500' :
                                        percentage < 60 ? 'bg-yellow-500' :
                                            'bg-green-500'
                                        }`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                ></div>
                            </div>
                            <span className="text-sm font-bold text-gray-700 whitespace-nowrap">{percentage}%</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-gray-500 hover:text-gray-700 p-1 rounded transition-colors"
                        title={expanded ? "Collapse" : "Expand"}
                    >
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="text-gray-500 hover:text-red-500 p-1 rounded transition-colors"
                        title="Dismiss"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {expanded && (
                <div className="mt-4 transition-all duration-300">
                    {loading ? (
                        <div className="flex items-center justify-center p-6 bg-white rounded-lg border">
                            <Loader className="mr-3 h-5 w-5 animate-spin text-indigo-600" />
                            <span className="text-gray-600">Analyzing your profile...</span>
                        </div>
                    ) : analysis ? (
                        <div className="bg-white rounded-lg p-4 border shadow-sm">
                            <div className="flex items-start mb-3">
                                <AlertTriangle className="text-amber-500 mt-0.5 mr-3 h-5 w-5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-gray-800 mb-2">AI-powered recommendations:</p>
                                    <div className="whitespace-pre-line text-gray-700 text-sm leading-relaxed">
                                        {analysis}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <a
                                    href="/profile"
                                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    Update Profile →
                                </a>
                            </div>
                        </div>
                    ) : percentage < 80 ? (
                        <div className="bg-white rounded-lg p-4 border shadow-sm flex items-center gap-3">
                            <AlertTriangle className="text-amber-500 h-5 w-5 flex-shrink-0" />
                            <span className="text-gray-700 flex-1">Complete your profile to improve your college application experience.</span>
                            <a
                                href="/profile"
                                className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors whitespace-nowrap"
                            >
                                Edit Profile →
                            </a>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg p-4 border shadow-sm flex items-center gap-3">
                            <CheckCircle className="text-green-500 h-5 w-5 flex-shrink-0" />
                            <span className="text-gray-700 flex-1">Your profile has all the essential information.</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfileCompleteness; 