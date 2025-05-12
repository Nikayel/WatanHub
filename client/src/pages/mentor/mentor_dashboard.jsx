import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';

// Components
const MentorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [mentorProfile, setMentorProfile] = useState(null);
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentNotes, setStudentNotes] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [stats, setStats] = useState({
        totalStudents: 0,
        meetingsScheduled: 0,
        notesMade: 0
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        fetchMentorProfile();
    }, [user, navigate]);

    const fetchMentorProfile = async () => {
        try {
            setLoading(true);

            // Get mentor application details
            const { data: mentorData, error: mentorError } = await supabase
                .from('mentorapplications')
                .select('*')
                .eq('email', user.email)
                .eq('status', 'approved')
                .single();

            if (mentorError) throw mentorError;

            if (!mentorData) {
                toast.error('Mentor profile not found');
                navigate('/');
                return;
            }

            setMentorProfile(mentorData);

            // Get assigned students
            await fetchAssignedStudents(mentorData.user_id);

        } catch (error) {
            console.error('Error fetching mentor profile:', error.message);
            toast.error('Failed to load mentor dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignedStudents = async (mentorId) => {
        try {
            const { data, error } = await supabase
                .from('mentor_student')
                .select('profiles(*)')
                .eq('mentor_id', mentorId);

            if (error) throw error;

            const students = data.map(item => item.profiles);
            setAssignedStudents(students);
            setStats(prev => ({ ...prev, totalStudents: students.length }));

            // Fetch statistics
            await fetchStatistics(mentorId);

        } catch (error) {
            console.error('Error fetching assigned students:', error.message);
        }
    };

    const fetchStatistics = async (mentorId) => {
        try {
            // Get meeting count
            const { data: meetingsData, error: meetingsError } = await supabase
                .from('mentor_meetings')
                .select('count')
                .eq('mentor_id', mentorId);

            if (meetingsError) throw meetingsError;

            // Get notes count
            const { data: notesData, error: notesError } = await supabase
                .from('mentor_notes')
                .select('count')
                .eq('mentor_id', mentorId);

            if (notesError) throw notesError;

            setStats({
                totalStudents: assignedStudents.length,
                meetingsScheduled: meetingsData[0]?.count || 0,
                notesMade: notesData[0]?.count || 0
            });

        } catch (error) {
            console.error('Error fetching statistics:', error.message);
        }
    };

    const handleStudentSelect = async (student) => {
        setSelectedStudent(student);
        await fetchStudentNotes(student.id);
    };

    const fetchStudentNotes = async (studentId) => {
        try {
            const { data, error } = await supabase
                .from('mentor_notes')
                .select('*')
                .eq('student_id', studentId)
                .eq('mentor_id', mentorProfile.user_id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setStudentNotes(data || []);
        } catch (error) {
            console.error('Error fetching student notes:', error.message);
            toast.error('Failed to load student notes');
        }
    };

    const addNote = async () => {
        if (!newNote.trim() || !selectedStudent) return;

        try {
            const { error } = await supabase
                .from('mentor_notes')
                .insert({
                    mentor_id: mentorProfile.user_id,
                    student_id: selectedStudent.id,
                    content: newNote.trim(),
                    created_at: new Date().toISOString()
                });

            if (error) throw error;

            toast.success('Note added successfully');
            setNewNote('');
            await fetchStudentNotes(selectedStudent.id);
            await fetchStatistics(mentorProfile.user_id);
        } catch (error) {
            console.error('Error adding note:', error.message);
            toast.error('Failed to add note');
        }
    };

    const scheduleMeeting = async (studentId) => {
        // This would open a modal for scheduling a meeting
        // For now, we'll just show a toast
        toast.info('Meeting scheduling feature coming soon!');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 px-4 sm:px-6 lg:px-8 shadow-lg">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center">
                        <div>
                            <button
                                onClick={() => navigate('/')}
                                className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm transition flex items-center space-x-1"
                            >
                                <span>←</span>
                                <span>Home</span>
                            </button>
                        </div>
                        <h1 className="text-3xl font-bold">Mentor Dashboard</h1>
                        <div className="hidden sm:flex space-x-3">
                            <Link to="/profile" className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg shadow transition text-sm flex items-center">
                                <span className="mr-1">👤</span> Profile
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
                        <div className="text-4xl font-bold text-indigo-600 mb-2">{stats.totalStudents}</div>
                        <div className="text-gray-500 text-sm">Assigned Students</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
                        <div className="text-4xl font-bold text-green-600 mb-2">{stats.meetingsScheduled}</div>
                        <div className="text-gray-500 text-sm">Meetings Scheduled</div>
                    </div>
                    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
                        <div className="text-4xl font-bold text-purple-600 mb-2">{stats.notesMade}</div>
                        <div className="text-gray-500 text-sm">Notes Made</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Assigned Students List */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold mb-4">Your Students</h2>

                        {assignedStudents.length === 0 ? (
                            <div className="text-center p-6 bg-gray-50 rounded-lg">
                                <p className="text-gray-500">No students assigned yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {assignedStudents.map((student) => (
                                    <div
                                        key={student.id}
                                        onClick={() => handleStudentSelect(student)}
                                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedStudent?.id === student.id
                                                ? 'bg-indigo-50 border-indigo-300'
                                                : 'hover:bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-indigo-600 font-medium">
                                                    {student.first_name?.[0]}{student.last_name?.[0]}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-medium">{student.first_name} {student.last_name}</h3>
                                                <p className="text-sm text-gray-500">{student.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Student Details and Notes */}
                    <div className="lg:col-span-2">
                        {selectedStudent ? (
                            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                                <div className="bg-indigo-50 p-6 border-b border-indigo-100">
                                    <div className="flex items-center">
                                        <div className="h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center text-xl text-white font-medium mr-4">
                                            {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                                            <p className="text-gray-600">{selectedStudent.email}</p>
                                        </div>
                                        <button
                                            onClick={() => scheduleMeeting(selectedStudent.id)}
                                            className="ml-auto bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition"
                                        >
                                            Schedule Meeting
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                        <div className="bg-white p-3 rounded-lg shadow-sm">
                                            <span className="text-sm font-medium text-gray-600 block mb-1">Education Level</span>
                                            <span>{selectedStudent.education_level || 'Not specified'}</span>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg shadow-sm">
                                            <span className="text-sm font-medium text-gray-600 block mb-1">English Level</span>
                                            <span>{selectedStudent.english_level || 'Not specified'}</span>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg shadow-sm">
                                            <span className="text-sm font-medium text-gray-600 block mb-1">TOEFL Score</span>
                                            <span>{selectedStudent.toefl_score || 'Not available'}</span>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg shadow-sm">
                                            <span className="text-sm font-medium text-gray-600 block mb-1">Interests</span>
                                            <span>{selectedStudent.interests || 'Not specified'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Notes Section */}
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold mb-4">Notes</h3>

                                    <div className="mb-4">
                                        <textarea
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            placeholder="Add a new note about this student..."
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            rows="3"
                                        ></textarea>
                                        <div className="flex justify-end mt-2">
                                            <button
                                                onClick={addNote}
                                                disabled={!newNote.trim()}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Add Note
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {studentNotes.length === 0 ? (
                                            <p className="text-center text-gray-500 py-4">No notes yet</p>
                                        ) : (
                                            studentNotes.map((note) => (
                                                <div key={note.id} className="bg-gray-50 p-4 rounded-lg">
                                                    <p className="mb-2">{note.content}</p>
                                                    <div className="text-right text-xs text-gray-500">
                                                        {new Date(note.created_at).toLocaleString()}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-md p-10 flex flex-col items-center justify-center text-center">
                                <div className="text-7xl mb-4">👈</div>
                                <h3 className="text-xl font-medium mb-2">Select a Student</h3>
                                <p className="text-gray-500">
                                    Choose a student from the list to view details and manage your mentorship.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorDashboard; 