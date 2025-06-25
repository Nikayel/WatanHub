import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Calendar, MapPin, BookOpen, Award, Download, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { toast } from 'sonner';

const StudentDetailModal = ({ student, isOpen, onClose }) => {
    const { user } = useAuth();
    const [studentProfile, setStudentProfile] = useState(null);
    const [studentResume, setStudentResume] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (student && isOpen) {
            fetchStudentDetails();
        }
    }, [student, isOpen]);

    const fetchStudentDetails = async () => {
        if (!student?.user_id && !student?.id) return;

        setLoading(true);
        try {
            // Get the student user_id - could be passed as user_id or id depending on source
            const userId = student.user_id || student.id;

            // Fetch complete student profile from profiles table directly
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) {
                console.error('Error fetching student profile:', profileError);
                toast.error('Failed to load student profile');
            } else {
                setStudentProfile(profileData);
            }

            // Fetch student resume
            const { data: resumeData, error: resumeError } = await supabase
                .from('student_resumes')
                .select('*')
                .eq('student_id', userId)
                .single();

            if (resumeError && resumeError.code !== 'PGRST116') {
                console.error('Error fetching resume:', resumeError);
            } else if (resumeData) {
                setStudentResume(resumeData);
            }
        } catch (error) {
            console.error('Error fetching student details:', error);
            toast.error('Failed to load student details');
        } finally {
            setLoading(false);
        }
    };

    const downloadResume = () => {
        if (studentResume?.file_url) {
            window.open(studentResume.file_url, '_blank');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not provided';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const calculateProfileCompleteness = (profile) => {
        if (!profile) return 0;

        // Use the same field list as the main profile completeness calculation
        const criticalFields = ['first_name', 'last_name', 'email'];
        const veryImportantFields = ['date_of_birth', 'gender', 'phone_number', 'education_level', 'english_level'];
        const importantFields = ['interests', 'bio', 'place_of_birth', 'place_of_residence'];
        const optionalFields = ['gpa', 'toefl_score', 'extracurricular_activities', 'province', 'school_type', 'religion'];

        const allFields = [...criticalFields, ...veryImportantFields, ...importantFields, ...optionalFields];

        const completed = allFields.filter(field => {
            const value = profile[field];
            return value !== null && value !== undefined && value !== '' && value !== '[]' && value.toString().trim() !== '';
        });

        return Math.round((completed.length / allFields.length) * 100);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">
                                {student?.first_name} {student?.last_name}
                            </h2>
                            <p className="text-indigo-100">{student?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'profile'
                            ? 'border-indigo-600 text-indigo-600 bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Profile Details
                    </button>
                    <button
                        onClick={() => setActiveTab('academic')}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'academic'
                            ? 'border-indigo-600 text-indigo-600 bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Academic Info
                    </button>
                    <button
                        onClick={() => setActiveTab('resume')}
                        className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'resume'
                            ? 'border-indigo-600 text-indigo-600 bg-white'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Resume & Documents
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : (
                        <>
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    {/* Profile Completeness */}
                                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Profile Completeness</span>
                                            <span className="text-lg font-bold text-green-600">
                                                {calculateProfileCompleteness(studentProfile)}%
                                            </span>
                                        </div>
                                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${calculateProfileCompleteness(studentProfile)}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Personal Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Personal Information</h3>

                                            <div className="flex items-center space-x-3">
                                                <User className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Full Name</p>
                                                    <p className="font-medium">{studentProfile?.first_name} {studentProfile?.last_name}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Email</p>
                                                    <p className="font-medium">{studentProfile?.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Phone className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Phone Number</p>
                                                    <p className="font-medium">{studentProfile?.phone_number || 'Not provided'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Calendar className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Date of Birth</p>
                                                    <p className="font-medium">{formatDate(studentProfile?.date_of_birth)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <User className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Gender</p>
                                                    <p className="font-medium">{studentProfile?.gender || 'Not specified'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Location & Background</h3>

                                            <div className="flex items-center space-x-3">
                                                <MapPin className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Place of Birth</p>
                                                    <p className="font-medium">{studentProfile?.place_of_birth || 'Not provided'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <MapPin className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Current Residence</p>
                                                    <p className="font-medium">{studentProfile?.place_of_residence || 'Not provided'}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-sm text-gray-500">Bio</p>
                                                <p className="text-sm bg-gray-50 p-3 rounded-lg">
                                                    {studentProfile?.bio || 'No bio provided'}
                                                </p>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-sm text-gray-500">Interests</p>
                                                <p className="text-sm bg-gray-50 p-3 rounded-lg">
                                                    {studentProfile?.interests || 'No interests listed'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Academic Tab */}
                            {activeTab === 'academic' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Academic Background</h3>

                                            <div className="flex items-center space-x-3">
                                                <BookOpen className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">Education Level</p>
                                                    <p className="font-medium">{studentProfile?.education_level || 'Not specified'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Award className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">GPA</p>
                                                    <p className="font-medium">{studentProfile?.gpa || 'Not provided'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <BookOpen className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">School Type</p>
                                                    <p className="font-medium">{studentProfile?.school_type || 'Not specified'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Test Scores & Skills</h3>

                                            <div className="flex items-center space-x-3">
                                                <Award className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">English Level</p>
                                                    <p className="font-medium">{studentProfile?.english_level || 'Not assessed'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Award className="h-5 w-5 text-gray-400" />
                                                <div>
                                                    <p className="text-sm text-gray-500">TOEFL Score</p>
                                                    <p className="font-medium">{studentProfile?.toefl_score || 'Not taken'}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-sm text-gray-500">Extracurricular Activities</p>
                                                <p className="text-sm bg-gray-50 p-3 rounded-lg">
                                                    {studentProfile?.extracurricular_activities || 'None listed'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Resume Tab */}
                            {activeTab === 'resume' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Resume & Documents</h3>

                                    {studentResume ? (
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <FileText className="h-6 w-6 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-800">{studentResume.file_name}</h4>
                                                            <p className="text-sm text-gray-500">
                                                                Uploaded on {formatDate(studentResume.uploaded_at)}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                Size: {Math.round(studentResume.file_size / 1024)} KB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={downloadResume}
                                                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        <span>Download</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* PDF Viewer */}
                                            {studentResume.file_type === 'application/pdf' && (
                                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                                        <h4 className="font-medium text-gray-800">Resume Preview</h4>
                                                    </div>
                                                    <div className="h-96 w-full">
                                                        <iframe
                                                            src={`${studentResume.file_url}#toolbar=0&navpanes=0&scrollbar=1`}
                                                            className="w-full h-full"
                                                            title="Resume Preview"
                                                            onError={() => {
                                                                console.log('PDF preview failed, falling back to download link');
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-center">
                                                        <p className="text-xs text-gray-500">
                                                            Can't see the preview?
                                                            <button
                                                                onClick={downloadResume}
                                                                className="ml-1 text-indigo-600 hover:text-indigo-700 underline"
                                                            >
                                                                Download the file
                                                            </button>
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Non-PDF files info */}
                                            {studentResume.file_type !== 'application/pdf' && (
                                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                                    <div className="flex items-center space-x-2">
                                                        <FileText className="h-5 w-5 text-blue-600" />
                                                        <p className="text-sm text-blue-800">
                                                            This is a {studentResume.file_type.split('/')[1].toUpperCase()} file.
                                                            Click download to view it.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                            <h4 className="text-lg font-medium text-gray-600 mb-2">No Resume Uploaded</h4>
                                            <p className="text-gray-500">This student hasn't uploaded a resume yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentDetailModal; 