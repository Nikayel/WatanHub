import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import {
    PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

// Components
const MentorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [mentorProfile, setMentorProfile] = useState(null);
    const [assignedStudents, setAssignedStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentNotes, setStudentNotes] = useState([]);
    const [studentNoteCounts, setStudentNoteCounts] = useState({});
    const [noteFilter, setNoteFilter] = useState('all'); // 'all', 'pending', 'acknowledged'
    const [activeTab, setActiveTab] = useState('notes');
    const [notesChannel, setNotesChannel] = useState(null);
    const [newNote, setNewNote] = useState({
        description: '',
        task: '',
        content: '',
        deadline: '',
        start_date: new Date().toISOString().split('T')[0]
    });
    const [demographicData, setDemographicData] = useState({
        age: [],
        gender: [],
        religion: []
    });
    const [stats, setStats] = useState({
        totalStudents: 0,
        meetingsScheduled: 0,
        notesMade: 0,
        notesAcknowledged: 0
    });

    // Colors for charts
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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

            // Fetch note counts for each student
            await fetchStudentNoteCounts(mentorId, students);

            // Fetch statistics
            await fetchStatistics(mentorId);
            // Fetch demographic data
            await fetchDemographicData(students);

        } catch (error) {
            console.error('Error fetching assigned students:', error.message);
        }
    };

    const fetchStudentNoteCounts = async (mentorId, students) => {
        try {
            const counts = {};

            // For each student, get the count of notes
            for (const student of students) {
                const { count, error } = await supabase
                    .from('mentor_notes')
                    .select('id', { count: 'exact', head: true })
                    .eq('student_id', student.id)
                    .eq('mentor_id', mentorId);

                if (!error) {
                    counts[student.id] = count || 0;
                }
            }

            setStudentNoteCounts(counts);
        } catch (error) {
            console.error('Error fetching student note counts:', error.message);
        }
    };

    const fetchDemographicData = async (students) => {
        try {
            // Process age data
            const currentYear = new Date().getFullYear();
            const ageData = students.reduce((acc, student) => {
                if (student.birth_year) {
                    const age = currentYear - parseInt(student.birth_year);
                    const ageRange = Math.floor(age / 5) * 5;
                    const label = `${ageRange}-${ageRange + 4}`;
                    const existing = acc.find(item => item.name === label);
                    if (existing) {
                        existing.value += 1;
                    } else {
                        acc.push({ name: label, value: 1 });
                    }
                }
                return acc;
            }, []);

            // Process gender data
            const genderData = students.reduce((acc, student) => {
                if (student.gender) {
                    const existing = acc.find(item => item.name === student.gender);
                    if (existing) {
                        existing.value += 1;
                    } else {
                        acc.push({ name: student.gender, value: 1 });
                    }
                }
                return acc;
            }, []);

            // Process religion data
            const religionData = students.reduce((acc, student) => {
                if (student.religion) {
                    const existing = acc.find(item => item.name === student.religion);
                    if (existing) {
                        existing.value += 1;
                    } else {
                        acc.push({ name: student.religion, value: 1 });
                    }
                }
                return acc;
            }, []);

            setDemographicData({
                age: ageData.sort((a, b) => a.name.localeCompare(b.name)),
                gender: genderData,
                religion: religionData
            });
        } catch (error) {
            console.error('Error processing demographic data:', error.message);
        }
    };

    const fetchStatistics = async (mentorId) => {
        try {
            console.log('Fetching statistics for mentor:', mentorId);

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

            // Get acknowledged notes count
            const { data: ackNotesData, error: ackNotesError } = await supabase
                .from('mentor_notes')
                .select('count')
                .eq('mentor_id', mentorId)
                .eq('acknowledged', true);

            if (ackNotesError) throw ackNotesError;

            const newStats = {
                totalStudents: assignedStudents.length,
                meetingsScheduled: meetingsData[0]?.count || 0,
                notesMade: notesData[0]?.count || 0,
                notesAcknowledged: ackNotesData[0]?.count || 0
            };

            console.log('Updated statistics:', newStats);
            setStats(newStats);

        } catch (error) {
            console.error('Error fetching statistics:', error.message);
        }
    };

    const handleStudentSelect = async (student) => {
        setSelectedStudent(student);

        // Clean up any existing subscription before creating a new one
        if (notesChannel) {
            supabase.removeChannel(notesChannel);
        }

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

            console.log(`Fetched ${data?.length || 0} notes for student ${studentId}`);
            setStudentNotes(data || []);

            // Setup real-time listener for this student's notes
            const channel = supabase
                .channel(`student-notes-${studentId}`)
                .on('postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'mentor_notes',
                        filter: `student_id=eq.${studentId}`
                    },
                    async (payload) => {
                        console.log('Real-time update on notes:', payload);
                        // Refetch notes when there's any change
                        const { data: refreshedData, error: refreshError } = await supabase
                            .from('mentor_notes')
                            .select('*')
                            .eq('student_id', studentId)
                            .eq('mentor_id', mentorProfile.user_id)
                            .order('created_at', { ascending: false });

                        if (!refreshError) {
                            setStudentNotes(refreshedData || []);
                        }
                    }
                )
                .subscribe();

            setNotesChannel(channel);
        } catch (error) {
            console.error('Error fetching student notes:', error.message);
            toast.error('Failed to load student notes');
        }
    };

    const getFilteredNotes = () => {
        if (!studentNotes || studentNotes.length === 0) {
            return [];
        }

        if (noteFilter === 'pending') {
            return studentNotes.filter(note => !note.acknowledged);
        } else if (noteFilter === 'acknowledged') {
            return studentNotes.filter(note => note.acknowledged);
        }
        return studentNotes;
    };

    const addNote = async () => {
        if (!newNote.description.trim() || !newNote.task.trim() || !newNote.content.trim() || !selectedStudent) return;

        try {
            const { error } = await supabase
                .from('mentor_notes')
                .insert({
                    mentor_id: mentorProfile.user_id,
                    student_id: selectedStudent.id,
                    description: newNote.description.trim(),
                    task: newNote.task.trim(),
                    content: newNote.content.trim(),
                    start_date: new Date(newNote.start_date).toISOString(),
                    deadline: newNote.deadline ? new Date(newNote.deadline).toISOString() : null,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;

            toast.success('Note added successfully');
            setNewNote({
                description: '',
                task: '',
                content: '',
                deadline: '',
                start_date: new Date().toISOString().split('T')[0]
            });

            // Update student notes and statistics
            await fetchStudentNotes(selectedStudent.id);

            // Update the note count for the selected student
            const updatedCounts = { ...studentNoteCounts };
            updatedCounts[selectedStudent.id] = (updatedCounts[selectedStudent.id] || 0) + 1;
            setStudentNoteCounts(updatedCounts);

            // Refresh statistics to update the dashboard stats
            await fetchStatistics(mentorProfile.user_id);

            // Update global stats
            setStats(prev => ({
                ...prev,
                notesMade: prev.notesMade + 1
            }));

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

    // Set up a subscription for note acknowledgments to update stats in real-time
    useEffect(() => {
        if (!mentorProfile?.user_id) return;

        // Subscribe to changes in the mentor_notes table for this mentor
        const notesStatsChannel = supabase
            .channel('mentor-notes-stats')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'mentor_notes',
                    filter: `mentor_id=eq.${mentorProfile.user_id}`
                },
                async (payload) => {
                    console.log('Note change detected, updating statistics:', payload);

                    // Check if the change was an acknowledgment
                    if (payload.eventType === 'UPDATE' &&
                        payload.new.acknowledged !== payload.old.acknowledged) {
                        console.log('Note acknowledgment status changed');

                        // If a note was acknowledged, update the stats immediately
                        if (payload.new.acknowledged) {
                            setStats(prev => ({
                                ...prev,
                                notesAcknowledged: prev.notesAcknowledged + 1
                            }));
                        } else {
                            // If acknowledgment was removed
                            setStats(prev => ({
                                ...prev,
                                notesAcknowledged: Math.max(0, prev.notesAcknowledged - 1)
                            }));
                        }
                    }

                    // For all changes, refresh statistics to ensure accuracy
                    await fetchStatistics(mentorProfile.user_id);
                }
            )
            .subscribe();

        return () => {
            console.log('Cleaning up mentor notes stats subscription');
            supabase.removeChannel(notesStatsChannel);
        };
    }, [mentorProfile?.user_id]);

    // Clean up subscriptions when component unmounts
    useEffect(() => {
        return () => {
            if (notesChannel) {
                supabase.removeChannel(notesChannel);
            }
        };
    }, [notesChannel]);

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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
                        <div className="text-4xl font-bold text-blue-600 mb-2">{stats.notesAcknowledged}</div>
                        <div className="text-gray-500 text-sm">Notes Acknowledged</div>
                    </div>
                </div>

                {/* Dashboard Tabs */}
                <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'notes'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Students & Notes
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'analytics'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Analytics & Demographics
                            </button>
                        </nav>
                    </div>
                </div>

                {activeTab === 'notes' ? (
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
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-indigo-600 font-medium">
                                                            {student.first_name?.[0]}{student.last_name?.[0]}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium">{student.first_name} {student.last_name}</h3>
                                                        <p className="text-sm text-gray-500">{student.email}</p>
                                                        <p className="text-xs text-indigo-600">{student.student_id ? `Student ID: ${student.student_id}` : 'No Student ID'}</p>
                                                    </div>
                                                </div>
                                                {studentNoteCounts[student.id] > 0 && (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                                                            {studentNoteCounts[student.id]} notes
                                                        </span>
                                                    </div>
                                                )}
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
                                                <p className="text-sm font-medium text-indigo-600">{selectedStudent.student_id ? `Student ID: ${selectedStudent.student_id}` : ''}</p>
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
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold">Notes</h3>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => setNoteFilter('all')}
                                                    className={`px-3 py-1 text-sm rounded-lg ${noteFilter === 'all'
                                                        ? 'bg-indigo-100 text-indigo-800'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    All Notes
                                                </button>
                                                <button
                                                    onClick={() => setNoteFilter('pending')}
                                                    className={`px-3 py-1 text-sm rounded-lg ${noteFilter === 'pending'
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    Pending
                                                </button>
                                                <button
                                                    onClick={() => setNoteFilter('acknowledged')}
                                                    className={`px-3 py-1 text-sm rounded-lg ${noteFilter === 'acknowledged'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    Completed
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mb-6 bg-gray-50 rounded-lg p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-gray-700 text-sm font-medium mb-1">Description</label>
                                                    <input
                                                        type="text"
                                                        value={newNote.description}
                                                        onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                                                        placeholder="Brief description"
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-700 text-sm font-medium mb-1">Task</label>
                                                    <input
                                                        type="text"
                                                        value={newNote.task}
                                                        onChange={(e) => setNewNote({ ...newNote, task: e.target.value })}
                                                        placeholder="Assigned task"
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-gray-700 text-sm font-medium mb-1">Start Date</label>
                                                    <input
                                                        type="date"
                                                        value={newNote.start_date}
                                                        onChange={(e) => setNewNote({ ...newNote, start_date: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-700 text-sm font-medium mb-1">Deadline (Optional)</label>
                                                    <input
                                                        type="date"
                                                        value={newNote.deadline}
                                                        onChange={(e) => setNewNote({ ...newNote, deadline: e.target.value })}
                                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-gray-700 text-sm font-medium mb-1">Note Content</label>
                                                <textarea
                                                    value={newNote.content}
                                                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                                    placeholder="Add details, feedback, or instructions..."
                                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    rows="3"
                                                ></textarea>
                                            </div>

                                            <div className="flex justify-end mt-3">
                                                <button
                                                    onClick={addNote}
                                                    disabled={!newNote.description.trim() || !newNote.task.trim() || !newNote.content.trim()}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Add Note
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {getFilteredNotes().length === 0 ? (
                                                <p className="text-center text-gray-500 py-4">
                                                    {studentNotes.length === 0
                                                        ? 'No notes yet'
                                                        : noteFilter === 'pending'
                                                            ? 'No pending notes'
                                                            : 'No completed notes'}
                                                </p>
                                            ) : (
                                                getFilteredNotes().map((note) => (
                                                    <div key={note.id} className="bg-gray-50 p-4 rounded-lg border-l-4 border-indigo-500">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-medium text-indigo-700">{note.description}</h4>
                                                            <div className="flex items-center">
                                                                <span className="text-xs font-medium px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full mr-2">
                                                                    {note.task}
                                                                </span>
                                                                {note.acknowledged ? (
                                                                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                                                        Acknowledged
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                                                        Pending
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <p className="mb-3">{note.content}</p>

                                                        <div className="flex justify-between text-xs text-gray-500">
                                                            <div>
                                                                <span className="font-medium">Start:</span> {new Date(note.start_date).toLocaleDateString()}
                                                                {note.deadline && (
                                                                    <span className="ml-3">
                                                                        <span className="font-medium">Deadline:</span> {new Date(note.deadline).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div>
                                                                Created: {new Date(note.created_at).toLocaleString()}
                                                            </div>
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
                ) : (
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h2 className="text-xl font-bold mb-6">Demographics and Analytics</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {/* Age Distribution */}
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                                <h3 className="text-lg font-semibold mb-4">Age Distribution</h3>
                                <div className="h-64">
                                    {demographicData.age.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={demographicData.age}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="value" name="Students" fill="#8884d8" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <p className="text-gray-500">No age data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Gender Distribution */}
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                                <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
                                <div className="h-64">
                                    {demographicData.gender.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={demographicData.gender}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    nameKey="name"
                                                    label
                                                >
                                                    {demographicData.gender.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <p className="text-gray-500">No gender data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Religion Distribution */}
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                                <h3 className="text-lg font-semibold mb-4">Religion Distribution</h3>
                                <div className="h-64">
                                    {demographicData.religion.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={demographicData.religion}
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                    nameKey="name"
                                                    label
                                                >
                                                    {demographicData.religion.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center">
                                            <p className="text-gray-500">No religion data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 bg-gray-50 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Note Completion Analytics</h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={[
                                            { name: 'Total Notes', value: stats.notesMade },
                                            { name: 'Acknowledged', value: stats.notesAcknowledged },
                                            { name: 'Pending', value: stats.notesMade - stats.notesAcknowledged }
                                        ]}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="value" name="Notes" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MentorDashboard; 