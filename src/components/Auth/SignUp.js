import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../ui/dialog';
//April14 - disabled RLS 
import { BookOpen, Bookmark, Globe, Home, Mail, Lock, User, Award, Calendar, FileText, Coffee } from 'lucide-react';

const SignUp = ({ isOpen, onClose }) => {
  const initialBasicData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  const initialAdditionalData = {
    educationLevel: '',
    placeOfBirth: '',
    placeOfResidence: '',
    englishLevel: '',
    toeflScore: '',
    interests: '',
    dateOfBirth: '',
    bio: ''
  };

  const [basicData, setBasicData] = useState(initialBasicData);
  const [additionalData, setAdditionalData] = useState(initialAdditionalData);
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setBasicData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdditionalChange = (e) => {
    const { name, value } = e.target;
    setAdditionalData(prev => ({ ...prev, [name]: value }));
  };

  const validateBasicStep = () => {
    if (!basicData.firstName.trim()) return "First name is required";
    if (!basicData.lastName.trim()) return "Last name is required";
    if (!basicData.email.match(/^\S+@\S+\.\S+$/)) return "Valid email is required";
    if (basicData.password.length < 6) return "Password must be at least 6 characters";
    if (basicData.password !== basicData.confirmPassword) return "Passwords do not match";
    return null;
  };

  const goToNextStep = () => {
    const errorMsg = validateBasicStep();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    setError(null);
    setStep(2);
  };

  const goToPrevStep = () => {
    setStep(1);
    setError(null);
  };

  const saveUserProfile = async (userId) => {
    let profileData;
    try {
        profileData = {
        user_id: userId,
        first_name: basicData.firstName.trim(),
        last_name: basicData.lastName.trim(),
        email: basicData.email.toLowerCase().trim(),
        education_level: additionalData.educationLevel || null,
        place_of_birth: additionalData.placeOfBirth.trim() || null,
        place_of_residence: additionalData.placeOfResidence.trim() || null,
        english_level: additionalData.englishLevel || null,
        toefl_score: additionalData.toeflScore ? parseInt(additionalData.toeflScore, 10) : null,
        interests: additionalData.interests.trim() || null,
        date_of_birth: additionalData.dateOfBirth || null,
        bio: additionalData.bio.trim() || null,
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Profile save error:", {
        message: error.message,
        details: error.details,
        code: error.code,
        profileData
      });
      throw new Error("Failed to save profile: " + error.message);
    }
    
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create auth user
      const { data: authData, error: authError } = await signUp(
        basicData.email, 
      basicData.password,
      basicData.firstName, 
      basicData.lastName  
      );
      //

      if (authError || !authData?.user) {
        throw authError || new Error("User creation failed");
      }

      // Create user profile
      await saveUserProfile(authData.user.id);

      // Close dialog
      onClose?.();
      
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ProgressIndicator = () => (
    <div className="flex items-center justify-center mb-4">
      <div className={`w-3 h-3 rounded-full ${step === 1 ? 'bg-primary' : 'bg-gray-300'}`}></div>
      <div className={`h-0.5 w-8 ${step === 1 ? 'bg-gray-300' : 'bg-primary'}`}></div>
      <div className={`w-3 h-3 rounded-full ${step === 2 ? 'bg-primary' : 'bg-gray-300'}`}></div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md md:max-w-2xl lg:max-w-4xl p-0 bg-white rounded-lg shadow-xl overflow-hidden outline-none mx-auto my-auto w-[95%]">
        <div className="flex flex-col md:flex-row h-auto max-h-[90vh] overflow-hidden">
          {/* Left Side - Illustration / Info */}
          <div className="hidden md:block w-full md:w-2/5 bg-gradient-to-br from-blue-50 to-blue-100 p-6">
            <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
              <div className="p-4 bg-white rounded-full shadow-md">
                {step === 1 ? (
                  <User size={36} className="text-primary" />
                ) : (
                  <Award size={36} className="text-primary" />
                )}
              </div>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-primary">
                  {step === 1 ? 'Join Our Community' : 'Complete Your Profile'}
                </DialogTitle>
                <p className="text-center text-sm text-gray-600">
                  {step === 1
                    ? 'Create an account to start your journey and connect with peers.'
                    : 'Provide additional details to personalize your experience.'}
                </p>
              </DialogHeader>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="flex flex-col items-center p-2">
                  <div className="p-2 bg-white rounded-full shadow-sm mb-2">
                    <BookOpen size={18} className="text-primary" />
                  </div>
                  <span className="text-xs text-gray-600">Education</span>
                </div>
                <div className="flex flex-col items-center p-2">
                  <div className="p-2 bg-white rounded-full shadow-sm mb-2">
                    <Globe size={18} className="text-primary" />
                  </div>
                  <span className="text-xs text-gray-600">Global</span>
                </div>
                <div className="flex flex-col items-center p-2">
                  <div className="p-2 bg-white rounded-full shadow-sm mb-2">
                    <Bookmark size={18} className="text-primary" />
                  </div>
                  <span className="text-xs text-gray-600">Learning</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Form Content */}
          <div className="w-full md:w-3/5 p-5 overflow-y-auto" style={{ maxHeight: '90vh' }}>
            <DialogClose asChild>
              <Button variant="ghost" className="absolute top-2 right-2 h-8 w-8 rounded-full p-0" aria-label="Close">
                <span className="text-lg">&times;</span>
              </Button>
            </DialogClose>
            <div className="px-5 py-4">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-center">
                  {step === 1 ? 'Create Account' : 'Additional Information'}
                </DialogTitle>
                <p className="text-center text-sm text-gray-600">
                  {step === 1
                    ? 'Enter your details to create your account.'
                    : 'Fill in the additional information to complete your profile.'}
                </p>
              </DialogHeader>
            </div>
            <ProgressIndicator />
            {error && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-4">
              {step === 1 ? (
                <>
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name*</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={14} className="text-gray-400" />
                          </div>
                          <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            value={basicData.firstName}
                            onChange={handleBasicChange}
                            required
                            className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                            placeholder="First name"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name*</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={14} className="text-gray-400" />
                          </div>
                          <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            value={basicData.lastName}
                            onChange={handleBasicChange}
                            required
                            className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                            placeholder="Last name"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email*</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail size={14} className="text-gray-400" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={basicData.email}
                          onChange={handleBasicChange}
                          required
                          className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                          placeholder="Your email"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password*</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={14} className="text-gray-400" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          value={basicData.password}
                          onChange={handleBasicChange}
                          required
                          className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                          placeholder="Create a password"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
                    </div>
                    
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password*</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={14} className="text-gray-400" />
                        </div>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={basicData.confirmPassword}
                          onChange={handleBasicChange}
                          required
                          className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                          placeholder="Confirm your password"
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="button" className="w-full py-2 shadow-lg" onClick={goToNextStep} disabled={loading}>
                    Next
                  </Button>

                  <div className="mt-4">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                      </div>
                    </div>
                    <Button type="button" variant="outline" className="w-full mt-3 shadow-sm" onClick={handleGoogleSignUp} disabled={loading}>
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        <path fill="none" d="M1 1h22v22H1z" />
                      </svg>
                      Sign up with Google
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="educationLevel" className="block text-sm font-medium text-gray-700">Education Level</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BookOpen size={14} className="text-gray-400" />
                        </div>
                        <select
                          id="educationLevel"
                          name="educationLevel"
                          value={additionalData.educationLevel}
                          onChange={handleAdditionalChange}
                          className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                        >
                          <option value="">Select education level</option>
                          <option value="high_school">High School</option>
                          <option value="undergraduate">Undergraduate</option>
                          <option value="graduate">Graduate</option>
                          <option value="postgraduate">Postgraduate</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-700">Place of Birth</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Globe size={14} className="text-gray-400" />
                        </div>
                        <input
                          id="placeOfBirth"
                          name="placeOfBirth"
                          type="text"
                          value={additionalData.placeOfBirth}
                          onChange={handleAdditionalChange}
                          className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                          placeholder="Place of birth"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="placeOfResidence" className="block text-sm font-medium text-gray-700">Place of Residence</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Home size={14} className="text-gray-400" />
                        </div>
                        <input
                          id="placeOfResidence"
                          name="placeOfResidence"
                          type="text"
                          value={additionalData.placeOfResidence}
                          onChange={handleAdditionalChange}
                          className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                          placeholder="Current residence"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="englishLevel" className="block text-sm font-medium text-gray-700">English Level</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Award size={14} className="text-gray-400" />
                        </div>
                        <select
                          id="englishLevel"
                          name="englishLevel"
                          value={additionalData.englishLevel}
                          onChange={handleAdditionalChange}
                          className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                        >
                          <option value="">Select English level</option>
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                          <option value="fluent">Fluent</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="toeflScore" className="block text-sm font-medium text-gray-700">TOEFL Score</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Award size={14} className="text-gray-400" />
                        </div>
                        <input
                          id="toeflScore"
                          name="toeflScore"
                          type="number"
                          value={additionalData.toeflScore}
                          onChange={handleAdditionalChange}
                          className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                          placeholder="TOEFL score"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="interests" className="block text-sm font-medium text-gray-700">Interests</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Coffee size={14} className="text-gray-400" />
                        </div>
                        <input
                          id="interests"
                          name="interests"
                          type="text"
                          value={additionalData.interests}
                          onChange={handleAdditionalChange}
                          className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                          placeholder="Your interests"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar size={14} className="text-gray-400" />
                        </div>
                        <input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          value={additionalData.dateOfBirth}
                          onChange={handleAdditionalChange}
                          className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute top-3 left-3 pointer-events-none">
                        <FileText size={14} className="text-gray-400" />
                      </div>
                      <textarea
                        id="bio"
                        name="bio"
                        value={additionalData.bio}
                        onChange={handleAdditionalChange}
                        className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                        placeholder="Tell us about yourself"
                        rows={3}
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-3">
                    <Button type="button" variant="outline" className="flex-1 shadow-sm" onClick={goToPrevStep} disabled={loading}>
                      Back
                    </Button>
                    <Button type="submit" className="flex-1 shadow-lg" disabled={loading}>
                      {loading ? 'Creating...' : 'Complete Sign Up'}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignUp;
