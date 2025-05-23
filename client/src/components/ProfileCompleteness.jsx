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

        // Define important fields with weighted importance
        const criticalFields = [
            'first_name', 'last_name', 'email'
        ]; // These should always be present

        const veryImportantFields = [
            'date_of_birth', 'gender', 'phone_number',
            'high_school', 'city', 'country'
        ]; // These are important for basic identification

        const importantFields = [
            'gpa', 'year_in_school', 'extracurricular_activities',
            'career_interests', 'preferred_universities'
        ]; // These add value but aren't strictly required

        // Check how many fields in each category are filled
        const criticalFilled = criticalFields.filter(field => {
            const value = profileData[field];
            return value !== null && value !== undefined && value !== '' && value !== '[]';
        }).length;

        const veryImportantFilled = veryImportantFields.filter(field => {
            const value = profileData[field];
            return value !== null && value !== undefined && value !== '' && value !== '[]';
        }).length;

        const importantFilled = importantFields.filter(field => {
            const value = profileData[field];
            return value !== null && value !== undefined && value !== '' && value !== '[]';
        }).length;

        // Weight the categories differently
        const criticalWeight = 0.50;  // 50% weight for critical fields (increased from 45%)
        const veryImportantWeight = 0.35;  // 35% weight for very important fields
        const importantWeight = 0.15;  // 15% weight for important fields (decreased from 20%)

        // Calculate weighted percentages for each category
        const criticalScore = (criticalFilled / criticalFields.length) * criticalWeight;
        const veryImportantScore = (veryImportantFilled / veryImportantFields.length) * veryImportantWeight;
        const importantScore = (importantFilled / importantFields.length) * importantWeight;

        // Calculate base score
        const baseScore = (criticalScore + veryImportantScore + importantScore) * 100;

        // Apply progressive boost factors
        let boostFactor = 1.0;

        // If all critical fields are filled, apply major boost
        if (criticalFilled === criticalFields.length) {
            boostFactor += 0.3; // +30% boost
        }

        // If more than half of very important fields are filled, extra boost
        if (veryImportantFilled >= Math.ceil(veryImportantFields.length / 2)) {
            boostFactor += 0.2; // +20% boost
        }

        // If any important fields are filled, small additional boost
        if (importantFilled > 0) {
            boostFactor += 0.1; // +10% boost
        }

        // Apply a more generous curve to the final score
        const finalScore = Math.min(100, Math.round(baseScore * boostFactor));

        console.log(`Profile score calculation: 
        Critical: ${criticalFilled}/${criticalFields.length} (weighted: ${criticalScore * 100}%)
        Very Important: ${veryImportantFilled}/${veryImportantFields.length} (weighted: ${veryImportantScore * 100}%)
        Important: ${importantFilled}/${importantFields.length} (weighted: ${importantScore * 100}%)
        Base score: ${baseScore.toFixed(1)}%
        Boost factor: ${boostFactor.toFixed(1)}
        Final score: ${finalScore}%`);

        return finalScore;
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

        // Only analyze the profile when incomplete - lowered threshold to 70%
        if (!dismissed && profile && percentage < 70) {
            analyzeProfile();
        } else {
            // If profile is reasonably complete, don't bother with analysis
            setAnalysis(null);
        }
    }, [profile]); // Removed dismissed from dependencies to ensure analysis runs

    const handleDismiss = () => {
        setDismissed(true);
        if (onComplete) {
            onComplete();
        }
    };

    const completionPercentage = calculateCompletionPercentage(profile);

    if (dismissed || completionPercentage >= 90) {  // Lowered threshold from 100% to 90%
        return null;
    }

    const getBackgroundColor = () => {
        if (completionPercentage < 25) return 'bg-red-50 border-red-200';
        if (completionPercentage < 50) return 'bg-yellow-50 border-yellow-200';
        return 'bg-green-50 border-green-200';
    };

    const getTextColor = () => {
        if (completionPercentage < 25) return 'text-red-700';
        if (completionPercentage < 50) return 'text-yellow-700';
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
                                    className={`h-2 rounded-full ${completionPercentage < 30 ? 'bg-red-500' :
                                        completionPercentage < 60 ? 'bg-yellow-500' :
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
                    ) : completionPercentage < 80 ? (
                        <div className="bg-white rounded-md p-3 flex items-center">
                            <AlertTriangle className="text-amber-500 mr-2 h-4 w-4" />
                            <span>Please complete your profile to improve your experience.</span>
                            <div className="ml-auto">
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