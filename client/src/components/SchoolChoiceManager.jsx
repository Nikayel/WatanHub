import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { toast } from 'sonner';
import { PlusCircle, Trash2, School, GraduationCap, BadgeInfo, AlertCircle, Building } from 'lucide-react';

const PREFERENCE_TYPES = {
    target: {
        name: 'Target Schools',
        description: 'Schools that match your academic profile',
        limit: 5,
        color: 'bg-green-100 text-green-800 border-green-200',
        iconColor: 'text-green-600',
        buttonColor: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    },
    safety: {
        name: 'Safety Schools',
        description: 'Schools where you have a high chance of acceptance',
        limit: 5,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        iconColor: 'text-blue-600',
        buttonColor: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
    stretch: {
        name: 'Stretch School',
        description: 'Dream school that may be challenging to get into',
        limit: 1,
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        iconColor: 'text-purple-600',
        buttonColor: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
    }
};

const APPLICATION_STATUSES = [
    { value: 'planning', label: 'Planning to Apply', color: 'bg-gray-100 text-gray-800' },
    { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
    { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'waitlisted', label: 'Waitlisted', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'deferred', label: 'Deferred', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'enrolled', label: 'Enrolled', color: 'bg-emerald-100 text-emerald-800' }
];

const SchoolChoiceManager = ({ studentId, readOnly = false }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [schoolChoices, setSchoolChoices] = useState([]);
    const [activeType, setActiveType] = useState('target');
    const [isAdding, setIsAdding] = useState(false);
    const [newSchool, setNewSchool] = useState({
        school_name: '',
        major_name: '',
        preference_type: 'target',
        notes: '',
        application_status: 'planning'
    });
    const [counts, setCounts] = useState({
        target: 0,
        safety: 0,
        stretch: 0
    });

    // Use the provided studentId or the current user's id
    const effectiveStudentId = studentId || user?.id;

    const fetchSchoolChoices = useCallback(async () => {
        if (!effectiveStudentId) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('student_school_choices')
                .select('*')
                .eq('student_id', effectiveStudentId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setSchoolChoices(data || []);

            // Calculate counts
            const newCounts = {
                target: 0,
                safety: 0,
                stretch: 0
            };

            data?.forEach(choice => {
                if (choice.preference_type in newCounts) {
                    newCounts[choice.preference_type]++;
                }
            });

            setCounts(newCounts);
        } catch (error) {
            console.error('Error fetching school choices:', error);
            toast.error('Failed to load school choices');
        } finally {
            setLoading(false);
        }
    }, [effectiveStudentId]);

    useEffect(() => {
        fetchSchoolChoices();
    }, [fetchSchoolChoices]);

    const handleAddSchool = async () => {
        if (!effectiveStudentId) {
            toast.error('User ID not available');
            return;
        }

        // Validate input
        if (!newSchool.school_name.trim() || !newSchool.major_name.trim()) {
            toast.error('School name and major are required');
            return;
        }

        // Check limits
        if (counts[newSchool.preference_type] >= PREFERENCE_TYPES[newSchool.preference_type].limit) {
            toast.error(`You can only have ${PREFERENCE_TYPES[newSchool.preference_type].limit} ${PREFERENCE_TYPES[newSchool.preference_type].name}`);
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('student_school_choices')
                .insert({
                    student_id: effectiveStudentId,
                    school_name: newSchool.school_name.trim(),
                    major_name: newSchool.major_name.trim(),
                    preference_type: newSchool.preference_type,
                    notes: newSchool.notes.trim(),
                    application_status: newSchool.application_status
                })
                .select();

            if (error) throw error;

            toast.success('School added successfully!');

            // Update local state
            setSchoolChoices(prev => [data[0], ...prev]);
            setCounts(prev => ({
                ...prev,
                [newSchool.preference_type]: prev[newSchool.preference_type] + 1
            }));

            // Reset form
            setNewSchool({
                school_name: '',
                major_name: '',
                preference_type: activeType,
                notes: '',
                application_status: 'planning'
            });
            setIsAdding(false);
        } catch (error) {
            console.error('Error adding school:', error);
            toast.error('Failed to add school');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSchool = async (id, preferenceType) => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p>Are you sure you want to delete this school?</p>
                <div className="flex gap-2 justify-end">
                    <button
                        className="px-2 py-1 bg-gray-200 rounded text-sm"
                        onClick={() => {
                            if (t && t.id) {
                                toast.dismiss(t.id);
                            } else {
                                toast.dismiss();
                            }
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                        onClick={async () => {
                            if (t && t.id) {
                                toast.dismiss(t.id);
                            } else {
                                toast.dismiss();
                            }

                            setLoading(true);
                            try {
                                const { error } = await supabase
                                    .from('student_school_choices')
                                    .delete()
                                    .eq('id', id);

                                if (error) throw error;

                                toast.success('School deleted successfully!');
                                setSchoolChoices(prev => prev.filter(choice => choice.id !== id));
                                setCounts(prev => ({
                                    ...prev,
                                    [preferenceType]: prev[preferenceType] - 1
                                }));
                            } catch (error) {
                                console.error('Error deleting school:', error);
                                toast.error('Failed to delete school');
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), {
            duration: 5000,
        });
    };

    const updateApplicationStatus = async (id, status) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('student_school_choices')
                .update({
                    application_status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setSchoolChoices(prev =>
                prev.map(choice =>
                    choice.id === id
                        ? { ...choice, application_status: status, updated_at: new Date().toISOString() }
                        : choice
                )
            );

            toast.success('Status updated successfully!');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredChoices = () => {
        return schoolChoices.filter(choice => choice.preference_type === activeType);
    };

    const getStatusBadge = (status) => {
        const statusObj = APPLICATION_STATUSES.find(s => s.value === status) || APPLICATION_STATUSES[0];
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusObj.color}`}>
                {statusObj.label}
            </span>
        );
    };

    if (loading && schoolChoices.length === 0) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="school-choice-manager w-full">
            {/* Type selector tabs */}
            <div className="flex border-b mb-4 overflow-x-auto hide-scrollbar py-1">
                {Object.entries(PREFERENCE_TYPES).map(([type, info]) => (
                    <button
                        key={type}
                        onClick={() => {
                            setActiveType(type);
                            setNewSchool(prev => ({ ...prev, preference_type: type }));
                        }}
                        className={`py-2 px-3 sm:px-4 flex items-center whitespace-nowrap font-medium text-xs sm:text-sm ${activeType === type
                            ? `border-b-2 border-${type === 'target' ? 'green' : type === 'safety' ? 'blue' : 'purple'}-500 text-${type === 'target' ? 'green' : type === 'safety' ? 'blue' : 'purple'}-600`
                            : 'text-gray-600 hover:text-gray-900'
                            } mr-2`}
                    >
                        <span className={info.iconColor}>
                            {type === 'target' ? <Building size={14} className="inline mr-1" /> :
                                type === 'safety' ? <School size={14} className="inline mr-1" /> :
                                    <GraduationCap size={14} className="inline mr-1" />}
                        </span>
                        {info.name}
                        <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${info.color}`}>
                            {counts[type]}/{info.limit}
                        </span>
                    </button>
                ))}
            </div>

            {/* Description of current type */}
            <div className={`p-3 mb-4 rounded-lg ${PREFERENCE_TYPES[activeType].color} border flex items-start`}>
                <BadgeInfo size={16} className={`mr-2 ${PREFERENCE_TYPES[activeType].iconColor} mt-0.5 flex-shrink-0`} />
                <div>
                    <p className="text-sm">{PREFERENCE_TYPES[activeType].description}</p>
                    <p className="text-xs mt-1">
                        You can add up to {PREFERENCE_TYPES[activeType].limit} {activeType === 'stretch' ? 'stretch school' : `${activeType} schools`}.
                    </p>
                </div>
            </div>

            {/* Add new school form */}
            {!readOnly && (
                <>
                    {isAdding ? (
                        <div className="bg-white border rounded-lg p-3 sm:p-4 mb-4 shadow-sm">
                            <div className="text-base sm:text-lg font-semibold mb-3 flex items-center">
                                <School size={16} className={PREFERENCE_TYPES[activeType].iconColor + " mr-1.5"} />
                                Add New {PREFERENCE_TYPES[activeType].name.slice(0, -1)}
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            School Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newSchool.school_name}
                                            onChange={(e) => setNewSchool({ ...newSchool, school_name: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="e.g. Harvard University"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Major <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newSchool.major_name}
                                            onChange={(e) => setNewSchool({ ...newSchool, major_name: e.target.value })}
                                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="e.g. Computer Science"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Application Status
                                    </label>
                                    <select
                                        value={newSchool.application_status}
                                        onChange={(e) => setNewSchool({ ...newSchool, application_status: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {APPLICATION_STATUSES.map(status => (
                                            <option key={status.value} value={status.value}>{status.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={newSchool.notes}
                                        onChange={(e) => setNewSchool({ ...newSchool, notes: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Add any notes about why you're interested in this school or program..."
                                        rows="3"
                                    ></textarea>
                                </div>

                                <div className="flex justify-end space-x-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAdding(false)}
                                        className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddSchool}
                                        disabled={loading || !newSchool.school_name || !newSchool.major_name}
                                        className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium text-white ${PREFERENCE_TYPES[activeType].buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {loading ? 'Adding...' : 'Add School'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        counts[activeType] < PREFERENCE_TYPES[activeType].limit && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className={`w-full mb-4 p-3 border border-dashed rounded-lg flex items-center justify-center text-xs sm:text-sm font-medium ${PREFERENCE_TYPES[activeType].color} hover:bg-opacity-80 transition`}
                            >
                                <PlusCircle size={14} className="mr-1.5" />
                                Add {activeType === 'stretch' ? 'a' : ''} {PREFERENCE_TYPES[activeType].name.slice(0, -1)}
                            </button>
                        )
                    )}
                </>
            )}

            {/* School list */}
            {getFilteredChoices().length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 sm:p-6 text-center border border-dashed">
                    <School size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">No {PREFERENCE_TYPES[activeType].name.toLowerCase()} added yet</p>
                    {!readOnly && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Click the button above to add {activeType === 'stretch' ? 'a' : ''} {PREFERENCE_TYPES[activeType].name.toLowerCase()}
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {getFilteredChoices().map(school => (
                        <div
                            key={school.id}
                            className={`border rounded-lg p-3 sm:p-4 bg-white shadow-sm hover:shadow-md transition relative ${school.application_status === 'accepted' || school.application_status === 'enrolled' ? 'border-green-300' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-6">
                                    <div className="flex items-center flex-wrap mb-1 gap-1">
                                        <h3 className="font-semibold text-base sm:text-lg">{school.school_name}</h3>
                                        {(school.application_status === 'accepted' || school.application_status === 'enrolled') && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {school.application_status === 'enrolled' ? '✓ Enrolled' : '✓ Accepted'}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-600 text-xs sm:text-sm">{school.major_name}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                        {getStatusBadge(school.application_status)}
                                        <span className="text-xs text-gray-500">
                                            Updated: {new Date(school.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    {school.notes && (
                                        <div className="mt-3 text-xs sm:text-sm bg-gray-50 p-2 sm:p-3 rounded-md">
                                            <div className="font-medium text-gray-700 mb-1">Notes:</div>
                                            <p className="text-gray-600">{school.notes}</p>
                                        </div>
                                    )}
                                </div>
                                {!readOnly && (
                                    <button
                                        onClick={() => handleDeleteSchool(school.id, school.preference_type)}
                                        className="text-red-500 hover:text-red-700 transition p-1 rounded-full hover:bg-red-50 absolute top-3 right-3"
                                        title="Delete school"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Status update dropdown */}
                            {!readOnly && (
                                <div className="mt-3 pt-3 border-t">
                                    <div className="flex items-center justify-end">
                                        <div className="text-xs sm:text-sm text-gray-700 mr-2">Status:</div>
                                        <select
                                            value={school.application_status}
                                            onChange={(e) => updateApplicationStatus(school.id, e.target.value)}
                                            className="p-1 text-xs sm:text-sm border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 max-w-[150px]"
                                        >
                                            {APPLICATION_STATUSES.map(status => (
                                                <option key={status.value} value={status.value}>{status.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Help text */}
            <div className="mt-6 bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <div className="flex items-start text-gray-600 text-xs sm:text-sm">
                    <AlertCircle size={14} className="mr-1.5 flex-shrink-0 mt-0.5 text-gray-500" />
                    <div>
                        <p>Add your preferred schools to help your mentor guide your application process. You can categorize schools as:</p>
                        <ul className="list-disc pl-4 mt-2 space-y-1">
                            <li><span className="font-medium text-green-700">Target Schools:</span> Schools where your profile aligns with their typical admitted students.</li>
                            <li><span className="font-medium text-blue-700">Safety Schools:</span> Schools where your chances of admission are high.</li>
                            <li><span className="font-medium text-purple-700">Stretch School:</span> A dream school that might be more competitive for your profile.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Replace the JSX style tag with a proper style element */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />
        </div>
    );
};

export default SchoolChoiceManager; 