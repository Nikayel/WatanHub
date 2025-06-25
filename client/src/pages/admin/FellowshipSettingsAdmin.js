import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import {
    GraduationCap,
    Save,
    Plus,
    Trash2,
    Calendar,
    Users,
    Star,
    AlertCircle,
    RefreshCw
} from 'lucide-react';

const FellowshipSettingsAdmin = () => {
    const [settings, setSettings] = useState({
        start_date: '',
        description: '',
        program_highlights: [],
        who_can_apply: [],
        application_deadline: '',
        application_status: 'locked',
        application_link: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [debugInfo, setDebugInfo] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            console.log('Fetching fellowship settings...');

            // First, let's check if the table exists
            const { data: tableCheck, error: tableError } = await supabase
                .from('fellowship_settings')
                .select('count')
                .limit(1);

            console.log('Table check result:', { data: tableCheck, error: tableError });

            const { data, error } = await supabase
                .from('fellowship_settings')
                .select('*')
                .limit(1)
                .single();

            console.log('Fellowship settings fetch result:', { data, error });

            if (error) {
                console.log('Fellowship settings error details:', error);
                setDebugInfo({
                    error: error.message,
                    code: error.code,
                    details: error.details
                });

                if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
                    toast.error('Fellowship settings table not found. Please run the SQL migration first.');
                } else {
                    toast.info('Fellowship settings table found but no data. Using defaults.');
                }

                // Use default values when table doesn't exist or no data
                setSettings({
                    start_date: 'January 2025',
                    description: 'Our comprehensive fellowship program is designed to empower Afghan students with the skills, knowledge, and connections needed to succeed in their academic and professional journeys.',
                    program_highlights: ['Personalized mentorship', 'College application guidance', 'Professional development', 'Cultural preservation activities', 'Networking opportunities', 'Scholarship support'],
                    who_can_apply: ['Afghan students worldwide', 'Committed to academic excellence', 'Passionate about community impact', 'Ready for transformation', 'Age 16-25', 'Strong English proficiency'],
                    application_deadline: 'Applications are currently closed. Please check back soon or fill out our waitlist form.',
                    application_status: 'locked',
                    application_link: ''
                });
                return;
            }

            if (data) {
                console.log('Processing fellowship data:', data);
                // Ensure we have default values if arrays are empty
                const processedData = {
                    ...data,
                    program_highlights: (data.program_highlights && data.program_highlights.length > 0)
                        ? data.program_highlights
                        : ['Personalized mentorship', 'College application guidance', 'Professional development', 'Cultural preservation activities', 'Networking opportunities', 'Scholarship support'],
                    who_can_apply: (data.who_can_apply && data.who_can_apply.length > 0)
                        ? data.who_can_apply
                        : ['Afghan students worldwide', 'Committed to academic excellence', 'Passionate about community impact', 'Ready for transformation', 'Age 16-25', 'Strong English proficiency'],
                    application_status: data.application_status || 'locked',
                    application_link: data.application_link || '',
                    application_deadline: data.application_deadline || 'Applications are currently closed. Please check back soon or fill out our waitlist form.'
                };
                setSettings(processedData);
                setDebugInfo({ success: true, dataId: data.id });
                toast.success('Fellowship settings loaded successfully');
            } else {
                // Default fallback values
                setSettings({
                    start_date: 'January 2025',
                    description: 'Our comprehensive fellowship program is designed to empower Afghan students with the skills, knowledge, and connections needed to succeed in their academic and professional journeys.',
                    program_highlights: ['Personalized mentorship', 'College application guidance', 'Professional development', 'Cultural preservation activities', 'Networking opportunities', 'Scholarship support'],
                    who_can_apply: ['Afghan students worldwide', 'Committed to academic excellence', 'Passionate about community impact', 'Ready for transformation', 'Age 16-25', 'Strong English proficiency'],
                    application_deadline: 'Applications are currently closed. Please check back soon or fill out our waitlist form.',
                    application_status: 'locked',
                    application_link: ''
                });
                setDebugInfo({ noData: true });
                toast.info('No fellowship settings found, using defaults');
            }
        } catch (error) {
            console.error('Error accessing fellowship settings:', error);
            setDebugInfo({
                catchError: error.message,
                stack: error.stack
            });
            toast.error('Database connection error. Please check Supabase connection.');

            // Use fallback values
            setSettings({
                start_date: 'January 2025',
                description: 'Our comprehensive fellowship program is designed to empower Afghan students with the skills, knowledge, and connections needed to succeed in their academic and professional journeys.',
                program_highlights: ['Personalized mentorship', 'College application guidance', 'Professional development', 'Cultural preservation activities', 'Networking opportunities', 'Scholarship support'],
                who_can_apply: ['Afghan students worldwide', 'Committed to academic excellence', 'Passionate about community impact', 'Ready for transformation', 'Age 16-25', 'Strong English proficiency'],
                application_deadline: 'Applications are currently closed. Please check back soon or fill out our waitlist form.',
                application_status: 'locked',
                application_link: ''
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const settingsToSave = {
                start_date: settings.start_date,
                description: settings.description,
                program_highlights: settings.program_highlights,
                who_can_apply: settings.who_can_apply,
                application_deadline: settings.application_deadline || 'Applications are currently closed. Please check back soon or fill out our waitlist form.',
                application_status: settings.application_status || 'locked',
                application_link: settings.application_link || '',
                updated_at: new Date().toISOString()
            };

            console.log('Saving fellowship settings:', settingsToSave);

            // Try to check if any row exists first
            const { data: existingData, error: checkError } = await supabase
                .from('fellowship_settings')
                .select('id')
                .limit(1)
                .maybeSingle();

            console.log('Existing data check:', { data: existingData, error: checkError });

            if (checkError) {
                console.error('Check error:', checkError);
                // Table might not exist, show helpful message
                toast.error('Please run the SQL migration first. Check README_FELLOWSHIP_MIGRATION.md for instructions.');
                return;
            }

            if (existingData) {
                console.log('Updating existing record with ID:', existingData.id);
                // Update existing record
                const { error: updateError } = await supabase
                    .from('fellowship_settings')
                    .update(settingsToSave)
                    .eq('id', existingData.id);

                if (updateError) {
                    console.error('Update error:', updateError);
                    throw updateError;
                }
                toast.success('Fellowship settings updated successfully!');
            } else {
                console.log('Inserting new record');
                // Insert new record
                const { error: insertError } = await supabase
                    .from('fellowship_settings')
                    .insert(settingsToSave);

                if (insertError) {
                    console.error('Insert error:', insertError);
                    throw insertError;
                }
                toast.success('Fellowship settings created successfully!');
            }

            // Refresh the data
            await fetchSettings();

        } catch (error) {
            console.error('Error saving fellowship settings:', error);

            if (error.message.includes('relation "fellowship_settings" does not exist')) {
                toast.error('Database table not ready. Please run the SQL migration from README_FELLOWSHIP_MIGRATION.md');
            } else if (error.code === 'PGRST301') {
                toast.error('Permission denied. Make sure you are logged in as an admin.');
            } else {
                toast.error(`Failed to save: ${error.message}`);
            }
        } finally {
            setSaving(false);
        }
    };

    const addHighlight = () => {
        setSettings(prev => ({
            ...prev,
            program_highlights: [...prev.program_highlights, '']
        }));
    };

    const updateHighlight = (index, value) => {
        setSettings(prev => ({
            ...prev,
            program_highlights: prev.program_highlights.map((item, i) =>
                i === index ? value : item
            )
        }));
    };

    const removeHighlight = (index) => {
        setSettings(prev => ({
            ...prev,
            program_highlights: prev.program_highlights.filter((_, i) => i !== index)
        }));
    };

    const addRequirement = () => {
        setSettings(prev => ({
            ...prev,
            who_can_apply: [...prev.who_can_apply, '']
        }));
    };

    const updateRequirement = (index, value) => {
        setSettings(prev => ({
            ...prev,
            who_can_apply: prev.who_can_apply.map((item, i) =>
                i === index ? value : item
            )
        }));
    };

    const removeRequirement = (index) => {
        setSettings(prev => ({
            ...prev,
            who_can_apply: prev.who_can_apply.filter((_, i) => i !== index)
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Migration Banner */}
                {(!settings.hasOwnProperty('application_status') || !settings.hasOwnProperty('application_link')) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <AlertCircle className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium text-amber-800">Database Update Required</h3>
                                <p className="text-sm text-amber-700 mt-1">
                                    Your fellowship settings table needs new columns. Please run this SQL in your Supabase dashboard:
                                    <br />
                                    <code className="bg-amber-100 px-2 py-1 rounded text-xs mt-2 block">
                                        ALTER TABLE fellowship_settings ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'locked';<br />
                                        ALTER TABLE fellowship_settings ADD COLUMN IF NOT EXISTS application_link TEXT DEFAULT '';
                                    </code>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Debug Information Panel */}
                {debugInfo && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-yellow-800">Debug Information</h3>
                            <button
                                onClick={() => setDebugInfo(null)}
                                className="text-yellow-600 hover:text-yellow-800"
                            >
                                ×
                            </button>
                        </div>
                        <pre className="text-xs text-yellow-700 mt-2 whitespace-pre-wrap">
                            {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-blue-600 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <GraduationCap className="h-8 w-8 text-white mr-3" />
                                <h1 className="text-2xl font-bold text-white">Fellowship Program Settings</h1>
                            </div>
                            <button
                                onClick={fetchSettings}
                                disabled={loading}
                                className="flex items-center px-3 py-2 bg-white/20 text-white rounded-md hover:bg-white/30 transition-colors"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                        <p className="text-blue-100 mt-2">
                            Manage fellowship program details, requirements, and highlights
                        </p>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* Basic Information */}
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                                <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                                Basic Information
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Date
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.start_date}
                                        onChange={(e) => setSettings(prev => ({ ...prev, start_date: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., January 2025"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Application Deadline
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.application_deadline}
                                        onChange={(e) => setSettings(prev => ({ ...prev, application_deadline: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g., Applications open soon"
                                    />
                                </div>
                            </div>

                            {/* Application Management */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Application Status
                                    </label>
                                    <select
                                        value={settings.application_status}
                                        onChange={(e) => setSettings(prev => ({ ...prev, application_status: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="locked">🔒 Locked (Not Open Yet)</option>
                                        <option value="unlocked">🔓 Unlocked (Open for Applications)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {settings.application_status === 'locked' ?
                                            'Applications are not open yet. Users will see "Applications opening soon".' :
                                            'Applications are open. Users will see the apply button.'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Application Link (Google Form)
                                    </label>
                                    <input
                                        type="url"
                                        value={settings.application_link}
                                        onChange={(e) => setSettings(prev => ({ ...prev, application_link: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://forms.google.com/..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Paste your Google Forms URL here. Only shown when status is unlocked.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Program Description
                                </label>
                                <textarea
                                    value={settings.description}
                                    onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Describe the fellowship program..."
                                />
                            </div>
                        </div>

                        {/* Program Highlights */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                                    <Star className="h-6 w-6 text-blue-600 mr-2" />
                                    Program Highlights
                                </h2>
                                <button
                                    onClick={addHighlight}
                                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Highlight
                                </button>
                            </div>

                            <div className="space-y-3">
                                {settings.program_highlights.map((highlight, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="text"
                                            value={highlight}
                                            onChange={(e) => updateHighlight(index, e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter program highlight..."
                                        />
                                        <button
                                            onClick={() => removeHighlight(index)}
                                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Who Can Apply */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                                    <Users className="h-6 w-6 text-blue-600 mr-2" />
                                    Who Can Apply
                                </h2>
                                <button
                                    onClick={addRequirement}
                                    className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Requirement
                                </button>
                            </div>

                            <div className="space-y-3">
                                {settings.who_can_apply.map((requirement, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="text"
                                            value={requirement}
                                            onChange={(e) => updateRequirement(index, e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter application requirement..."
                                        />
                                        <button
                                            onClick={() => removeRequirement(index)}
                                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Warning */}
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                            <div className="flex">
                                <AlertCircle className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-medium text-amber-800">
                                        Important Note
                                    </h3>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Changes will be reflected immediately on the website. Please review carefully before saving.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-6 border-t border-gray-200">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Settings
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default FellowshipSettingsAdmin; 