import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const FellowshipAssignments = ({ mentorId }) => {
    const [students, setStudents] = useState([]);
    const [educationalPlatforms, setEducationalPlatforms] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Assignment form state
    const [assignmentForm, setAssignmentForm] = useState({
        title: '',
        description: '',
        content_source: '',
        content_type: 'course',
        external_url: '',
        due_date: '',
        content_details: [],
        mentor_notes: ''
    });

    useEffect(() => {
        loadData();
    }, [mentorId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load assigned students
            const { data: studentData, error: studentError } = await supabase
                .from('mentor_student_relationships')
                .select(`
                    student_id,
                    profiles!mentor_student_relationships_student_id_fkey(
                        id,
                        full_name,
                        email,
                        university_preference,
                        student_interests
                    )
                `)
                .eq('mentor_id', mentorId)
                .eq('status', 'active');

            if (studentError) throw studentError;
            setStudents(studentData?.map(item => item.profiles) || []);

            // Load educational platforms
            const { data: platformData, error: platformError } = await supabase
                .from('educational_platforms')
                .select('*')
                .order('platform_name');

            if (platformError) throw platformError;
            setEducationalPlatforms(platformData || []);

            // Load existing assignments
            const { data: assignmentData, error: assignmentError } = await supabase
                .from('fellowship_assignments')
                .select(`
                    *,
                    student:student_id(full_name, email),
                    platform:content_source(platform_name)
                `)
                .eq('mentor_id', mentorId)
                .order('created_at', { ascending: false });

            if (assignmentError) throw assignmentError;
            setAssignments(assignmentData || []);

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignContent = async () => {
        if (!selectedStudent || !assignmentForm.title || !assignmentForm.content_source) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const assignmentData = {
                student_id: selectedStudent.id,
                mentor_id: mentorId,
                title: assignmentForm.title,
                description: assignmentForm.description,
                content_source: assignmentForm.content_source,
                content_type: assignmentForm.content_type,
                external_url: assignmentForm.external_url || null,
                due_date: assignmentForm.due_date || null,
                content_details: assignmentForm.content_details.length > 0
                    ? JSON.stringify(assignmentForm.content_details)
                    : null,
                mentor_notes: assignmentForm.mentor_notes || null
            };

            const { error } = await supabase
                .from('fellowship_assignments')
                .insert([assignmentData]);

            if (error) throw error;

            // Reset form and close modal
            setAssignmentForm({
                title: '',
                description: '',
                content_source: '',
                content_type: 'course',
                external_url: '',
                due_date: '',
                content_details: [],
                mentor_notes: ''
            });
            setSelectedStudent(null);
            setShowAssignModal(false);

            // Reload assignments
            loadData();

            alert('Content assigned successfully! 🎉');
        } catch (error) {
            console.error('Error assigning content:', error);
            alert('Error assigning content. Please try again.');
        }
    };

    const addContentDetail = () => {
        setAssignmentForm(prev => ({
            ...prev,
            content_details: [...prev.content_details, '']
        }));
    };

    const updateContentDetail = (index, value) => {
        setAssignmentForm(prev => ({
            ...prev,
            content_details: prev.content_details.map((detail, i) =>
                i === index ? value : detail
            )
        }));
    };

    const removeContentDetail = (index) => {
        setAssignmentForm(prev => ({
            ...prev,
            content_details: prev.content_details.filter((_, i) => i !== index)
        }));
    };

    const getPrefilledContent = (platformSlug) => {
        const contentSuggestions = {
            'khan_academy': {
                suggestions: [
                    'SAT Math Practice',
                    'Introduction to Programming',
                    'Algebra Basics',
                    'Statistics and Probability',
                    'AP Computer Science Principles'
                ]
            },
            'uopeople': {
                suggestions: [
                    'Business Administration Fundamentals',
                    'Computer Science Introduction',
                    'Health Science Basics',
                    'Mathematics for University',
                    'English Composition'
                ]
            },
            'edx': {
                suggestions: [
                    'CS50x: Introduction to Computer Science',
                    'Introduction to Data Science',
                    'Financial Accounting',
                    'Introduction to Psychology',
                    'Calculus 1A: Differentiation'
                ]
            },
            'freecodecamp': {
                suggestions: [
                    'Responsive Web Design Certification',
                    'JavaScript Algorithms and Data Structures',
                    'Python for Data Science',
                    'Database Design',
                    'API Development'
                ]
            }
        };
        return contentSuggestions[platformSlug]?.suggestions || [];
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-32 bg-gray-200 rounded"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        📚 Fellowship Content Assignments
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Assign educational content to your students from partner platforms
                    </p>
                </div>

                {students.length > 0 && (
                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        + Assign Content
                    </button>
                )}
            </div>

            {/* Students Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                        Your Students
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {students.length}
                    </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 dark:text-green-100">
                        Total Assignments
                    </h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {assignments.length}
                    </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                        Completed
                    </h3>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {assignments.filter(a => a.status === 'completed').length}
                    </p>
                </div>
            </div>

            {/* Recent Assignments */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Recent Assignments
                    </h3>
                </div>

                <div className="p-6">
                    {assignments.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-6xl mb-4">📚</div>
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No assignments yet
                            </h4>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Start by assigning educational content to help your students grow
                            </p>
                            {students.length > 0 && (
                                <button
                                    onClick={() => setShowAssignModal(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                                >
                                    Assign First Content
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {assignments.slice(0, 10).map((assignment) => (
                                <div key={assignment.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                {assignment.title}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Student: {assignment.student?.full_name || 'Unknown'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Platform: {assignment.content_source}
                                            </p>
                                        </div>

                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${assignment.status === 'completed'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : assignment.status === 'active'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                            }`}>
                                            {assignment.status}
                                        </span>
                                    </div>

                                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                        {assignment.description}
                                    </p>

                                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                                        <span>Assigned: {new Date(assignment.created_at).toLocaleDateString()}</span>
                                        {assignment.due_date && (
                                            <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                                        )}
                                        <span>Progress: {assignment.progress_percentage}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Assignment Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Assign Educational Content
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Student Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Select Student *
                                </label>
                                <select
                                    value={selectedStudent?.id || ''}
                                    onChange={(e) => {
                                        const student = students.find(s => s.id === e.target.value);
                                        setSelectedStudent(student);
                                    }}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Choose a student...</option>
                                    {students.map((student) => (
                                        <option key={student.id} value={student.id}>
                                            {student.full_name} ({student.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Platform Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Educational Platform *
                                </label>
                                <select
                                    value={assignmentForm.content_source}
                                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, content_source: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">Choose a platform...</option>
                                    {educationalPlatforms.map((platform) => (
                                        <option key={platform.id} value={platform.platform_name}>
                                            {platform.platform_name} - {platform.certificate_type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Content Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Content Type
                                </label>
                                <select
                                    value={assignmentForm.content_type}
                                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, content_type: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="course">Full Course</option>
                                    <option value="video">Video Series</option>
                                    <option value="article">Article/Reading</option>
                                    <option value="exercise">Practice Exercise</option>
                                </select>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Assignment Title *
                                </label>
                                <input
                                    type="text"
                                    value={assignmentForm.title}
                                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g., Complete Khan Academy SAT Math Practice"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    value={assignmentForm.description}
                                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Explain why this content will help the student and what they should focus on..."
                                    rows="3"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* External URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Direct Link (Optional)
                                </label>
                                <input
                                    type="url"
                                    value={assignmentForm.external_url}
                                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, external_url: e.target.value }))}
                                    placeholder="https://..."
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Due Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={assignmentForm.due_date}
                                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, due_date: e.target.value }))}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>

                            {/* Content Details */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Course Details/Modules
                                </label>
                                {assignmentForm.content_details.map((detail, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={detail}
                                            onChange={(e) => updateContentDetail(index, e.target.value)}
                                            placeholder="e.g., Module 1: Basic Algebra"
                                            className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <button
                                            onClick={() => removeContentDetail(index)}
                                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={addContentDetail}
                                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                    + Add Course Detail
                                </button>
                            </div>

                            {/* Mentor Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Private Notes (Student won't see this)
                                </label>
                                <textarea
                                    value={assignmentForm.mentor_notes}
                                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, mentor_notes: e.target.value }))}
                                    placeholder="Internal notes about this assignment..."
                                    rows="2"
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedStudent(null);
                                    setAssignmentForm({
                                        title: '',
                                        description: '',
                                        content_source: '',
                                        content_type: 'course',
                                        external_url: '',
                                        due_date: '',
                                        content_details: [],
                                        mentor_notes: ''
                                    });
                                }}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignContent}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                            >
                                Assign Content
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FellowshipAssignments; 