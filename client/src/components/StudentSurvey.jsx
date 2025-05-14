import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { toast } from 'sonner';

// Income range options
const INCOME_RANGES = [
    'Less than $10,000',
    '$10,000 - $30,000',
    '$30,000 - $50,000',
    '$50,000 - $70,000',
    '$70,000 - $100,000',
    'More than $100,000',
    'Prefer not to say'
];

// School types
const SCHOOL_TYPES = [
    'Public School',
    'Private School',
    'Charter School',
    'Home School',
    'Religious School',
    'Online School',
    'Other'
];

// Parental education levels
const EDUCATION_LEVELS = [
    'Less than high school',
    'High school graduate',
    'Some college',
    'Associate degree',
    'Bachelor\'s degree',
    'Master\'s degree',
    'Doctoral degree',
    'Professional degree',
    'Unknown'
];

// Internet speed options
const INTERNET_SPEEDS = [
    'No regular access',
    'Dial-up/Very slow',
    'Basic broadband',
    'High-speed',
    'Very high-speed fiber',
    'Unsure'
];

// List of provinces
const PROVINCES = [
    'Badakhshan', 'Badghis', 'Baghlan', 'Balkh', 'Bamyan',
    'Daykundi', 'Farah', 'Faryab', 'Ghazni', 'Ghor',
    'Helmand', 'Herat', 'Jowzjan', 'Kabul', 'Kandahar',
    'Kapisa', 'Khost', 'Kunar', 'Kunduz', 'Laghman',
    'Logar', 'Nangarhar', 'Nimruz', 'Nuristan', 'Paktia',
    'Paktika', 'Panjshir', 'Parwan', 'Samangan', 'Sar-e Pol',
    'Takhar', 'Uruzgan', 'Wardak', 'Zabul'
];

const StudentSurvey = ({ onComplete }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        province: '',
        school_type: '',
        household_income_band: '',
        parental_education: '',
        internet_speed: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('You must be logged in to submit this form');
            return;
        }

        try {
            setLoading(true);

            // Update the student record
            const { error } = await supabase
                .from('profiles')
                .update({
                    province: formData.province,
                    school_type: formData.school_type,
                    household_income_band: formData.household_income_band,
                    parental_education: formData.parental_education,
                    internet_speed: formData.internet_speed
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Survey completed successfully!');
            if (onComplete) onComplete();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Failed to save survey data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Student Background Survey</h2>
            <p className="text-gray-600 mb-6">
                This information helps us better understand your background and provide more targeted support.
                Your responses will remain confidential and will only be used to improve our programs.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Province */}
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Province
                    </label>
                    <select
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    >
                        <option value="">Select your province</option>
                        {PROVINCES.map(province => (
                            <option key={province} value={province}>{province}</option>
                        ))}
                    </select>
                </div>

                {/* School Type */}
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        School Type
                    </label>
                    <select
                        name="school_type"
                        value={formData.school_type}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    >
                        <option value="">Select your school type</option>
                        {SCHOOL_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* Household Income */}
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Household Income Range
                    </label>
                    <select
                        name="household_income_band"
                        value={formData.household_income_band}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    >
                        <option value="">Select your household income range</option>
                        {INCOME_RANGES.map(range => (
                            <option key={range} value={range}>{range}</option>
                        ))}
                    </select>
                </div>

                {/* Parental Education */}
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Highest Level of Parental Education
                    </label>
                    <select
                        name="parental_education"
                        value={formData.parental_education}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    >
                        <option value="">Select education level</option>
                        {EDUCATION_LEVELS.map(level => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </select>
                </div>

                {/* Internet Speed */}
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Internet Access Quality
                    </label>
                    <select
                        name="internet_speed"
                        value={formData.internet_speed}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                    >
                        <option value="">Select your internet access quality</option>
                        {INTERNET_SPEEDS.map(speed => (
                            <option key={speed} value={speed}>{speed}</option>
                        ))}
                    </select>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Saving...' : 'Submit Survey'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StudentSurvey; 