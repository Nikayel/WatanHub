import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';
import {
    User, BookOpen, GraduationCap, Globe,
    MessageCircle, Calendar, X, ArrowRight,
    ArrowLeft, CheckCircle, Save
} from 'lucide-react';

const ProfileTutorial = () => {
    const { user, profile, isProfileComplete, isAdmin, isMentor, isStudent } = useAuth();
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasShownTutorial, setHasShownTutorial] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        education_level: '',
        english_level: '',
        toefl_score: '',
        interests: '',
        date_of_birth: '',
        place_of_birth: '',
        place_of_residence: '',
        bio: '',
        gender: '',
        religion: '',
        is_assigned: false,
        student_id: null
    });

    useEffect(() => {
        // Check if this is a new signup (higher priority)
        const isNewSignup = localStorage.getItem('newSignup') === 'true';

        // Only show tutorial if:
        // 1. User is logged in
        // 2. User is a student (not admin or mentor)
        // 3. Profile is incomplete OR this is a new signup
        // 4. Tutorial hasn't been shown yet in this session
        if (user && profile && isStudent && !isAdmin && !isMentor &&
            (!isProfileComplete || isNewSignup) && !hasShownTutorial) {

            // Clear the newSignup flag once used
            if (isNewSignup) {
                localStorage.removeItem('newSignup');
            }

            // Pre-fill with any existing data
            setFormData({
                first_name: profile.first_name || '',
                last_name: profile.last_name || '',
                email: profile.email || user.email || '',
                education_level: profile.education_level || '',
                english_level: profile.english_level || '',
                toefl_score: profile.toefl_score || '',
                interests: profile.interests || '',
                date_of_birth: profile.date_of_birth || '',
                place_of_birth: profile.place_of_birth || '',
                place_of_residence: profile.place_of_residence || '',
                bio: profile.bio || '',
                gender: profile.gender || '',
                religion: profile.religion || '',
                is_assigned: profile.is_assigned || false,
                student_id: profile.student_id || null
            });

            // Show the tutorial
            setOpen(true);
            setHasShownTutorial(true); // Prevent showing multiple times in a session
        }
    }, [user, profile, isProfileComplete, isAdmin, isMentor, isStudent, hasShownTutorial]);

    // Close handler - optionally with confirmation for incomplete profiles
    const handleClose = () => {
        // If they're trying to close with incomplete info, show confirmation
        const requiredFields = ['education_level', 'english_level', 'interests'];
        const hasAllRequired = requiredFields.every(field =>
            formData[field] && formData[field].toString().trim() !== ''
        );

        if (!hasAllRequired) {
            if (window.confirm('Your profile is still incomplete. Are you sure you want to close? You can complete it later from your profile page.')) {
                setOpen(false);
            }
        } else {
            setOpen(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Format the data properly for database insertion
            const formattedData = {
                // Ensure user ID is included
                id: user.id,
                // Format all data fields properly to match database columns
                first_name: formData.first_name?.trim(),
                last_name: formData.last_name?.trim(),
                email: formData.email || user.email,
                education_level: formData.education_level,
                english_level: formData.english_level,
                toefl_score: formData.toefl_score ? parseInt(formData.toefl_score, 10) || null : null,
                interests: formData.interests?.trim(),
                date_of_birth: formData.date_of_birth || null,
                place_of_birth: formData.place_of_birth?.trim() || null,
                place_of_residence: formData.place_of_residence?.trim() || null,
                bio: formData.bio?.trim(),
                gender: formData.gender,
                religion: formData.religion?.trim(),
                is_assigned: formData.is_assigned || false,
                student_id: formData.student_id
            };

            console.log("Saving profile data:", formattedData);

            // Update the profiles table directly
            const { error } = await supabase
                .from('profiles')
                .upsert(formattedData, {
                    onConflict: 'id',
                    returning: 'minimal'
                });

            if (error) {
                console.error("Full error details:", error);
                throw error;
            }

            toast.success('Profile updated successfully!');

            // Wait a moment before refreshing to ensure the toast is seen
            setTimeout(() => {
                // Force a page refresh to update the auth context with the new profile data
                window.location.reload();
            }, 1000);

            setOpen(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            // Show more specific error message if available
            const errorMessage = error.message || 'Failed to update profile';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg flex items-start space-x-3">
                            <User className="text-primary mt-1" size={20} />
                            <div>
                                <h3 className="font-medium mb-1">Complete Your Basic Information</h3>
                                <p className="text-sm text-gray-600">Help us get to know you better with these basic details.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Your first name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Your last name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Gender</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">Select...</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="non-binary">Non-binary</option>
                                    <option value="prefer-not-to-say">Prefer not to say</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Place of Birth</label>
                                <input
                                    type="text"
                                    name="place_of_birth"
                                    value={formData.place_of_birth}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Your place of birth"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Place of Residence</label>
                                <input
                                    type="text"
                                    name="place_of_residence"
                                    value={formData.place_of_residence}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Your current location"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium mb-1">Religion (optional)</label>
                                <input
                                    type="text"
                                    name="religion"
                                    value={formData.religion}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Your religion (if you wish to share)"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg flex items-start space-x-3">
                            <GraduationCap className="text-primary mt-1" size={20} />
                            <div>
                                <h3 className="font-medium mb-1">Educational Background</h3>
                                <p className="text-sm text-gray-600">Share your educational experience to help us match you with relevant content.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Education Level</label>
                                <select
                                    name="education_level"
                                    value={formData.education_level}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">Select...</option>
                                    <option value="high_school">High School</option>
                                    <option value="bachelors">Bachelor's Degree</option>
                                    <option value="masters">Master's Degree</option>
                                    <option value="phd">PhD</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">English Proficiency</label>
                                <select
                                    name="english_level"
                                    value={formData.english_level}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">Select...</option>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                    <option value="native">Native Speaker</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">TOEFL Score (if applicable)</label>
                                <input
                                    type="number"
                                    name="toefl_score"
                                    value={formData.toefl_score}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="e.g. 90"
                                    min="0"
                                    max="120"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-4">
                        <div className="bg-primary/5 p-4 rounded-lg flex items-start space-x-3">
                            <BookOpen className="text-primary mt-1" size={20} />
                            <div>
                                <h3 className="font-medium mb-1">Interests & Goals</h3>
                                <p className="text-sm text-gray-600">Tell us about your interests so we can connect you with relevant opportunities.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Areas of Interest</label>
                                <textarea
                                    name="interests"
                                    value={formData.interests}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md h-24"
                                    placeholder="What subjects or areas are you most interested in? (e.g. Computer Science, Literature, Medicine)"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">About Me</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md h-24"
                                    placeholder="Share a bit about yourself, your background, and your educational goals..."
                                ></textarea>
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-lg flex items-start space-x-3">
                            <CheckCircle className="text-green-500 mt-1" size={20} />
                            <div>
                                <h3 className="font-medium mb-1">Complete Your Profile!</h3>
                                <p className="text-sm text-gray-600">You're all set! Review your information below and click "Save Profile" to finish.</p>
                            </div>
                        </div>

                        <div className="border rounded-lg divide-y">
                            <div className="p-3 flex">
                                <span className="font-medium w-1/3">Name:</span>
                                <span>{formData.first_name} {formData.last_name}</span>
                            </div>
                            {formData.date_of_birth && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">Date of Birth:</span>
                                    <span>{formData.date_of_birth}</span>
                                </div>
                            )}
                            {formData.gender && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">Gender:</span>
                                    <span>{formData.gender}</span>
                                </div>
                            )}
                            {formData.place_of_birth && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">Place of Birth:</span>
                                    <span>{formData.place_of_birth}</span>
                                </div>
                            )}
                            {formData.place_of_residence && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">Place of Residence:</span>
                                    <span>{formData.place_of_residence}</span>
                                </div>
                            )}
                            {formData.education_level && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">Education:</span>
                                    <span>{formData.education_level.replace('_', ' ')}</span>
                                </div>
                            )}
                            {formData.english_level && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">English Level:</span>
                                    <span>{formData.english_level}</span>
                                </div>
                            )}
                            {formData.toefl_score && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">TOEFL Score:</span>
                                    <span>{formData.toefl_score}</span>
                                </div>
                            )}
                            {formData.interests && (
                                <div className="p-3 flex">
                                    <span className="font-medium w-1/3">Interests:</span>
                                    <span>{formData.interests}</span>
                                </div>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold flex items-center">
                        Complete Your Profile
                        <span className="ml-auto text-sm font-normal text-gray-500">
                            Step {step} of 4
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4">
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                        <div
                            className="bg-primary h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${step * 25}%` }}
                        ></div>
                    </div>

                    {renderStep()}
                </div>

                <DialogFooter className="flex justify-between mt-6 gap-2">
                    {step > 1 && (
                        <Button
                            variant="outline"
                            onClick={prevStep}
                            className="flex items-center"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    )}

                    <div className="flex-grow"></div>

                    {step < 4 ? (
                        <Button
                            onClick={nextStep}
                            className="flex items-center"
                        >
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center"
                        >
                            {loading ? 'Saving...' : 'Save Profile'} <Save className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProfileTutorial; 