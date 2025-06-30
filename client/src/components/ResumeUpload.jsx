import React, { useState, useEffect } from 'react';
import { Upload, File, CheckCircle, X, Loader, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { toast } from 'sonner';

const ResumeUpload = ({ studentId = null, showTitle = true, compact = false }) => {
    const { user } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [resume, setResume] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [currentResume, setCurrentResume] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [error, setError] = useState('');

    const targetStudentId = studentId || user?.id;

    useEffect(() => {
        fetchResume();
        loadCurrentResume();
    }, [targetStudentId]);

    const fetchResume = async () => {
        if (!targetStudentId) return;

        try {
            const { data, error } = await supabase
                .from('student_resumes')
                .select('*')
                .eq('student_id', targetStudentId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching resume:', error);
                return;
            }

            if (data) {
                setResume(data);
            }
        } catch (error) {
            console.error('Error fetching resume:', error);
        }
    };

    const loadCurrentResume = async () => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('resume_url, resume_filename, resume_uploaded_at')
                .eq('id', targetStudentId)
                .single();

            if (error) throw error;

            if (profile?.resume_url) {
                setCurrentResume({
                    url: profile.resume_url,
                    filename: profile.resume_filename || 'resume.pdf',
                    uploaded_at: profile.resume_uploaded_at
                });
            }
        } catch (error) {
            console.error('Error loading current resume:', error);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFileUpload(files[0]);
        }
    };

    const handleFileUpload = async (file) => {
        if (!targetStudentId) {
            toast.error('User not authenticated');
            return;
        }

        // Validate file type
        const allowedTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ];

        if (!allowedTypes.includes(file.type)) {
            toast.error('Please upload a PDF or Word document');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setUploading(true);

        try {
            // Create unique filename with folder structure
            const fileExt = file.name.split('.').pop();
            const fileName = `${targetStudentId}/resume-${Date.now()}.${fileExt}`;

            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('student-resumes')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('student-resumes')
                .getPublicUrl(fileName);

            // Save to database
            const resumeData = {
                student_id: targetStudentId,
                file_name: file.name,
                file_path: fileName,
                file_url: urlData.publicUrl,
                file_size: file.size,
                file_type: file.type,
                uploaded_at: new Date().toISOString()
            };

            // Delete old resume if exists
            if (resume) {
                await supabase.storage
                    .from('student-resumes')
                    .remove([resume.file_path]);

                await supabase
                    .from('student_resumes')
                    .delete()
                    .eq('student_id', targetStudentId);
            }

            const { data, error } = await supabase
                .from('student_resumes')
                .insert([resumeData])
                .select()
                .single();

            if (error) throw error;

            setResume(data);
            toast.success('Resume uploaded successfully!');
        } catch (error) {
            console.error('Error uploading resume:', error.message || error);
            console.error('Full error object:', error);
            toast.error(`Failed to upload resume: ${error.message || 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (file) {
            await uploadFile(file);
        }
    };

    const uploadFile = async (file) => {
        try {
            setUploading(true);
            setError('');

            // Validate file
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                throw new Error('File size must be less than 10MB');
            }

            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!allowedTypes.includes(file.type)) {
                throw new Error('Please upload a PDF or Word document');
            }

            // Upload to Supabase Storage
            const fileName = `${targetStudentId}_resume_${Date.now()}.${file.name.split('.').pop()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('resumes')
                .getPublicUrl(fileName);

            // Update profile with new resume info
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    resume_url: urlData.publicUrl,
                    resume_filename: file.name,
                    resume_uploaded_at: new Date().toISOString()
                })
                .eq('id', targetStudentId);

            if (profileError) throw profileError;

            // Delete old resume if it exists
            if (currentResume?.url) {
                const oldFileName = currentResume.url.split('/').pop();
                await supabase.storage
                    .from('resumes')
                    .remove([oldFileName]);
            }

            // Update local state
            setCurrentResume({
                url: urlData.publicUrl,
                filename: file.name,
                uploaded_at: new Date().toISOString()
            });

            setShowUploadModal(false);
            toast.success('Resume uploaded successfully! 🎉');

        } catch (error) {
            console.error('Error uploading resume:', error);
            setError(error.message);
        } finally {
            setUploading(false);
        }
    };

    const deleteResume = async () => {
        // Use window.confirm explicitly to avoid ESLint error
        const confirmDelete = window.confirm('Are you sure you want to delete your resume? This action cannot be undone.');
        if (!confirmDelete) {
            return;
        }

        try {
            setUploading(true);

            // Delete from storage
            if (currentResume?.url) {
                const fileName = currentResume.url.split('/').pop();
                await supabase.storage
                    .from('resumes')
                    .remove([fileName]);
            }

            // Update profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    resume_url: null,
                    resume_filename: null,
                    resume_uploaded_at: null
                })
                .eq('id', targetStudentId);

            if (error) throw error;

            setCurrentResume(null);
            toast.success('Resume deleted successfully');

        } catch (error) {
            console.error('Error deleting resume:', error);
            setError('Failed to delete resume');
        } finally {
            setUploading(false);
        }
    };

    const downloadResume = () => {
        if (resume?.file_url) {
            window.open(resume.file_url, '_blank');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const sizeIndex = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2)) + ' ' + sizes[sizeIndex];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const canUpload = !studentId || studentId === user?.id; // Only allow upload if it's the user's own profile

    if (compact) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                {showTitle && (
                    <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                        <File size={16} className="mr-2 text-blue-600" />
                        Resume
                    </h3>
                )}

                {resume ? (
                    <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-full mr-3">
                                <File size={16} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-green-800">{resume.file_name}</p>
                                <p className="text-xs text-green-600">
                                    {formatFileSize(resume.file_size)} • {formatDate(resume.uploaded_at)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={downloadResume}
                                className="p-1 text-green-700 hover:text-green-800"
                                title="Download"
                            >
                                <Download size={16} />
                            </button>
                            {canUpload && (
                                <button
                                    onClick={deleteResume}
                                    className="p-1 text-red-600 hover:text-red-700"
                                    title="Delete"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ) : canUpload ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <File size={24} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-2">No resume uploaded</p>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                                disabled={uploading}
                            />
                            <span className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                                {uploading ? 'Uploading...' : 'Click to upload'}
                            </span>
                        </label>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <File size={24} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">No resume uploaded</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    📄 Resume Management
                </h3>

                {currentResume ? (
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Upload New Resume
                    </button>
                ) : (
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        Upload Resume
                    </button>
                )}
            </div>

            {currentResume ? (
                <div className="space-y-4">
                    {/* Current Resume Display */}
                    <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                                    <span className="text-red-600 dark:text-red-400 text-lg">📄</span>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                        {currentResume.filename}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Uploaded: {new Date(currentResume.uploaded_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <a
                                    href={currentResume.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                                >
                                    View
                                </a>
                                <a
                                    href={currentResume.url}
                                    download={currentResume.filename}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                                >
                                    Download
                                </a>
                                <button
                                    onClick={deleteResume}
                                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                                    disabled={uploading}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Resume Tips */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                            💡 Resume Tips for Afghan Students
                        </h5>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• Highlight your educational achievements despite challenges</li>
                            <li>• Include any online courses or certifications you've completed</li>
                            <li>• Mention language skills (Dari, Pashto, English, etc.)</li>
                            <li>• Include volunteer work or community involvement</li>
                            <li>• Keep it to 1-2 pages maximum</li>
                        </ul>
                    </div>
                </div>
            ) : (
                <div className="text-center py-8">
                    <div className="text-6xl mb-4">📄</div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No Resume Uploaded
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Upload your resume to help mentors understand your background and assist with applications
                    </p>
                    <button
                        onClick={() => setShowUploadModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                        Upload Your Resume
                    </button>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {currentResume ? 'Upload New Resume' : 'Upload Resume'}
                            </h3>
                            {currentResume && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    This will replace your current resume
                                </p>
                            )}
                        </div>

                        <div className="p-6">
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                                </div>
                            )}

                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                                <div className="text-4xl mb-4">📄</div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Upload a PDF or Word document (Max 10MB)
                                </p>

                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    id="resume-upload"
                                    disabled={uploading}
                                />
                                <label
                                    htmlFor="resume-upload"
                                    className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    {uploading ? 'Uploading...' : 'Choose File'}
                                </label>
                            </div>

                            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                                <p>Supported formats: PDF, DOC, DOCX</p>
                                <p>Maximum file size: 10MB</p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                            <button
                                onClick={() => {
                                    setShowUploadModal(false);
                                    setError('');
                                }}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {uploading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
                        <div className="flex items-center space-x-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="text-gray-900 dark:text-white">
                                {currentResume ? 'Replacing resume...' : 'Uploading resume...'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResumeUpload; 