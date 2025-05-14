import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { X } from 'lucide-react';

const OutcomeModal = ({
    isOpen,
    onClose,
    student,
    mentorId,
    outcomeType,
    initialData,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);

    // Admission form state
    const [admissionForm, setAdmissionForm] = useState({
        college_name: '',
        major: '',
        application_date: '',
        admission_date: '',
        admission_type: 'regular',
        is_stem: false,
        city: '',
        country: '',
        college_rank: '',
        notes: ''
    });

    // Scholarship form state
    const [scholarshipForm, setScholarshipForm] = useState({
        scholarship_name: '',
        provider: '',
        amount: '',
        currency: 'USD',
        award_date: '',
        duration: '',
        renewable: false,
        requirements: '',
        notes: ''
    });

    // Employment form state
    const [employmentForm, setEmploymentForm] = useState({
        company_name: '',
        position: '',
        employment_type: 'internship',
        start_date: '',
        end_date: '',
        is_current: true,
        industry: '',
        salary: '',
        currency: 'USD',
        location: '',
        notes: ''
    });

    // Initialize forms from initialData when editing
    useEffect(() => {
        if (initialData) {
            if (outcomeType === 'admission') {
                setAdmissionForm({
                    college_name: initialData.college_name || '',
                    major: initialData.major || '',
                    application_date: initialData.application_date ? new Date(initialData.application_date).toISOString().split('T')[0] : '',
                    admission_date: initialData.admission_date ? new Date(initialData.admission_date).toISOString().split('T')[0] : '',
                    admission_type: initialData.admission_type || 'regular',
                    is_stem: initialData.is_stem || false,
                    city: initialData.city || '',
                    country: initialData.country || '',
                    college_rank: initialData.college_rank || '',
                    notes: initialData.notes || ''
                });
            } else if (outcomeType === 'scholarship') {
                setScholarshipForm({
                    scholarship_name: initialData.scholarship_name || '',
                    provider: initialData.provider || '',
                    amount: initialData.amount || '',
                    currency: initialData.currency || 'USD',
                    award_date: initialData.award_date ? new Date(initialData.award_date).toISOString().split('T')[0] : '',
                    duration: initialData.duration || '',
                    renewable: initialData.renewable || false,
                    requirements: initialData.requirements || '',
                    notes: initialData.notes || ''
                });
            } else if (outcomeType === 'employment') {
                setEmploymentForm({
                    company_name: initialData.company_name || '',
                    position: initialData.position || '',
                    employment_type: initialData.employment_type || 'internship',
                    start_date: initialData.start_date ? new Date(initialData.start_date).toISOString().split('T')[0] : '',
                    end_date: initialData.end_date ? new Date(initialData.end_date).toISOString().split('T')[0] : '',
                    is_current: initialData.is_current !== undefined ? initialData.is_current : true,
                    industry: initialData.industry || '',
                    salary: initialData.salary || '',
                    currency: initialData.currency || 'USD',
                    location: initialData.location || '',
                    notes: initialData.notes || ''
                });
            }
        } else {
            // Reset forms when adding new
            resetForms();
        }
    }, [initialData, outcomeType]);

    const resetForms = () => {
        setAdmissionForm({
            college_name: '',
            major: '',
            application_date: '',
            admission_date: '',
            admission_type: 'regular',
            is_stem: false,
            city: '',
            country: '',
            college_rank: '',
            notes: ''
        });

        setScholarshipForm({
            scholarship_name: '',
            provider: '',
            amount: '',
            currency: 'USD',
            award_date: '',
            duration: '',
            renewable: false,
            requirements: '',
            notes: ''
        });

        setEmploymentForm({
            company_name: '',
            position: '',
            employment_type: 'internship',
            start_date: '',
            end_date: '',
            is_current: true,
            industry: '',
            salary: '',
            currency: 'USD',
            location: '',
            notes: ''
        });
    };

    const handleAdmissionChange = (e) => {
        const { name, value, type, checked } = e.target;
        setAdmissionForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleScholarshipChange = (e) => {
        const { name, value, type, checked } = e.target;
        setScholarshipForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEmploymentChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEmploymentForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const saveOutcome = async () => {
        if (!student?.id || !mentorId) {
            toast.error('Missing student or mentor information');
            return;
        }

        try {
            setLoading(true);
            let data, error, tableName, formData;

            // Prepare the data based on outcome type
            if (outcomeType === 'admission') {
                tableName = 'college_admissions';
                formData = {
                    ...admissionForm,
                    student_id: student.id,
                    mentor_id: mentorId,
                    college_rank: admissionForm.college_rank ? parseInt(admissionForm.college_rank) : null
                };
            } else if (outcomeType === 'scholarship') {
                tableName = 'scholarship_awards';
                formData = {
                    ...scholarshipForm,
                    student_id: student.id,
                    mentor_id: mentorId,
                    amount: scholarshipForm.amount ? parseFloat(scholarshipForm.amount) : null
                };
            } else if (outcomeType === 'employment') {
                tableName = 'student_employment';
                formData = {
                    ...employmentForm,
                    student_id: student.id,
                    mentor_id: mentorId,
                    salary: employmentForm.salary ? parseFloat(employmentForm.salary) : null,
                    // If current job, clear end date
                    end_date: employmentForm.is_current ? null : employmentForm.end_date
                };
            } else {
                throw new Error('Invalid outcome type');
            }

            console.log(`Saving ${outcomeType} data to ${tableName}:`, formData);

            // Insert or update based on whether we're editing
            if (initialData?.id) {
                console.log(`Updating record ID ${initialData.id}`);
                const { data: updatedData, error: updateError } = await supabase
                    .from(tableName)
                    .update(formData)
                    .eq('id', initialData.id)
                    .select();

                data = updatedData;
                error = updateError;

                if (error) {
                    console.error(`Error updating ${outcomeType}:`, error);
                    throw error;
                }

                console.log(`Successfully updated ${outcomeType}:`, data);
                toast.success('Successfully updated record');
            } else {
                console.log(`Inserting new ${outcomeType} record`);
                const { data: insertedData, error: insertError } = await supabase
                    .from(tableName)
                    .insert(formData)
                    .select();

                data = insertedData;
                error = insertError;

                if (error) {
                    console.error(`Error inserting ${outcomeType}:`, error);
                    throw error;
                }

                console.log(`Successfully added new ${outcomeType}:`, data);
                toast.success('Successfully added new record');
            }

            // Call onSuccess with the updated/new data
            if (onSuccess && data) {
                onSuccess(data);
            }

            // Close the modal
            onClose();

            // Reset the forms
            resetForms();

        } catch (error) {
            const errorMessage = error?.message || error?.details || 'An unknown error occurred';
            console.error('Error saving outcome:', error);
            toast.error(`Failed to save: ${errorMessage}`);

            // Log more detailed database error if available
            if (error?.code) {
                console.error(`Database error code: ${error.code}, hint: ${error?.hint || 'No hint'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Render the appropriate form based on outcome type
    const renderForm = () => {
        if (outcomeType === 'admission') {
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                College/University Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="college_name"
                                value={admissionForm.college_name}
                                onChange={handleAdmissionChange}
                                required
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Major/Program
                            </label>
                            <input
                                type="text"
                                name="major"
                                value={admissionForm.major}
                                onChange={handleAdmissionChange}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Application Date
                            </label>
                            <input
                                type="date"
                                name="application_date"
                                value={admissionForm.application_date}
                                onChange={handleAdmissionChange}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Admission Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="admission_date"
                                value={admissionForm.admission_date}
                                onChange={handleAdmissionChange}
                                required
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Admission Type
                            </label>
                            <select
                                name="admission_type"
                                value={admissionForm.admission_type}
                                onChange={handleAdmissionChange}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="regular">Regular Decision</option>
                                <option value="early_decision">Early Decision</option>
                                <option value="early_action">Early Action</option>
                                <option value="rolling">Rolling Admission</option>
                                <option value="transfer">Transfer</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="flex items-center justify-start h-full pt-6">
                            <input
                                type="checkbox"
                                id="is_stem"
                                name="is_stem"
                                checked={admissionForm.is_stem}
                                onChange={handleAdmissionChange}
                                className="h-4 w-4 text-indigo-600 rounded"
                            />
                            <label htmlFor="is_stem" className="ml-2 text-sm text-gray-700">
                                STEM Program/Major
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                City
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={admissionForm.city}
                                onChange={handleAdmissionChange}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Country
                            </label>
                            <input
                                type="text"
                                name="country"
                                value={admissionForm.country}
                                onChange={handleAdmissionChange}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                College Rank
                            </label>
                            <input
                                type="number"
                                name="college_rank"
                                value={admissionForm.college_rank}
                                onChange={handleAdmissionChange}
                                min="1"
                                placeholder="e.g., 25"
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={admissionForm.notes}
                            onChange={handleAdmissionChange}
                            rows="3"
                            className="w-full p-2 border rounded-md"
                        ></textarea>
                    </div>
                </div>
            );
        } else if (outcomeType === 'scholarship') {
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Scholarship Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="scholarship_name"
                                value={scholarshipForm.scholarship_name}
                                onChange={handleScholarshipChange}
                                required
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Provider/Organization
                            </label>
                            <input
                                type="text"
                                name="provider"
                                value={scholarshipForm.provider}
                                onChange={handleScholarshipChange}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount
                            </label>
                            <input
                                type="number"
                                name="amount"
                                value={scholarshipForm.amount}
                                onChange={handleScholarshipChange}
                                step="0.01"
                                min="0"
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Currency
                            </label>
                            <select
                                name="currency"
                                value={scholarshipForm.currency}
                                onChange={handleScholarshipChange}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="AFN">AFN - Afghan Afghani</option>
                                <option value="CAD">CAD - Canadian Dollar</option>
                                <option value="AUD">AUD - Australian Dollar</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Award Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                name="award_date"
                                value={scholarshipForm.award_date}
                                onChange={handleScholarshipChange}
                                required
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration
                            </label>
                            <input
                                type="text"
                                name="duration"
                                value={scholarshipForm.duration}
                                onChange={handleScholarshipChange}
                                placeholder="e.g., 4 years, one semester"
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div className="flex items-center justify-start h-full pt-6">
                            <input
                                type="checkbox"
                                id="renewable"
                                name="renewable"
                                checked={scholarshipForm.renewable}
                                onChange={handleScholarshipChange}
                                className="h-4 w-4 text-indigo-600 rounded"
                            />
                            <label htmlFor="renewable" className="ml-2 text-sm text-gray-700">
                                Renewable
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Requirements
                        </label>
                        <input
                            type="text"
                            name="requirements"
                            value={scholarshipForm.requirements}
                            onChange={handleScholarshipChange}
                            placeholder="e.g., Maintain 3.5 GPA"
                            className="w-full p-2 border rounded-md"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={scholarshipForm.notes}
                            onChange={handleScholarshipChange}
                            rows="3"
                            className="w-full p-2 border rounded-md"
                        ></textarea>
                    </div>
                </div>
            );
        } else if (outcomeType === 'employment') {
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Position/Title <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="position"
                                value={employmentForm.position}
                                onChange={handleEmploymentChange}
                                required
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Company/Organization <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="company_name"
                                value={employmentForm.company_name}
                                onChange={handleEmploymentChange}
                                required
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Employment Type
                            </label>
                            <select
                                name="employment_type"
                                value={employmentForm.employment_type}
                                onChange={handleEmploymentChange}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="internship">Internship</option>
                                <option value="part_time">Part-time</option>
                                <option value="full_time">Full-time</option>
                                <option value="contract">Contract</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Industry
                            </label>
                            <input
                                type="text"
                                name="industry"
                                value={employmentForm.industry}
                                onChange={handleEmploymentChange}
                                className="w-full p-2 border rounded-md"
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
                                name="start_date"
                                value={employmentForm.start_date}
                                onChange={handleEmploymentChange}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <div className="mb-2">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_current"
                                        name="is_current"
                                        checked={employmentForm.is_current}
                                        onChange={handleEmploymentChange}
                                        className="h-4 w-4 text-indigo-600 rounded"
                                    />
                                    <label htmlFor="is_current" className="ml-2 text-sm text-gray-700">
                                        Current Position
                                    </label>
                                </div>
                            </div>
                            {!employmentForm.is_current && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={employmentForm.end_date}
                                        onChange={handleEmploymentChange}
                                        className="w-full p-2 border rounded-md"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Salary/Stipend
                            </label>
                            <input
                                type="number"
                                name="salary"
                                value={employmentForm.salary}
                                onChange={handleEmploymentChange}
                                step="0.01"
                                min="0"
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Currency
                            </label>
                            <select
                                name="currency"
                                value={employmentForm.currency}
                                onChange={handleEmploymentChange}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="AFN">AFN - Afghan Afghani</option>
                                <option value="CAD">CAD - Canadian Dollar</option>
                                <option value="AUD">AUD - Australian Dollar</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={employmentForm.location}
                                onChange={handleEmploymentChange}
                                className="w-full p-2 border rounded-md"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={employmentForm.notes}
                            onChange={handleEmploymentChange}
                            rows="3"
                            className="w-full p-2 border rounded-md"
                        ></textarea>
                    </div>
                </div>
            );
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                ></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="flex items-center justify-between bg-gray-50 px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {initialData ? 'Edit' : 'Add'} {outcomeType === 'admission' ? 'College Admission' :
                                outcomeType === 'scholarship' ? 'Scholarship' : 'Employment'}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="px-6 py-5 bg-white">
                        {renderForm()}
                    </div>

                    <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={saveOutcome}
                            disabled={loading ||
                                (outcomeType === 'admission' && !admissionForm.college_name) ||
                                (outcomeType === 'scholarship' && !scholarshipForm.scholarship_name) ||
                                (outcomeType === 'employment' && (!employmentForm.company_name || !employmentForm.position))
                            }
                            className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OutcomeModal; 