import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    User,
    CheckSquare,
    CheckCircle,
    Clock,
    Calendar,
    MessageSquare,
    BookMarked
} from 'lucide-react';

const FellowshipContent = ({
    subTab,
    assignedMentor,
    mentorNotes,
    acknowledgeNote,
    formatDate,
    getDaysRemaining,
    userId,
    userRole
}) => {
    const [assignedContent, setAssignedContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableAPIs] = useState([
        {
            id: 'khan_academy',
            name: 'Khan Academy',
            description: 'Math, Science, Programming, and Test Prep',
            api_endpoint: 'https://www.khanacademy.org/api/v1/',
            certificate_type: 'Completion Certificate',
            status: 'Coming Soon'
        },
        {
            id: 'uopeople',
            name: 'University of the People',
            description: 'Accredited University Courses - Business, CS, Health Science',
            api_endpoint: 'https://www.uopeople.edu/api/',
            certificate_type: 'University Certificate/Degree',
            status: 'Coming Soon'
        },
        {
            id: 'edx',
            name: 'edX (MIT/Harvard)',
            description: 'University-level courses with verified certificates',
            api_endpoint: 'https://courses.edx.org/api/',
            certificate_type: 'Verified Certificate',
            status: 'Coming Soon'
        },
        {
            id: 'freecodecamp',
            name: 'freeCodeCamp',
            description: 'Programming and Web Development Certifications',
            api_endpoint: 'https://www.freecodecamp.org/api/',
            certificate_type: 'Programming Certificate',
            status: 'Coming Soon'
        },
        {
            id: 'google_digital',
            name: 'Google Digital Garage',
            description: 'Digital Marketing and Business Skills',
            api_endpoint: 'https://learndigital.withgoogle.com/api/',
            certificate_type: 'Google Certificate',
            status: 'Coming Soon'
        },
        {
            id: 'microsoft_learn',
            name: 'Microsoft Learn',
            description: 'Azure, Office 365, and Microsoft Technologies',
            api_endpoint: 'https://docs.microsoft.com/api/',
            certificate_type: 'Microsoft Certification',
            status: 'Coming Soon'
        }
    ]);

    useEffect(() => {
        loadAssignedContent();
    }, [userId]);

    const loadAssignedContent = async () => {
        setLoading(true);
        try {
            const { data: assignments, error } = await supabase
                .from('fellowship_assignments')
                .select(`
                    *,
                    assigned_by:mentor_id(full_name),
                    content_source,
                    content_details
                `)
                .eq('student_id', userId)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAssignedContent(assignments || []);
        } catch (error) {
            console.error('Error loading fellowship content:', error);
        } finally {
            setLoading(false);
        }
    };

    const markContentComplete = async (assignmentId) => {
        try {
            const { error } = await supabase
                .from('fellowship_assignments')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', assignmentId);

            if (error) throw error;

            // Reload content
            loadAssignedContent();

            alert('Content marked as complete! 🎉');
        } catch (error) {
            console.error('Error marking content complete:', error);
            alert('Error updating completion status');
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Header - More compact on mobile */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 md:p-6 rounded-lg">
                <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">🎓 Fellowship Learning</h2>
                <p className="text-blue-100 text-sm md:text-base">
                    Educational opportunities from world-class institutions
                </p>
            </div>

            {/* Assigned Content */}
            {assignedContent.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        📚 Your Assigned Learning Content
                    </h3>

                    {assignedContent.map((assignment) => (
                        <div key={assignment.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                        {assignment.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Assigned by: {assignment.assigned_by?.full_name || 'Your Mentor'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        Source: {assignment.content_source}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${assignment.status === 'completed'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                        }`}>
                                        {assignment.status === 'completed' ? '✅ Completed' : '📖 In Progress'}
                                    </span>
                                </div>
                            </div>

                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                {assignment.description}
                            </p>

                            {assignment.content_details && (
                                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded mb-4">
                                    <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                                        Course Details:
                                    </h5>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        {JSON.parse(assignment.content_details).map((detail, index) => (
                                            <li key={index} className="flex items-center">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                                {detail}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="flex gap-3">
                                {assignment.external_url && (
                                    <a
                                        href={assignment.external_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        🚀 Start Learning
                                    </a>
                                )}

                                {assignment.status !== 'completed' && (
                                    <button
                                        onClick={() => markContentComplete(assignment.id)}
                                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        ✅ Mark Complete
                                    </button>
                                )}

                                {assignment.certificate_info && assignment.status === 'completed' && (
                                    <button
                                        onClick={() => alert('Certificate download feature coming soon!')}
                                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                                    >
                                        📜 View Certificate
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">📚</div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        No Learning Content Assigned Yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Your mentor will assign educational content from our partner platforms.
                        This includes courses from Khan Academy, University of the People, edX, and more!
                    </p>

                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 max-w-lg mx-auto">
                        <div className="flex items-center justify-center mb-2">
                            <span className="text-amber-600 dark:text-amber-400 text-lg">ℹ️</span>
                            <span className="ml-2 font-medium text-amber-800 dark:text-amber-200">
                                Coming Soon
                            </span>
                        </div>
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            We're integrating with top educational platforms to bring you legitimate,
                            recognized certificates that will help your future career and education goals.
                        </p>
                    </div>
                </div>
            )}

            {/* Available Learning Platforms Preview */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    🌟 Educational Partners (Coming Soon)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableAPIs.map((api) => (
                        <div key={api.id} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                    {api.name}
                                </h4>
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                                    {api.status}
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {api.description}
                            </p>

                            <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                                📜 {api.certificate_type}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        💡 These platforms will be integrated soon, allowing mentors to assign specific courses
                        that provide legitimate, internationally recognized certificates.
                    </p>
                </div>
            </div>

            {/* Statistics Dashboard */}
            {assignedContent.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        📊 Your Learning Progress
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {assignedContent.length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Total Assignments
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {assignedContent.filter(c => c.status === 'completed').length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Completed
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                {Math.round((assignedContent.filter(c => c.status === 'completed').length / assignedContent.length) * 100) || 0}%
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Completion Rate
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FellowshipContent; 