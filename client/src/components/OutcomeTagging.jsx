import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

const OutcomeTagging = ({ student, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [outcomes, setOutcomes] = useState({
        college_admit: student?.college_admit || false,
        scholarship_awarded: student?.scholarship_awarded || false,
        stem_major: student?.stem_major || false
    });

    const handleToggle = (field) => {
        setOutcomes(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const saveOutcomes = async () => {
        if (!student?.id) {
            toast.error('Student ID is required');
            return;
        }

        try {
            setLoading(true);

            const { error } = await supabase
                .from('profiles')
                .update({
                    college_admit: outcomes.college_admit,
                    scholarship_awarded: outcomes.scholarship_awarded,
                    stem_major: outcomes.stem_major
                })
                .eq('id', student.id);

            if (error) throw error;

            toast.success('Student outcomes updated successfully');
            if (onUpdate) onUpdate(outcomes);
        } catch (error) {
            console.error('Error updating student outcomes:', error);
            toast.error(error.message || 'Failed to update student outcomes');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Student Outcomes</h3>
                <div className="text-sm text-gray-500">
                    Last updated: {new Date(student?.updated_at || Date.now()).toLocaleDateString()}
                </div>
            </div>

            <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div>
                        <span className="font-medium">College Admission</span>
                        <p className="text-xs text-gray-500">Student received college admission</p>
                    </div>
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={() => handleToggle('college_admit')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${outcomes.college_admit ? 'bg-indigo-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${outcomes.college_admit ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div>
                        <span className="font-medium">Scholarship Awarded</span>
                        <p className="text-xs text-gray-500">Student received scholarship</p>
                    </div>
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={() => handleToggle('scholarship_awarded')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${outcomes.scholarship_awarded ? 'bg-indigo-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${outcomes.scholarship_awarded ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <div>
                        <span className="font-medium">STEM Major</span>
                        <p className="text-xs text-gray-500">Student pursuing STEM major</p>
                    </div>
                    <div className="flex items-center">
                        <button
                            type="button"
                            onClick={() => handleToggle('stem_major')}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${outcomes.stem_major ? 'bg-indigo-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${outcomes.stem_major ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={saveOutcomes}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default OutcomeTagging; 