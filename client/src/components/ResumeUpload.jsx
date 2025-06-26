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

    const targetStudentId = studentId || user?.id;

    useEffect(() => {
        fetchResume();
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

    const deleteResume = async () => {
        if (!resume) return;

        try {
            // Delete from storage
            await supabase.storage
                .from('student-resumes')
                .remove([resume.file_path]);

            // Delete from database
            await supabase
                .from('student_resumes')
                .delete()
                .eq('id', resume.id);

            setResume(null);
            toast.success('Resume deleted successfully');
        } catch (error) {
            console.error('Error deleting resume:', error);
            toast.error('Failed to delete resume');
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {showTitle && (
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <File size={20} className="mr-2 text-blue-600" />
                    Resume Upload
                </h3>
            )}

            {resume ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-full mr-4">
                                <CheckCircle size={24} className="text-green-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-green-800">{resume.file_name}</h4>
                                <p className="text-sm text-green-600">
                                    {formatFileSize(resume.file_size)} • Uploaded {formatDate(resume.uploaded_at)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={downloadResume}
                                className="flex items-center px-3 py-2 text-green-700 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
                            >
                                <Download size={16} className="mr-1" />
                                Download
                            </button>
                            {canUpload && (
                                <button
                                    onClick={deleteResume}
                                    className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <X size={16} className="mr-1" />
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>

                    {canUpload && (
                        <div className="text-center">
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                                    disabled={uploading}
                                />
                                <span className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                    Upload new version
                                </span>
                            </label>
                        </div>
                    )}
                </div>
            ) : canUpload ? (
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {uploading ? (
                        <div className="flex flex-col items-center">
                            <Loader size={32} className="text-blue-600 animate-spin mb-3" />
                            <p className="text-sm text-gray-600">Uploading resume...</p>
                        </div>
                    ) : (
                        <>
                            <Upload size={32} className="mx-auto text-gray-400 mb-3" />
                            <h4 className="text-lg font-medium text-gray-800 mb-2">Upload Your Resume</h4>
                            <p className="text-sm text-gray-600 mb-4">
                                Drop your resume here or click to browse
                            </p>
                            <label className="cursor-pointer">
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0])}
                                />
                                <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    <Upload size={16} className="mr-2" />
                                    Choose File
                                </span>
                            </label>
                            <p className="text-xs text-gray-500 mt-3">
                                Supported formats: PDF, DOC, DOCX (Max 10MB)
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div className="text-center py-8">
                    <File size={48} className="mx-auto text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-800 mb-2">No Resume Available</h4>
                    <p className="text-sm text-gray-600">This student hasn't uploaded a resume yet.</p>
                </div>
            )}
        </div>
    );
};

export default ResumeUpload; 