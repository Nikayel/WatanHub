import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { toast } from 'sonner';
import {
    PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import OutcomeTagging from '../../components/OutcomeTagging';
import OutcomeModal from '../../components/OutcomeModal';
// eslint-disable-next-line no-unused-vars
import SchoolChoiceManager from '../../components/SchoolChoiceManager';
import StudentSchoolChoicesViewer from '../../components/StudentSchoolChoicesViewer';

// Components
const MentorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState([]);
    // eslint-disable-next-line no-unused-vars
    const [mentorProfile, setMentorProfile] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [mentorId, setMentorId] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentNotes, setStudentNotes] = useState([]);
    const [noteFilter, setNoteFilter] = useState('all');
    const [expandedNotes, setExpandedNotes] = useState({});
    const [notesChannel, setNotesChannel] = useState(null);
    const [activeTab, setActiveTab] = useState('schools'); // Default to schools tab
    const [outcomeTab, setOutcomeTab] = useState('tracker');
    const [showModal, setShowModal] = useState(false);
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

    // Colors for charts
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    useEffect(() => {
        if (!user) {
            // If we're not in a proper router context or user is not available, 
            // don't try to navigate programmatically
            return;
        }

        fetchMentorProfile();
    }, [user, navigate]);

    const fetchMentorProfile = async () => {
        try {
            setLoading(true);

            // Set mentorId to auth.uid to satisfy RLS policies
            setMentorId(user.id);

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

            // Get assigned students - use auth.uid for RLS compatibility
            await fetchAssignedStudents(user.id);

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
            setStudents(students);
            setStats(prev => ({ ...prev, totalNotes: students.length }));

            // Fetch note counts for each student - use auth.uid for mentor_id
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

            setStats(prev => ({ ...prev, totalNotes: Object.values(counts).reduce((a, b) => a + b, 0) }));
        } catch (error) {
            console.error('Error fetching student note counts:', error.message);
        }
    };

    const fetchDemographicData = async (students) => {
        try {
            // Process age data using date_of_birth instead of birth_year
            const ageData = students.reduce((acc, student) => {
                if (student.date_of_birth) {
                    const birthDate = new Date(student.date_of_birth);
                    const today = new Date();

                    // Calculate age
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();

                    // Adjust age if birthday hasn't occurred yet this year
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }

                    // Create age ranges for chart (e.g., 13-17, 18-22, etc.)
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
                age: ageData.sort((a, b) => parseInt(a.name.split('-')[0]) - parseInt(b.name.split('-')[0])),
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
                totalNotes: students.length,
                totalMeetings: meetingsData[0]?.count || 0,
                meetingsThisMonth: 0, // This needs to be calculated based on the current month
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
        await fetchStudentOutcomes(student.id);
    };

    const fetchStudentNotes = async (studentId) => {
        try {
            // Clear any existing notes before fetching new ones
            setStudentNotes([]);

            // Ensure we have the user ID before proceeding
            if (!user || !user.id) {
                console.error('User ID not available for fetching notes');
                toast.error('Unable to fetch notes. Please try again later.');
                return;
            }

            console.log(`Fetching notes for student ${studentId} and mentor ${user.id}`);

            // Use a more robust query with proper error handling
            const { data, error } = await supabase
                .from('mentor_notes')
                .select('*')
                .eq('student_id', studentId)
                .eq('mentor_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching student notes:', error);
                throw error;
            }

            console.log(`Fetched ${data?.length || 0} notes for student ${studentId}`);

            // Format date fields for display
            const formattedNotes = data?.map(note => ({
                ...note,
                created_at_formatted: new Date(note.created_at).toLocaleString(),
                start_date_formatted: note.start_date ? new Date(note.start_date).toLocaleDateString() : '',
                deadline_formatted: note.deadline ? new Date(note.deadline).toLocaleDateString() : ''
            })) || [];

            setStudentNotes(formattedNotes);

            // Setup real-time listener for this student's notes
            if (notesChannel) {
                supabase.removeChannel(notesChannel);
            }

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

                        // Update local state directly based on the payload type without re-fetching
                        if (payload.eventType === 'INSERT') {
                            const newNote = {
                                ...payload.new,
                                created_at_formatted: new Date(payload.new.created_at).toLocaleString(),
                                start_date_formatted: payload.new.start_date ? new Date(payload.new.start_date).toLocaleDateString() : '',
                                deadline_formatted: payload.new.deadline ? new Date(payload.new.deadline).toLocaleDateString() : ''
                            };

                            setStudentNotes(prev => [newNote, ...prev]);
                        }
                        else if (payload.eventType === 'UPDATE') {
                            setStudentNotes(prev =>
                                prev.map(note => note.id === payload.new.id ? {
                                    ...payload.new,
                                    created_at_formatted: new Date(payload.new.created_at).toLocaleString(),
                                    start_date_formatted: payload.new.start_date ? new Date(payload.new.start_date).toLocaleDateString() : '',
                                    deadline_formatted: payload.new.deadline ? new Date(payload.new.deadline).toLocaleDateString() : ''
                                } : note)
                            );
                        }
                        else if (payload.eventType === 'DELETE') {
                            setStudentNotes(prev => prev.filter(note => note.id !== payload.old.id));
                        }

                        // As a backup, also refetch notes in case we missed something
                        const { data: refreshedData, error: refreshError } = await supabase
                            .from('mentor_notes')
                            .select('*')
                            .eq('student_id', studentId)
                            .eq('mentor_id', user.id)
                            .order('created_at', { ascending: false });

                        if (!refreshError && refreshedData) {
                            // Format date fields for display
                            const formattedNotes = refreshedData.map(note => ({
                                ...note,
                                created_at_formatted: new Date(note.created_at).toLocaleString(),
                                start_date_formatted: note.start_date ? new Date(note.start_date).toLocaleDateString() : '',
                                deadline_formatted: note.deadline ? new Date(note.deadline).toLocaleDateString() : ''
                            }));

                            setStudentNotes(formattedNotes);
                        } else if (refreshError) {
                            console.error('Error refreshing notes:', refreshError);
                        }
                    }
                )
                .subscribe((status) => {
                    console.log(`Notes subscription status: ${status}`);
                    if (status === 'SUBSCRIBED') {
                        console.log(`Successfully subscribed to notes for student ${studentId}`);
                    }
                });

            setNotesChannel(channel);
        } catch (error) {
            console.error('Error fetching student notes:', error.message);
            toast.error('Failed to load student notes');
        }
    };

    const fetchStudentOutcomes = async (studentId) => {
        try {
            // Clear previous data
            setCollegeAdmissions([]);
            setScholarships([]);
            setEmployments([]);

            // Fetch college admissions
            const { data: admissionsData, error: admissionsError } = await supabase
                .from('college_admissions')
                .select('*')
                .eq('student_id', studentId)
                .order('admission_date', { ascending: false });

            if (admissionsError) {
                console.error('Error fetching college admissions:', admissionsError);
            } else {
                console.log('College admissions fetched:', admissionsData);
                setCollegeAdmissions(admissionsData || []);
            }

            // Fetch scholarships
            const { data: scholarshipsData, error: scholarshipsError } = await supabase
                .from('scholarship_awards')
                .select('*')
                .eq('student_id', studentId)
                .order('award_date', { ascending: false });

            if (scholarshipsError) {
                console.error('Error fetching scholarships:', scholarshipsError);
            } else {
                console.log('Scholarships fetched:', scholarshipsData);
                setScholarships(scholarshipsData || []);
            }

            // Fetch employment
            const { data: employmentData, error: employmentError } = await supabase
                .from('student_employment')
                .select('*')
                .eq('student_id', studentId)
                .order('start_date', { ascending: false });

            if (employmentError) {
                console.error('Error fetching employment data:', employmentError);
            } else {
                console.log('Employment data fetched:', employmentData);
                setEmployments(employmentData || []);
            }
        } catch (error) {
            console.error('Error fetching student outcomes:', error);
            toast.error('Failed to load student outcomes');
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
        try {
            // Validate required fields 
            if (!newNote.description.trim() || !newNote.task.trim() || !newNote.content.trim()) {
                toast.error('Please fill in all required fields');
                return;
            }

            // Ensure we have mentor and student IDs
            if (!user?.id || !selectedStudent?.id) {
                toast.error('Missing mentor or student information');
                console.error('Missing IDs:', {
                    mentorId: user?.id,
                    studentId: selectedStudent?.id
                });
                return;
            }

            setLoading(true);

            // Format data for insertion
            const formattedData = {
                mentor_id: user.id,
                student_id: selectedStudent.id,
                description: newNote.description.trim(),
                task: newNote.task.trim(),
                content: newNote.content.trim(),
                start_date: newNote.start_date ? new Date(newNote.start_date).toISOString() : new Date().toISOString(),
                deadline: newNote.deadline ? new Date(newNote.deadline).toISOString() : null,
                acknowledged: false
            };

            console.log('Adding new note with data:', formattedData);

            // Simple direct insert
            const { data, error } = await supabase
                .from('mentor_notes')
                .insert(formattedData)
                .select();

            if (error) {
                console.error('Error details:', error);
                throw error;
            }

            console.log('Note added successfully:', data);

            // Reset the form
            setNewNote({
                description: '',
                task: '',
                content: '',
                deadline: '',
                start_date: new Date().toISOString().split('T')[0]
            });

            // Update the note counts
            setStats(prev => ({
                ...prev,
                notesMade: prev.notesMade + 1
            }));

            // Refresh notes immediately rather than waiting for subscription
            await fetchStudentNotes(selectedStudent.id);

            toast.success('Note added successfully!');
        } catch (error) {
            console.error('Error adding note:', error);
            toast.error(`Failed to add note: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const scheduleMeeting = async (studentId) => {
        // This would open a modal for scheduling a meeting
        // For now, we'll just show a toast
        toast.info('Meeting scheduling feature coming soon!');
    };

    // Set up a subscription for note acknowledgments to update stats in real-time
    useEffect(() => {
        if (!user?.id) return;

        // Subscribe to changes in the mentor_notes table for this mentor
        const notesStatsChannel = supabase
            .channel('mentor-notes-stats')
            .on('postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'mentor_notes',
                    filter: `mentor_id=eq.${user.id}`
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
                            // Show toast notification
                            toast.success('Note acknowledged by student!', {
                                position: 'bottom-right',
                                duration: 3000
                            });
                        } else {
                            // If acknowledgment was removed
                            setStats(prev => ({
                                ...prev,
                                notesAcknowledged: Math.max(0, prev.notesAcknowledged - 1)
                            }));
                        }
                    } else if (payload.eventType === 'INSERT') {
                        // Immediately increment the total note count
                        setStats(prev => ({
                            ...prev,
                            notesMade: prev.notesMade + 1
                        }));
                    } else if (payload.eventType === 'DELETE') {
                        // Decrement the total note count
                        setStats(prev => ({
                            ...prev,
                            notesMade: Math.max(0, prev.notesMade - 1),
                            // If the deleted note was acknowledged, decrement that too
                            notesAcknowledged: payload.old.acknowledged
                                ? Math.max(0, prev.notesAcknowledged - 1)
                                : prev.notesAcknowledged
                        }));
                    }

                    // For all changes, refresh statistics to ensure accuracy
                    await fetchStatistics(user.id);

                    // Update note counts for the specific student if selected
                    if (selectedStudent && (payload.new?.student_id === selectedStudent.id ||
                        payload.old?.student_id === selectedStudent.id)) {
                        const { count, error } = await supabase
                            .from('mentor_notes')
                            .select('id', { count: 'exact', head: true })
                            .eq('student_id', selectedStudent.id)
                            .eq('mentor_id', user.id);

                        if (!error) {
                            setStats(prev => ({
                                ...prev,
                                notesMade: prev.notesMade + 1
                            }));
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            console.log('Cleaning up mentor notes stats subscription');
            supabase.removeChannel(notesStatsChannel);
        };
    }, [user?.id, selectedStudent]);

    // Clean up subscriptions when component unmounts
    useEffect(() => {
        return () => {
            if (notesChannel) {
                supabase.removeChannel(notesChannel);
            }
        };
    }, [notesChannel]);

    // Add more professional note editor form
    // This needs to be placed in the JSX where the notes section is
    const renderNoteEditorForm = () => {
        return (
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={newNote.start_date}
                                onChange={(e) => setNewNote({ ...newNote, start_date: e.target.value })}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Deadline (Optional)
                            </label>
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
                        ></textarea>
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
    };

    // Handle when an outcome is saved successfully
    const handleOutcomeSuccess = async (data) => {
        // Refresh the outcomes data
        if (selectedStudent?.id) {
            await fetchStudentOutcomes(selectedStudent.id);

            // Also update the profile's outcome markers if this is a college admission or scholarship
            if (outcomeType === 'admission') {
                // Update studentTagging if not already set
                const hasCollegeAdmit = !!selectedStudent.college_admit;
                const hasStemMajor = !!selectedStudent.stem_major;

                const newData = data[0] || {};
                let needsProfileUpdate = false;
                let updateData = {};

                // If this is a STEM admission and stem_major not marked yet
                if (newData.is_stem && !hasStemMajor) {
                    updateData.stem_major = true;
                    needsProfileUpdate = true;
                }

                // If this is the first college admission
                if (!hasCollegeAdmit) {
                    updateData.college_admit = true;
                    needsProfileUpdate = true;
                }

                // Update the student profile if needed
                if (needsProfileUpdate) {
                    try {
                        const { error } = await supabase
                            .from('profiles')
                            .update(updateData)
                            .eq('id', selectedStudent.id);

                        if (error) {
                            console.error('Error updating student outcome flags:', error);
                        } else {
                            // Update local state
                            setSelectedStudent(prev => ({
                                ...prev,
                                ...updateData
                            }));

                            console.log('Student profile updated with outcome flags');
                        }
                    } catch (error) {
                        console.error('Error in profile update:', error);
                    }
                }
            } else if (outcomeType === 'scholarship' && !selectedStudent.scholarship_awarded) {
                // Update scholarship_awarded status if not already set
                try {
                    const { error } = await supabase
                        .from('profiles')
                        .update({ scholarship_awarded: true })
                        .eq('id', selectedStudent.id);

                    if (error) {
                        console.error('Error updating scholarship flag:', error);
                    } else {
                        // Update local state
                        setSelectedStudent(prev => ({
                            ...prev,
                            scholarship_awarded: true
                        }));

                        console.log('Student profile updated with scholarship flag');
                    }
                } catch (error) {
                    console.error('Error in profile update:', error);
                }
            }
        }
    };

    // Toggle note expansion
    const toggleNoteExpansion = (noteId) => {
        setExpandedNotes(prev => ({
            ...prev,
            [noteId]: !prev[noteId]
        }));
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
                        <div className="text-4xl font-bold text-indigo-600 mb-2">{stats.totalNotes}</div>
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
                                onClick={() => setActiveTab('outcomes')}
                                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'outcomes'
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Student Outcomes
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
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Assigned Students List */}
                        <div className="lg:col-span-3 bg-white rounded-xl shadow-md p-6">
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
                                                {stats.notesMade > 0 && (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                                                            {stats.notesMade} notes
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Student Details */}
                        {selectedStudent ? (
                            <>
                                <div className="lg:col-span-5 bg-white rounded-xl shadow-md">
                                    {/* Student profile header */}
                                    <div className="p-6 border-b border-gray-200">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-800 font-bold text-xl">
                                                {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                                                <p className="text-gray-600">{selectedStudent.email}</p>
                                                <p className="text-sm font-medium text-indigo-600">{selectedStudent.student_id ? `Student ID: ${selectedStudent.student_id}` : ''}</p>
                                            </div>
                                            <button
                                                onClick={() => scheduleMeeting(selectedStudent.id)}
                                                className="ml-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                                            >
                                                Schedule Meeting
                                            </button>
                                        </div>

                                        {/* Tabs for student details */}
                                        <div className="flex border-b">
                                            <button
                                                onClick={() => setActiveTab('schools')}
                                                className={`px-4 py-3 text-sm font-medium ${activeTab === 'schools'
                                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                                    : 'text-gray-600 hover:text-gray-900'}`}
                                            >
                                                School Choices
                                            </button>

                                            <button
                                                onClick={() => setActiveTab('notes')}
                                                className={`px-4 py-3 text-sm font-medium ${activeTab === 'notes'
                                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                                    : 'text-gray-600 hover:text-gray-900'}`}
                                            >
                                                Notes & Tasks
                                            </button>

                                            <button
                                                onClick={() => setActiveTab('outcomes')}
                                                className={`px-4 py-3 text-sm font-medium ${activeTab === 'outcomes'
                                                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                                                    : 'text-gray-600 hover:text-gray-900'}`}
                                            >
                                                Outcomes
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content based on active tab */}
                                    <div className="p-4">
                                        {activeTab === 'schools' && (
                                            <div>
                                                <div className="mb-4">
                                                    <h3 className="text-lg font-medium mb-2">School Choices</h3>
                                                    <p className="text-sm text-gray-600 mb-4">
                                                        Review this student's selected schools and provide feedback to help guide their application process.
                                                    </p>
                                                </div>
                                                <StudentSchoolChoicesViewer studentId={selectedStudent.id} forMentor={true} />
                                            </div>
                                        )}

                                        {activeTab === 'notes' && (
                                            <div>
                                                {/* Notes filter and controls */}
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
                                                            onClick={() => setNoteFilter('completed')}
                                                            className={`px-3 py-1 text-xs rounded-full ${noteFilter === 'completed'
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
                                                                student_id: selectedStudent.id,
                                                                content: '',
                                                                is_task: false,
                                                                status: 'pending'
                                                            });
                                                            // Scroll to the note editor form
                                                            document.getElementById('add-note-form')?.scrollIntoView({ behavior: 'smooth' });
                                                        }}
                                                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
                                                    >
                                                        Add Note
                                                    </button>
                                                </div>

                                                {/* Notes list */}
                                                {getFilteredNotes().length === 0 ? (
                                                    <div className="bg-gray-50 rounded-lg p-6 text-center border border-dashed">
                                                        <p className="text-gray-500">No notes yet. Add your first note to this student.</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {getFilteredNotes().map(note => (
                                                            <div
                                                                key={note.id}
                                                                className={`p-4 rounded-lg border ${note.acknowledged
                                                                    ? 'border-l-4 border-l-green-500 border-t border-r border-b border-gray-200'
                                                                    : 'border-l-4 border-l-yellow-500 border-t border-r border-b border-gray-200'
                                                                    }`}
                                                            >
                                                                <div className="flex justify-between">
                                                                    <h4 className="font-semibold text-gray-800">{note.task}</h4>
                                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${note.acknowledged
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-yellow-100 text-yellow-800'
                                                                        }`}>
                                                                        {note.acknowledged ? 'Completed' : 'Pending'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">{note.description}</p>
                                                                <div className={`mt-2 text-sm text-gray-500 whitespace-pre-wrap ${expandedNotes[note.id] ? '' : 'line-clamp-2'}`}>
                                                                    {note.content}
                                                                </div>
                                                                {note.content && note.content.length > 100 && (
                                                                    <button
                                                                        onClick={() => toggleNoteExpansion(note.id)}
                                                                        className="mt-1 text-xs text-indigo-600 hover:text-indigo-800"
                                                                    >
                                                                        {expandedNotes[note.id] ? 'Show less' : 'Show more'}
                                                                    </button>
                                                                )}
                                                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                                    {note.deadline && (
                                                                        <span className="px-2 py-0.5 bg-gray-100 rounded">
                                                                            Deadline: {new Date(note.deadline).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                    <span className="px-2 py-0.5 bg-gray-100 rounded">
                                                                        Created: {new Date(note.created_at).toLocaleDateString()}
                                                                    </span>
                                                                    {note.acknowledged && (
                                                                        <span className="px-2 py-0.5 bg-green-100 rounded">
                                                                            Completed: {new Date(note.updated_at).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Notes Section - Moved to right side */}
                                <div className="lg:col-span-4 bg-white rounded-xl shadow-md p-6 h-fit max-h-[800px] overflow-y-auto">
                                    <div className="flex justify-between items-center sticky top-0 bg-white pt-1 pb-4 z-10">
                                        <h3 className="text-lg font-semibold">Mentorship Notes</h3>
                                        <div className="flex items-center space-x-2">
                                            <select
                                                value={noteFilter}
                                                onChange={(e) => setNoteFilter(e.target.value)}
                                                className="p-1 text-sm border rounded"
                                            >
                                                <option value="all">All Notes</option>
                                                <option value="pending">Pending</option>
                                                <option value="acknowledged">Acknowledged</option>
                                            </select>
                                        </div>
                                    </div>

                                    {studentNotes.length === 0 ? (
                                        <div className="py-8 px-4 text-center bg-gray-50 rounded-lg border border-dashed">
                                            <p className="text-gray-500">No notes available for this student.</p>
                                            <button
                                                onClick={() => document.getElementById('add-note-form').scrollIntoView({ behavior: 'smooth' })}
                                                className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                                            >
                                                Create your first note
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {getFilteredNotes().map(note => (
                                                <div
                                                    key={note.id}
                                                    className={`p-4 rounded-lg border ${note.acknowledged
                                                        ? 'border-l-4 border-l-green-500 border-t border-r border-b border-gray-200'
                                                        : 'border-l-4 border-l-yellow-500 border-t border-r border-b border-gray-200'
                                                        }`}
                                                >
                                                    <div className="flex justify-between">
                                                        <h4 className="font-semibold text-gray-800">{note.task}</h4>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${note.acknowledged
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                            {note.acknowledged ? 'Completed' : 'Pending'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">{note.description}</p>
                                                    <div className={`mt-2 text-sm text-gray-500 whitespace-pre-wrap ${expandedNotes[note.id] ? '' : 'line-clamp-2'}`}>
                                                        {note.content}
                                                    </div>
                                                    {note.content && note.content.length > 100 && (
                                                        <button
                                                            onClick={() => toggleNoteExpansion(note.id)}
                                                            className="mt-1 text-xs text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            {expandedNotes[note.id] ? 'Show less' : 'Show more'}
                                                        </button>
                                                    )}
                                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                        {note.deadline && (
                                                            <span className="px-2 py-0.5 bg-gray-100 rounded">
                                                                Deadline: {new Date(note.deadline).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                        <span className="px-2 py-0.5 bg-gray-100 rounded">
                                                            Created: {new Date(note.created_at).toLocaleDateString()}
                                                        </span>
                                                        {note.acknowledged && (
                                                            <span className="px-2 py-0.5 bg-green-100 rounded">
                                                                Completed: {new Date(note.updated_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="lg:col-span-9 bg-white rounded-xl shadow-md p-8 flex flex-col items-center justify-center min-h-[300px]">
                                <div className="text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <h3 className="text-xl font-medium text-gray-800 mb-2">Select a Student</h3>
                                    <p className="text-gray-500 max-w-md">
                                        Choose a student from the list to view their details, create notes, and schedule meetings.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : activeTab === 'outcomes' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Assigned Students List (same as in notes tab) */}
                        <div className="bg-white rounded-xl shadow-md p-6">
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
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Student Outcomes Dashboard */}
                        <div className="lg:col-span-2">
                            {selectedStudent ? (
                                <div className="bg-white rounded-xl shadow-md">
                                    {/* Student profile header */}
                                    <div className="p-6 border-b border-gray-200">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-800 font-bold text-xl">
                                                {selectedStudent.first_name[0]}{selectedStudent.last_name[0]}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                                                <p className="text-gray-600">{selectedStudent.email}</p>
                                                <p className="text-sm font-medium text-indigo-600">{selectedStudent.student_id ? `Student ID: ${selectedStudent.student_id}` : ''}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Outcomes Summary Dashboard */}
                                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                        <h3 className="text-lg font-semibold mb-3">Outcomes Summary</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-medium text-gray-800">College Admission</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {collegeAdmissions.length > 0
                                                                ? `${collegeAdmissions.length} admission(s) recorded`
                                                                : 'No admissions recorded'}
                                                        </p>
                                                    </div>
                                                    <div className={`rounded-full w-3 h-3 ${collegeAdmissions.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-medium text-gray-800">Scholarships</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {scholarships.length > 0
                                                                ? `${scholarships.length} scholarship(s) awarded`
                                                                : 'No scholarships recorded'}
                                                        </p>
                                                    </div>
                                                    <div className={`rounded-full w-3 h-3 ${scholarships.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h4 className="font-medium text-gray-800">Employment</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {employments.length > 0
                                                                ? `${employments.length} position(s) recorded`
                                                                : 'No employment recorded'}
                                                        </p>
                                                    </div>
                                                    <div className={`rounded-full w-3 h-3 ${employments.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* OutcomeTagging component for quick profile flags */}
                                        <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
                                            <h4 className="font-medium text-gray-800 mb-3">Quick Outcome Flags</h4>
                                            <OutcomeTagging
                                                student={selectedStudent}
                                                onUpdate={(outcomes) => {
                                                    // Update the local state to reflect changes
                                                    setSelectedStudent(prev => ({
                                                        ...prev,
                                                        college_admit: outcomes.college_admit,
                                                        scholarship_awarded: outcomes.scholarship_awarded,
                                                        stem_major: outcomes.stem_major
                                                    }));
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Outcomes tabs */}
                                    <div className="border-b border-gray-200">
                                        <nav className="flex justify-between -mb-px px-6 py-2">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => setOutcomeType('admission')}
                                                    className={`py-2 px-4 text-center border-b-2 font-medium text-sm transition ${outcomeType === 'admission' || !outcomeType
                                                        ? 'border-indigo-500 text-indigo-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                        }`}
                                                >
                                                    College Admissions
                                                </button>
                                                <button
                                                    onClick={() => setOutcomeType('scholarship')}
                                                    className={`py-2 px-4 text-center border-b-2 font-medium text-sm transition ${outcomeType === 'scholarship'
                                                        ? 'border-indigo-500 text-indigo-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                        }`}
                                                >
                                                    Scholarships
                                                </button>
                                                <button
                                                    onClick={() => setOutcomeType('employment')}
                                                    className={`py-2 px-4 text-center border-b-2 font-medium text-sm transition ${outcomeType === 'employment'
                                                        ? 'border-indigo-500 text-indigo-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                        }`}
                                                >
                                                    Employment
                                                </button>
                                                <button
                                                    onClick={() => setOutcomeType('schools')}
                                                    className={`py-2 px-4 text-center border-b-2 font-medium text-sm transition ${outcomeType === 'schools'
                                                        ? 'border-indigo-500 text-indigo-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                        }`}
                                                >
                                                    School Choices
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setEditingOutcome(null);
                                                    setOutcomeModalOpen(true);
                                                }}
                                                className={`px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded hover:bg-indigo-700 transition flex items-center ${outcomeType === 'schools' ? 'invisible' : ''}`}
                                            >
                                                <span className="mr-1">+</span> Add New
                                            </button>
                                        </nav>
                                    </div>

                                    {/* Outcomes content */}
                                    <div className="p-6">
                                        {(!outcomeType || outcomeType === 'admission') && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4">College Admissions</h3>

                                                {collegeAdmissions.length === 0 ? (
                                                    <div className="py-8 px-4 text-center bg-gray-50 rounded-lg border border-dashed">
                                                        <p className="text-gray-500">No college admissions recorded yet.</p>
                                                        <button
                                                            onClick={() => {
                                                                setOutcomeType('admission');
                                                                setEditingOutcome(null);
                                                                setOutcomeModalOpen(true);
                                                            }}
                                                            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            Add college admission
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {collegeAdmissions.map(admission => (
                                                            <div key={admission.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <h4 className="font-semibold text-gray-800">{admission.college_name}</h4>
                                                                        <p className="text-sm text-gray-600">
                                                                            {admission.major ? `Major: ${admission.major}` : 'Major not specified'}
                                                                            {admission.is_stem && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">STEM</span>}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                                                                            {new Date(admission.admission_date).toLocaleDateString()}
                                                                        </span>
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            {admission.city && admission.country ? `${admission.city}, ${admission.country}` :
                                                                                admission.city || admission.country || 'Location not specified'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {admission.notes && (
                                                                    <div className="mt-2 text-sm text-gray-600 border-t pt-2">
                                                                        {admission.notes}
                                                                    </div>
                                                                )}
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
                                        )}

                                        {outcomeType === 'scholarship' && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4">Scholarships</h3>

                                                {scholarships.length === 0 ? (
                                                    <div className="py-8 px-4 text-center bg-gray-50 rounded-lg border border-dashed">
                                                        <p className="text-gray-500">No scholarships recorded yet.</p>
                                                        <button
                                                            onClick={() => {
                                                                setEditingOutcome(null);
                                                                setOutcomeModalOpen(true);
                                                            }}
                                                            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            Add scholarship
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {scholarships.map(scholarship => (
                                                            <div key={scholarship.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <h4 className="font-semibold text-gray-800">{scholarship.scholarship_name}</h4>
                                                                        <p className="text-sm text-gray-600">
                                                                            {scholarship.provider && `Provider: ${scholarship.provider}`}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-sm font-semibold">
                                                                            {scholarship.amount ? `${scholarship.amount} ${scholarship.currency}` : 'Amount not specified'}
                                                                        </span>
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            Awarded: {new Date(scholarship.award_date).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {(scholarship.duration || scholarship.renewable || scholarship.requirements) && (
                                                                    <div className="mt-2 text-sm text-gray-600">
                                                                        {scholarship.duration && <span>Duration: {scholarship.duration}</span>}
                                                                        {scholarship.renewable && <span className="ml-2">Renewable</span>}
                                                                        {scholarship.requirements && <p className="mt-1">Requirements: {scholarship.requirements}</p>}
                                                                    </div>
                                                                )}
                                                                {scholarship.notes && (
                                                                    <div className="mt-2 text-sm text-gray-600 border-t pt-2">
                                                                        {scholarship.notes}
                                                                    </div>
                                                                )}
                                                                <div className="mt-3 flex justify-end">
                                                                    <button
                                                                        onClick={() => {
                                                                            setOutcomeType('scholarship');
                                                                            setEditingOutcome(scholarship);
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
                                        )}

                                        {outcomeType === 'employment' && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4">Employment & Internships</h3>

                                                {employments.length === 0 ? (
                                                    <div className="py-8 px-4 text-center bg-gray-50 rounded-lg border border-dashed">
                                                        <p className="text-gray-500">No employment records yet.</p>
                                                        <button
                                                            onClick={() => {
                                                                setEditingOutcome(null);
                                                                setOutcomeModalOpen(true);
                                                            }}
                                                            className="mt-2 text-sm text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            Add employment record
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {employments.map(job => (
                                                            <div key={job.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div>
                                                                        <h4 className="font-semibold text-gray-800">{job.position}</h4>
                                                                        <p className="text-sm text-gray-600">
                                                                            {job.company_name}
                                                                            {job.employment_type && (
                                                                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                                                    {job.employment_type.replace('_', ' ')}
                                                                                </span>
                                                                            )}
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        {job.salary && (
                                                                            <span className="text-sm font-semibold">
                                                                                {job.salary} {job.currency}
                                                                            </span>
                                                                        )}
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            {job.start_date ? new Date(job.start_date).toLocaleDateString() : 'Start date not specified'}
                                                                            {job.is_current
                                                                                ? ' - Present'
                                                                                : job.end_date ? ` - ${new Date(job.end_date).toLocaleDateString()}` : ''}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                {job.notes && (
                                                                    <div className="mt-2 text-sm text-gray-600 border-t pt-2">
                                                                        {job.notes}
                                                                    </div>
                                                                )}
                                                                <div className="mt-3 flex justify-end">
                                                                    <button
                                                                        onClick={() => {
                                                                            setOutcomeType('employment');
                                                                            setEditingOutcome(job);
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
                                        )}

                                        {outcomeType === 'schools' && (
                                            <div>
                                                <h3 className="text-lg font-semibold mb-4">Student School Choices</h3>
                                                <p className="text-sm text-gray-600 mb-6">
                                                    Review {selectedStudent.first_name}'s target, safety, and stretch school selections.
                                                </p>

                                                <StudentSchoolChoicesViewer studentId={selectedStudent.id} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-xl shadow-md p-10 flex flex-col items-center justify-center text-center">
                                    <div className="text-7xl mb-4">👈</div>
                                    <h3 className="text-xl font-medium mb-2">Select a Student</h3>
                                    <p className="text-gray-500">
                                        Choose a student from the list to view and track their outcomes.
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
                                                <Tooltip
                                                    formatter={(value, name) => [`${value} students`, 'Count']}
                                                    labelFormatter={(label) => `Age Range: ${label}`}
                                                />
                                                <Bar
                                                    dataKey="value"
                                                    name="Students"
                                                    fill="#8884d8"
                                                    radius={[4, 4, 0, 0]}
                                                >
                                                    {demographicData.age.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
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

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-gray-800">Total Notes</h4>
                                            <p className="text-3xl font-bold text-indigo-600">{stats.notesMade}</p>
                                        </div>
                                        <div className="bg-indigo-100 p-2 rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">Total notes created for all students</p>
                                </div>

                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-gray-800">Acknowledged</h4>
                                            <p className="text-3xl font-bold text-green-600">{stats.notesAcknowledged}</p>
                                        </div>
                                        <div className="bg-green-100 p-2 rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">Notes acknowledged by students</p>
                                </div>

                                <div className="bg-white p-4 rounded-lg shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-gray-800">Pending</h4>
                                            <p className="text-3xl font-bold text-yellow-600">{Math.max(0, stats.notesMade - stats.notesAcknowledged)}</p>
                                        </div>
                                        <div className="bg-yellow-100 p-2 rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">Notes waiting for acknowledgment</p>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-medium text-gray-800">Completion Rate</h4>
                                    <div className="text-sm font-medium text-indigo-600">
                                        {stats.notesMade > 0
                                            ? `${Math.round((stats.notesAcknowledged / stats.notesMade) * 100)}%`
                                            : '0%'
                                        }
                                    </div>
                                </div>

                                <div className="w-full bg-gray-200 rounded-full h-4">
                                    <div
                                        className="bg-indigo-600 h-4 rounded-full transition-all duration-500 ease-in-out"
                                        style={{
                                            width: stats.notesMade > 0
                                                ? `${(stats.notesAcknowledged / stats.notesMade) * 100}%`
                                                : '0%'
                                        }}
                                    ></div>
                                </div>
                            </div>

                            <div className="h-64 mt-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={[
                                            { name: 'Total Notes', value: stats.notesMade },
                                            { name: 'Acknowledged', value: stats.notesAcknowledged },
                                            { name: 'Pending', value: Math.max(0, stats.notesMade - stats.notesAcknowledged) }
                                        ]}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar
                                            dataKey="value"
                                            name="Notes"
                                            fill="#82ca9d"
                                            radius={[4, 4, 0, 0]}
                                        >
                                            {[
                                                { name: 'Total Notes', fill: '#6366f1' },
                                                { name: 'Acknowledged', fill: '#10b981' },
                                                { name: 'Pending', fill: '#f59e0b' }
                                            ].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Outcome Modal for adding/editing outcomes */}
            <OutcomeModal
                isOpen={outcomeModalOpen}
                onClose={() => {
                    setOutcomeModalOpen(false);
                    // Don't reset outcome type when closing to maintain tab selection
                }}
                student={selectedStudent}
                mentorId={user?.id}
                outcomeType={outcomeType}
                initialData={editingOutcome}
                onSuccess={handleOutcomeSuccess}
            />
        </div>
    );
};

export default MentorDashboard; 