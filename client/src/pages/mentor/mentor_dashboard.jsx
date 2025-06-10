// src/pages/MentorDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
// Charts removed to simplify dashboard
import OutcomeTagging from '../../components/OutcomeTagging';
import OutcomeModal from '../../components/OutcomeModal';
import StudentSchoolChoicesViewer from '../../components/StudentSchoolChoicesViewer';
import MentorSidebar from '../../components/MentorDashboard/MentorSidebar';
import StudentDetailModal from '../../components/StudentDetailModal';

const MentorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    const [mentorProfile, setMentorProfile] = useState(null);
    const [mentorId, setMentorId] = useState(null);

    // Which student is currently selected in the list
    const [selectedStudent, setSelectedStudent] = useState(null);

    // All mentor_notes for the selected student
    const [studentNotes, setStudentNotes] = useState([]);
    const [noteFilter, setNoteFilter] = useState('all');
    const [expandedNotes, setExpandedNotes] = useState({});
    const [notesChannel, setNotesChannel] = useState(null);

    // OUTER dashboard tab: 'students' | 'schools' | 'outcomes' | 'analytics'
    const [activeTab, setActiveTab] = useState('students');

    // Sub tab for each main tab
    const [subTab, setSubTab] = useState('list');

    // INNER student‐detail tab: 'notes' | 'outcomes'
    const [detailTab, setDetailTab] = useState('notes');

    // Outcome‐related state
    const [outcomeType, setOutcomeType] = useState('');
    const [collegeAdmissions, setCollegeAdmissions] = useState([]);
    const [scholarships, setScholarships] = useState([]);
    const [employments, setEmployments] = useState([]);

    const [showMeetingDialog, setShowMeetingDialog] = useState(false);
    const [meetingData, setMeetingData] = useState({
        student_id: '',
        meeting_link: '',
        meeting_date: '',
        meeting_time: '',
        notes: ''
    });

    const [stats, setStats] = useState({
        totalNotes: 0,
        totalMeetings: 0,
        meetingsThisMonth: 0,
        notesMade: 0,
        notesAcknowledged: 0
    });

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

    const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
    const [editingOutcome, setEditingOutcome] = useState(null);

    // Student detail modal
    const [studentDetailModalOpen, setStudentDetailModalOpen] = useState(false);
    const [detailModalStudent, setDetailModalStudent] = useState(null);

    // Chart colors - kept for future analytics features
    // eslint-disable-next-line no-unused-vars
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    // ─── Fetch mentor profile on mount ─────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        fetchMentorProfile();
    }, [user, navigate]);

    const fetchMentorProfile = async () => {
        try {
            setLoading(true);
            setMentorId(user.id);

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

            // Load assigned students
            await fetchAssignedStudents(user.id);
        } catch (error) {
            console.error('Error fetching mentor profile:', error.message);
            toast.error('Failed to load mentor dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignedStudents = async (mentorUserId) => {
        try {
            console.log('🔍 DEBUG: Starting fetchAssignedStudents with mentorUserId:', mentorUserId);

            // First get the mentor table ID from the mentor user_id
            const { data: mentorData, error: mentorError } = await supabase
                .from('mentors')
                .select('id')
                .eq('user_id', mentorUserId)
                .single();

            console.log('🔍 DEBUG: Mentor lookup result:', { mentorData, mentorError });

            if (mentorError || !mentorData) {
                console.error('Mentor not found:', mentorError);
                return;
            }

            // Now get students assigned to this mentor using mentor.id
            const { data, error } = await supabase
                .from('mentor_student')
                .select(`
                    students:student_id (
                        *,
                        users:user_id (
                            email
                        )
                    )
                `)
                .eq('mentor_id', mentorData.id);

            console.log('🔍 DEBUG: Mentor-student lookup result:', { data, error });

            if (error) throw error;

            const loadedStudents = data.map((item) => ({
                ...item.students,
                email: item.students.users?.email,
                // Use user_id for compatibility with other components
                id: item.students.user_id,
                user_id: item.students.user_id
            }));

            console.log('🔍 DEBUG: Processed students:', loadedStudents);
            setStudents(loadedStudents);

            // Initialize stats.totalNotes to number of students for placeholder
            setStats((prev) => ({ ...prev, totalNotes: loadedStudents.length }));

            await fetchStudentNoteCounts(mentorUserId, loadedStudents);
            await fetchStatistics(mentorUserId);
            await fetchDemographicData(loadedStudents);
        } catch (error) {
            console.error('Error fetching assigned students:', error.message);
            console.error('Full error:', error);
        }
    };

    const fetchStudentNoteCounts = async (mentorUserId, students) => {
        try {
            let counts = {};
            for (const student of students) {
                const { count, error } = await supabase
                    .from('mentor_notes')
                    .select('id', { count: 'exact', head: true })
                    .eq('student_id', student.user_id) // Use student user_id for notes
                    .eq('mentor_id', mentorUserId); // Use mentor user_id for notes
                if (!error) {
                    counts[student.id] = count || 0;
                }
            }
            const total = Object.values(counts).reduce((a, b) => a + b, 0);
            setStats((prev) => ({ ...prev, totalNotes: total }));
        } catch (error) {
            console.error('Error fetching student note counts:', error.message);
        }
    };

    const fetchDemographicData = async (students) => {
        try {
            // Age ranges
            const ageData = students.reduce((acc, student) => {
                if (student.date_of_birth) {
                    const birthDate = new Date(student.date_of_birth);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }
                    const ageRange = Math.floor(age / 5) * 5;
                    const label = `${ageRange}-${ageRange + 4}`;
                    const existing = acc.find((item) => item.name === label);
                    if (existing) existing.value++;
                    else acc.push({ name: label, value: 1 });
                }
                return acc;
            }, []);

            // Gender distribution
            const genderData = students.reduce((acc, student) => {
                if (student.gender) {
                    const existing = acc.find((item) => item.name === student.gender);
                    if (existing) existing.value++;
                    else acc.push({ name: student.gender, value: 1 });
                }
                return acc;
            }, []);

            // Religion distribution
            const religionData = students.reduce((acc, student) => {
                if (student.religion) {
                    const existing = acc.find((item) => item.name === student.religion);
                    if (existing) existing.value++;
                    else acc.push({ name: student.religion, value: 1 });
                }
                return acc;
            }, []);

            setDemographicData({
                age: ageData.sort((a, b) => parseInt(a.name.split('-')[0]) - parseInt(b.name.split('-')[0])),
                gender: genderData,
                religion: religionData
            });
        } catch (error) {
            console.error('Error processing demographic data:', error.message);
        }
    };

    const fetchStatistics = async (mentorUserId) => {
        try {
            // Meetings count
            const { data: meetingsData, error: meetingsError } = await supabase
                .from('mentor_meetings')
                .select('count')
                .eq('mentor_id', mentorUserId);
            if (meetingsError) throw meetingsError;

            // Notes made
            const { data: notesData, error: notesError } = await supabase
                .from('mentor_notes')
                .select('count')
                .eq('mentor_id', mentorUserId);
            if (notesError) throw notesError;

            // Acknowledged notes
            const { data: ackNotesData, error: ackNotesError } = await supabase
                .from('mentor_notes')
                .select('count')
                .eq('mentor_id', mentorUserId)
                .eq('acknowledged', true);
            if (ackNotesError) throw ackNotesError;

            setStats((prev) => ({
                ...prev,
                totalMeetings: meetingsData[0]?.count || 0,
                notesMade: notesData[0]?.count || 0,
                notesAcknowledged: ackNotesData[0]?.count || 0
            }));
        } catch (error) {
            console.error('Error fetching statistics:', error.message);
        }
    };

    // ─── Handle selecting a student ──────────────────────────────────────────────────
    const handleStudentSelect = async (student) => {
        setSelectedStudent(student);

        // If there was an existing real‐time channel, remove it
        if (notesChannel) {
            supabase.removeChannel(notesChannel);
            setNotesChannel(null);
        }

        // Immediately fetch notes and outcomes for that student (using user_id)
        await fetchStudentNotes(student.user_id);
        await fetchStudentOutcomes(student.user_id);

        // Reset inner detail tab to 'notes' by default
        setDetailTab('notes');
        setOutcomeType('');
    };

    const fetchStudentNotes = async (studentUserId) => {
        try {
            setStudentNotes([]);
            if (!user?.id) {
                console.error('User ID missing; cannot fetch notes.');
                toast.error('Unable to fetch notes. Please try again later.');
                return;
            }

            const { data, error } = await supabase
                .from('mentor_notes')
                .select('*')
                .eq('student_id', studentUserId) // Use student user_id
                .eq('mentor_id', user.id) // Use mentor user_id
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formatted = data.map((note) => ({
                ...note,
                created_at_formatted: new Date(note.created_at).toLocaleString(),
                start_date_formatted: note.start_date ? new Date(note.start_date).toLocaleDateString() : '',
                deadline_formatted: note.deadline ? new Date(note.deadline).toLocaleDateString() : ''
            }));

            setStudentNotes(formatted);

            // Subscribe to real‐time changes for this student's notes
            const channel = supabase
                .channel(`student-notes-${studentUserId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'mentor_notes',
                        filter: `student_id=eq.${studentUserId}`
                    },
                    async (payload) => {
                        // INSERT
                        if (payload.eventType === 'INSERT') {
                            const newNote = {
                                ...payload.new,
                                created_at_formatted: new Date(payload.new.created_at).toLocaleString(),
                                start_date_formatted: payload.new.start_date
                                    ? new Date(payload.new.start_date).toLocaleDateString()
                                    : '',
                                deadline_formatted: payload.new.deadline
                                    ? new Date(payload.new.deadline).toLocaleDateString()
                                    : ''
                            };
                            setStudentNotes((prev) => [newNote, ...prev]);
                        }

                        // UPDATE
                        if (payload.eventType === 'UPDATE') {
                            setStudentNotes((prev) =>
                                prev.map((n) =>
                                    n.id === payload.new.id
                                        ? {
                                            ...payload.new,
                                            created_at_formatted: new Date(payload.new.created_at).toLocaleString(),
                                            start_date_formatted: payload.new.start_date
                                                ? new Date(payload.new.start_date).toLocaleDateString()
                                                : '',
                                            deadline_formatted: payload.new.deadline
                                                ? new Date(payload.new.deadline).toLocaleDateString()
                                                : ''
                                        }
                                        : n
                                )
                            );
                        }

                        // DELETE
                        if (payload.eventType === 'DELETE') {
                            setStudentNotes((prev) => prev.filter((n) => n.id !== payload.old.id));
                        }

                        // As fallback, re‐fetch all notes:
                        const { data: refreshedData, error: refreshError } = await supabase
                            .from('mentor_notes')
                            .select('*')
                            .eq('student_id', studentUserId)
                            .eq('mentor_id', user.id)
                            .order('created_at', { ascending: false });

                        if (!refreshError && refreshedData) {
                            const reformat = refreshedData.map((note) => ({
                                ...note,
                                created_at_formatted: new Date(note.created_at).toLocaleString(),
                                start_date_formatted: note.start_date
                                    ? new Date(note.start_date).toLocaleDateString()
                                    : '',
                                deadline_formatted: note.deadline ? new Date(note.deadline).toLocaleDateString() : ''
                            }));
                            setStudentNotes(reformat);
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log(`Listening for real-time notes changes for student ${studentUserId}`);
                    }
                });

            setNotesChannel(channel);
        } catch (error) {
            console.error('Error fetching student notes:', error.message);
            toast.error('Failed to load student notes');
        }
    };

    const fetchStudentOutcomes = async (studentUserId) => {
        try {
            setCollegeAdmissions([]);
            setScholarships([]);
            setEmployments([]);

            const { data: admissionsData, error: admissionsError } = await supabase
                .from('college_admissions')
                .select('*')
                .eq('student_id', studentUserId)
                .order('admission_date', { ascending: false });
            if (!admissionsError && admissionsData) setCollegeAdmissions(admissionsData);

            const { data: scholarshipsData, error: scholarshipsError } = await supabase
                .from('scholarship_awards')
                .select('*')
                .eq('student_id', studentUserId)
                .order('award_date', { ascending: false });
            if (!scholarshipsError && scholarshipsData) setScholarships(scholarshipsData);

            const { data: employmentData, error: employmentError } = await supabase
                .from('student_employment')
                .select('*')
                .eq('student_id', studentUserId)
                .order('start_date', { ascending: false });
            if (!employmentError && employmentData) setEmployments(employmentData);
        } catch (error) {
            console.error('Error fetching student outcomes:', error);
            toast.error('Failed to load student outcomes');
        }
    };

    // Filter notes locally
    const getFilteredNotes = () => {
        if (!studentNotes || studentNotes.length === 0) return [];
        if (noteFilter === 'pending') return studentNotes.filter((n) => !n.acknowledged);
        if (noteFilter === 'acknowledged') return studentNotes.filter((n) => n.acknowledged);
        return studentNotes;
    };

    // Add a new note
    const addNote = async () => {
        try {
            if (!newNote.description.trim() || !newNote.task.trim() || !newNote.content.trim()) {
                toast.error('Please fill in all required fields');
                return;
            }
            if (!user?.id || !selectedStudent?.user_id) {
                toast.error('Missing mentor or student info');
                console.error('Missing IDs:', { mentorId: user?.id, studentUserId: selectedStudent?.user_id });
                return;
            }
            setLoading(true);

            const formatted = {
                mentor_id: user.id,
                student_id: selectedStudent.user_id, // Use student user_id for notes
                description: newNote.description.trim(),
                task: newNote.task.trim(),
                content: newNote.content.trim(),
                start_date: newNote.start_date
                    ? new Date(newNote.start_date).toISOString()
                    : new Date().toISOString(),
                deadline: newNote.deadline ? new Date(newNote.deadline).toISOString() : null,
                acknowledged: false
            };

            const { data, error } = await supabase.from('mentor_notes').insert(formatted).select();
            if (error) throw error;

            setNewNote({
                description: '',
                task: '',
                content: '',
                deadline: '',
                start_date: new Date().toISOString().split('T')[0]
            });

            setStats((prev) => ({ ...prev, notesMade: prev.notesMade + 1 }));
            await fetchStudentNotes(selectedStudent.user_id);
            toast.success('Note added successfully!');
        } catch (error) {
            console.error('Error adding note:', error);
            toast.error(`Failed to add note: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    // Placeholder for scheduling a meeting
    const scheduleMeeting = async (studentId) => {
        toast.info('Meeting scheduling feature coming soon!');
    };

    // ─── Subscribe to mentor_notes changes for stats ─────────────────────────────────
    useEffect(() => {
        if (!user?.id) return;
        const notesStatsChannel = supabase
            .channel('mentor-notes-stats')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'mentor_notes',
                    filter: `mentor_id=eq.${user.id}`
                },
                async (payload) => {
                    // If acknowledged changed
                    if (
                        payload.eventType === 'UPDATE' &&
                        payload.new.acknowledged !== payload.old.acknowledged
                    ) {
                        if (payload.new.acknowledged) {
                            setStats((prev) => ({ ...prev, notesAcknowledged: prev.notesAcknowledged + 1 }));
                            toast.success('Note acknowledged by student!', {
                                position: 'bottom-right',
                                duration: 3000
                            });
                        } else {
                            setStats((prev) => ({
                                ...prev,
                                notesAcknowledged: Math.max(0, prev.notesAcknowledged - 1)
                            }));
                        }
                    } else if (payload.eventType === 'INSERT') {
                        setStats((prev) => ({ ...prev, notesMade: prev.notesMade + 1 }));
                    } else if (payload.eventType === 'DELETE') {
                        setStats((prev) => ({
                            ...prev,
                            notesMade: Math.max(0, prev.notesMade - 1),
                            notesAcknowledged: payload.old.acknowledged
                                ? Math.max(0, prev.notesAcknowledged - 1)
                                : prev.notesAcknowledged
                        }));
                    }

                    // Refresh overall stats
                    await fetchStatistics(user.id);
                }
            )
            .subscribe();

        return () => supabase.removeChannel(notesStatsChannel);
    }, [user?.id]);

    // ─── Cleanup any active subscription on unmount ──────────────────────────────────
    useEffect(() => {
        return () => {
            if (notesChannel) supabase.removeChannel(notesChannel);
        };
    }, [notesChannel]);

    // ─── "Create New Note" form (renders under notes section) ─────────────────────────
    const renderNoteEditorForm = () => (
        <div id="add-note-form" className="mt-8 bg-white rounded-lg border shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Note</h3>
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={newNote.description}
                            onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                            placeholder="Brief description of note"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Task <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={newNote.task}
                            onChange={(e) => setNewNote({ ...newNote, task: e.target.value })}
                            placeholder="e.g. 'Review material', 'Prepare for test'"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={newNote.start_date}
                            onChange={(e) => setNewNote({ ...newNote, start_date: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (Optional)</label>
                        <input
                            type="date"
                            value={newNote.deadline}
                            onChange={(e) => setNewNote({ ...newNote, deadline: e.target.value })}
                            min={newNote.start_date}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Note Content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={newNote.content}
                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                        placeholder="Add detailed instructions, feedback, or observations..."
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        rows="4"
                        required
                    />
                </div>
                <div className="flex justify-end">
                    <button
                        onClick={addNote}
                        disabled={loading || !newNote.description.trim() || !newNote.task.trim() || !newNote.content.trim()}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Adding...' : 'Add Note'}
                    </button>
                </div>
            </div>
        </div>
    );

    const handleOutcomeSuccess = async (data) => {
        if (!selectedStudent?.id) return;
        await fetchStudentOutcomes(selectedStudent.id);

        // If it was a college admission, update flags
        if (outcomeType === 'admission') {
            const hasCollegeAdmit = !!selectedStudent.college_admit;
            const hasStemMajor = !!selectedStudent.stem_major;
            const newData = data[0] || {};
            let needsUpdate = false;
            let updatePayload = {};

            if (newData.is_stem && !hasStemMajor) {
                updatePayload.stem_major = true;
                needsUpdate = true;
            }
            if (!hasCollegeAdmit) {
                updatePayload.college_admit = true;
                needsUpdate = true;
            }

            if (needsUpdate) {
                try {
                    const { error } = await supabase
                        .from('profiles')
                        .update(updatePayload)
                        .eq('id', selectedStudent.id);
                    if (!error) {
                        setSelectedStudent((prev) => ({ ...prev, ...updatePayload }));
                    }
                } catch (err) {
                    console.error('Error updating student outcome flags:', err);
                }
            }
        }

        // If scholarship:
        if (outcomeType === 'scholarship' && !selectedStudent.scholarship_awarded) {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({ scholarship_awarded: true })
                    .eq('id', selectedStudent.id);
                if (!error) {
                    setSelectedStudent((prev) => ({ ...prev, scholarship_awarded: true }));
                }
            } catch (err) {
                console.error('Error updating scholarship flag:', err);
            }
        }
    };

    const toggleNoteExpansion = (noteId) => {
        setExpandedNotes((prev) => ({
            ...prev,
            [noteId]: !prev[noteId]
        }));
    };

    const openStudentDetailModal = (student) => {
        setDetailModalStudent(student);
        setStudentDetailModalOpen(true);
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
            {/* ─── HEADER ──────────────────────────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-6 px-4 sm:px-6 lg:px-8 shadow-lg">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="px-3 py-1 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm transition flex items-center space-x-1"
                    >
                        <span>←</span>
                        <span>Home</span>
                    </button>
                    <h1 className="text-3xl font-bold">Mentor Dashboard</h1>
                    <Link
                        to="/profile"
                        className="hidden sm:flex px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg shadow transition text-sm flex items-center"
                    >
                        <span className="mr-1">👤</span> Profile
                    </Link>
                </div>
            </div>

            {/* ─── MAIN CONTENT WITH AI SIDEBAR ──────────────────────────────────────── */}
            <div className="flex h-screen">
                {/* AI Advisor Sidebar */}
                {/* <AIAdvisorSidebar
                    studentName={selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : null}
                    isCollapsed={!showAISidebar}
                    onToggle={() => setShowAISidebar(!showAISidebar)}
                    selectedStudent={selectedStudent}
                /> */}

                {/* Main Dashboard Content */}
                <div className="flex-1 overflow-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* ─── Stats Overview ────────────────────────────────────────────────────── */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
                                <div className="text-4xl font-bold text-indigo-600 mb-2">{students.length}</div>
                                <div className="text-gray-500 text-sm">Assigned Students</div>
                            </div>
                            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
                                <div className="text-4xl font-bold text-green-600 mb-2">{stats.totalMeetings}</div>
                                <div className="text-gray-500 text-sm">Meetings Scheduled</div>
                            </div>
                            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
                                <div className="text-4xl font-bold text-purple-600 mb-2">{stats.meetingsThisMonth}</div>
                                <div className="text-gray-500 text-sm">Meetings This Month</div>
                            </div>
                            <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
                                <div className="text-4xl font-bold text-blue-600 mb-2">{stats.notesMade}</div>
                                <div className="text-gray-500 text-sm">Notes Made</div>
                            </div>
                        </div>

                        {/* ─── Main Content with Sidebar Layout ────────────────────────────────────────────────── */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            {/* Sidebar */}
                            <div className="lg:col-span-1">
                                <MentorSidebar
                                    activeTab={activeTab}
                                    setActiveTab={setActiveTab}
                                    subTab={subTab}
                                    setSubTab={setSubTab}
                                    students={students}
                                    stats={stats}
                                />
                            </div>

                            {/* Main Content Area */}
                            <div className="lg:col-span-3">
                                {/* ─── Students Tab Content ──────────────────────────────────────── */}
                                {activeTab === 'students' && (
                                    <>
                                        {subTab === 'list' && (
                                            <div className="bg-white rounded-xl shadow-md p-6">
                                                <h2 className="text-xl font-bold mb-4">Your Students</h2>
                                                {students.length === 0 ? (
                                                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                                                        <p className="text-gray-500">No students assigned yet</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {students.map((student) => (
                                                            <div
                                                                key={student.id}
                                                                onClick={() => handleStudentSelect(student)}
                                                                className={`p-4 rounded-lg border cursor-pointer transition-colors ${selectedStudent?.id === student.id
                                                                    ? 'bg-indigo-50 border-indigo-300'
                                                                    : 'hover:bg-gray-50 border-gray-200'
                                                                    }`}
                                                            >
                                                                <div className="flex items-center justify-between w-full">
                                                                    <div className="flex items-center">
                                                                        <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                                                                            <span className="text-indigo-600 font-medium">
                                                                                {student.first_name?.[0]}
                                                                                {student.last_name?.[0]}
                                                                            </span>
                                                                        </div>
                                                                        <div>
                                                                            <h3 className="font-medium">
                                                                                {student.first_name} {student.last_name}
                                                                            </h3>
                                                                            <p className="text-sm text-gray-500">{student.education_level || 'Student'}</p>
                                                                            <p className="text-xs text-indigo-600">
                                                                                {student.student_id
                                                                                    ? `Student ID: ${student.student_id}`
                                                                                    : 'No Student ID'}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            openStudentDetailModal(student);
                                                                        }}
                                                                        className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                                                                    >
                                                                        View Profile
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {subTab === 'notes' && selectedStudent && (
                                            <div className="bg-white rounded-xl shadow-md">
                                                {/* Profile Header */}
                                                <div className="p-6 border-b border-gray-200">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-800 font-bold text-xl">
                                                            {selectedStudent.first_name[0]}
                                                            {selectedStudent.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <h2 className="text-2xl font-bold">
                                                                {selectedStudent.first_name} {selectedStudent.last_name}
                                                            </h2>
                                                            <p className="text-gray-600">Student ID: {selectedStudent.student_id}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => scheduleMeeting(selectedStudent.user_id)}
                                                            className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                                                        >
                                                            Schedule Meeting
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Notes Content */}
                                                <div className="p-6">
                                                    {/* Notes Filter & Add Button */}
                                                    <div className="mb-4 flex flex-wrap gap-2 items-center justify-between">
                                                        <div className="flex space-x-2">
                                                            <button
                                                                onClick={() => setNoteFilter('all')}
                                                                className={`px-3 py-1 text-xs rounded-full ${noteFilter === 'all'
                                                                    ? 'bg-indigo-100 text-indigo-700'
                                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                    }`}
                                                            >
                                                                All
                                                            </button>
                                                            <button
                                                                onClick={() => setNoteFilter('pending')}
                                                                className={`px-3 py-1 text-xs rounded-full ${noteFilter === 'pending'
                                                                    ? 'bg-yellow-100 text-yellow-700'
                                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                    }`}
                                                            >
                                                                Pending
                                                            </button>
                                                            <button
                                                                onClick={() => setNoteFilter('acknowledged')}
                                                                className={`px-3 py-1 text-xs rounded-full ${noteFilter === 'acknowledged'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                                    }`}
                                                            >
                                                                Completed
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setNewNote({
                                                                    description: '',
                                                                    task: '',
                                                                    content: '',
                                                                    deadline: '',
                                                                    start_date: new Date().toISOString().split('T')[0]
                                                                });
                                                            }}
                                                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
                                                        >
                                                            Add Note
                                                        </button>
                                                    </div>

                                                    {/* List of Notes */}
                                                    {getFilteredNotes().length === 0 ? (
                                                        <div className="bg-gray-50 rounded-lg p-6 text-center border border-dashed">
                                                            <p className="text-gray-500">
                                                                No notes yet. Add your first note for {selectedStudent.first_name}.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {getFilteredNotes().map((note) => (
                                                                <div
                                                                    key={note.id}
                                                                    className={`p-4 rounded-lg border ${note.acknowledged
                                                                        ? 'border-l-4 border-l-green-500 border-gray-200'
                                                                        : 'border-l-4 border-l-yellow-500 border-gray-200'
                                                                        }`}
                                                                >
                                                                    <div className="flex justify-between">
                                                                        <h4 className="font-semibold text-gray-800">{note.task}</h4>
                                                                        <span
                                                                            className={`text-xs px-2 py-0.5 rounded-full ${note.acknowledged
                                                                                ? 'bg-green-100 text-green-800'
                                                                                : 'bg-yellow-100 text-yellow-800'
                                                                                }`}
                                                                        >
                                                                            {note.acknowledged ? 'Completed' : 'Pending'}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 mt-1">{note.description}</p>
                                                                    <div className="mt-2 text-sm text-gray-500 whitespace-pre-wrap">
                                                                        {note.content}
                                                                    </div>
                                                                    <div className="mt-2 text-xs text-gray-400">
                                                                        Created: {new Date(note.created_at).toLocaleDateString()}
                                                                        {note.deadline && (
                                                                            <span className="ml-4">
                                                                                Deadline: {new Date(note.deadline).toLocaleDateString()}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Add Note Form */}
                                                    <div className="mt-8">
                                                        {renderNoteEditorForm()}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {subTab === 'meetings' && (
                                            <div className="bg-white rounded-xl shadow-md p-6">
                                                <h2 className="text-xl font-bold mb-4">Meetings</h2>
                                                <div className="text-center p-6 bg-gray-50 rounded-lg">
                                                    <p className="text-gray-500">Meeting management coming soon</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* ─── Schools Tab Content ──────────────────────────────────────── */}
                                {activeTab === 'schools' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                        {/* Student List */}
                                        <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6">
                                            <h2 className="text-xl font-bold mb-4">Your Students</h2>
                                            {students.length === 0 ? (
                                                <div className="text-center p-6 bg-gray-50 rounded-lg">
                                                    <p className="text-gray-500">No students assigned yet</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {students.map((student) => (
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
                                                                        {student.first_name?.[0]}
                                                                        {student.last_name?.[0]}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-medium">
                                                                        {student.first_name} {student.last_name}
                                                                    </h3>
                                                                    <p className="text-sm text-gray-500">{student.education_level || 'Student'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* School Choices Viewer */}
                                        <div className="lg:col-span-3">
                                            {selectedStudent ? (
                                                <div className="bg-white rounded-xl shadow-md p-6">
                                                    <div className="flex items-center mb-6">
                                                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-800 font-bold text-xl mr-4">
                                                            {selectedStudent.first_name[0]}
                                                            {selectedStudent.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <h2 className="text-2xl font-bold">
                                                                {selectedStudent.first_name} {selectedStudent.last_name}'s School Choices
                                                            </h2>
                                                            <p className="text-gray-600">Review and provide guidance on their college selections</p>
                                                        </div>
                                                    </div>
                                                    <StudentSchoolChoicesViewer
                                                        studentId={selectedStudent.user_id}
                                                        forMentor={true}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="bg-white rounded-xl shadow-md p-10 flex flex-col items-center justify-center text-center">
                                                    <div className="text-7xl mb-4">🎓</div>
                                                    <h3 className="text-xl font-medium mb-2">Select a Student</h3>
                                                    <p className="text-gray-500">
                                                        Choose a student from the list to view their school choices and provide guidance.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* ─── Outcomes Tab Content ──────────────────────────────────────── */}
                                {activeTab === 'outcomes' && (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        {/* Student List */}
                                        <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6">
                                            <h2 className="text-xl font-bold mb-4">Your Students</h2>
                                            {students.length === 0 ? (
                                                <div className="text-center p-6 bg-gray-50 rounded-lg">
                                                    <p className="text-gray-500">No students assigned yet</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {students.map((student) => (
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
                                                                        {student.first_name?.[0]}
                                                                        {student.last_name?.[0]}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-medium">{student.first_name} {student.last_name}</h3>
                                                                    <p className="text-sm text-gray-500">{student.education_level || 'Student'}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Outcomes Dashboard */}
                                        <div className="lg:col-span-2">
                                            {selectedStudent ? (
                                                <div className="bg-white rounded-xl shadow-md">
                                                    {/* Profile header */}
                                                    <div className="p-6 border-b border-gray-200">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-800 font-bold text-xl">
                                                                {selectedStudent.first_name[0]}
                                                                {selectedStudent.last_name[0]}
                                                            </div>
                                                            <div>
                                                                <h2 className="text-2xl font-bold">
                                                                    {selectedStudent.first_name} {selectedStudent.last_name}
                                                                </h2>
                                                                <p className="text-gray-600">Student ID: {selectedStudent.student_id}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Quick outcome flags */}
                                                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                                                        <h4 className="font-medium text-gray-800 mb-3">Quick Outcome Flags</h4>
                                                        <OutcomeTagging
                                                            student={selectedStudent}
                                                            onUpdate={(outcomes) => {
                                                                setSelectedStudent((prev) => ({
                                                                    ...prev,
                                                                    college_admit: outcomes.college_admit,
                                                                    scholarship_awarded: outcomes.scholarship_awarded,
                                                                    stem_major: outcomes.stem_major
                                                                }));
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="p-6">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h3 className="text-lg font-semibold">College Admissions</h3>
                                                            <button
                                                                onClick={() => {
                                                                    setOutcomeType('admission');
                                                                    setEditingOutcome(null);
                                                                    setOutcomeModalOpen(true);
                                                                }}
                                                                className="px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition flex items-center"
                                                            >
                                                                <span className="mr-1">+</span> Add New
                                                            </button>
                                                        </div>

                                                        {collegeAdmissions.length === 0 ? (
                                                            <div className="py-8 px-4 text-center bg-gray-50 rounded-lg border border-dashed">
                                                                <p className="text-gray-500">No college admissions recorded yet.</p>
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                {collegeAdmissions.map((admission) => (
                                                                    <div
                                                                        key={admission.id}
                                                                        className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                                                                    >
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <div>
                                                                                <h4 className="font-semibold text-gray-800">
                                                                                    {admission.college_name}
                                                                                </h4>
                                                                                <p className="text-sm text-gray-600">
                                                                                    {admission.major ? `Major: ${admission.major}` : 'Major not specified'}
                                                                                    {admission.is_stem && (
                                                                                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                                                                                            STEM
                                                                                        </span>
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                                                                                    {new Date(admission.admission_date).toLocaleDateString()}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-3 flex justify-end">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setOutcomeType('admission');
                                                                                    setEditingOutcome(admission);
                                                                                    setOutcomeModalOpen(true);
                                                                                }}
                                                                                className="text-xs text-indigo-600 hover:text-indigo-800"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="bg-white rounded-xl shadow-md p-10 flex flex-col items-center justify-center text-center">
                                                    <div className="text-7xl mb-4">📊</div>
                                                    <h3 className="text-xl font-medium mb-2">Select a Student</h3>
                                                    <p className="text-gray-500">
                                                        Choose a student from the list to view and track their outcomes.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ─── Outcome Modal ───────────────────────────────────────────────────────── */}
                        <OutcomeModal
                            isOpen={outcomeModalOpen}
                            onClose={() => {
                                setOutcomeModalOpen(false);
                            }}
                            student={selectedStudent}
                            mentorId={user?.id}
                            outcomeType={outcomeType}
                            initialData={editingOutcome}
                            onSuccess={handleOutcomeSuccess}
                        />

                        {/* ─── Student Detail Modal ───────────────────────────────────────────────────────── */}
                        <StudentDetailModal
                            student={detailModalStudent}
                            isOpen={studentDetailModalOpen}
                            onClose={() => {
                                setStudentDetailModalOpen(false);
                                setDetailModalStudent(null);
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorDashboard;
