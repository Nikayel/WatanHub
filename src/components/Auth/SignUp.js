// src/components/Auth/SignUp.js
import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../ui/dialog';

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
    setBasicData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdditionalChange = (e) => {
    const { name, value } = e.target;
    setAdditionalData((prev) => ({ ...prev, [name]: value }));
  };

  const validateBasicStep = () => {
    if (!basicData.firstName) return "First name is required";
    if (!basicData.lastName) return "Last name is required";
    if (!basicData.email) return "Email is required";
    if (!basicData.password) return "Password is required";
    if (basicData.password !== basicData.confirmPassword) return "Passwords do not match";
    if (basicData.password.length < 6) return "Password must be at least 6 characters";
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
    const profileData = {
      user_id: userId,
      first_name: basicData.firstName,
      last_name: basicData.lastName,
      education_level: additionalData.educationLevel,
      place_of_birth: additionalData.placeOfBirth,
      place_of_residence: additionalData.placeOfResidence,
      english_level: additionalData.englishLevel,
      toefl_score: additionalData.toeflScore,
      interests: additionalData.interests,
      date_of_birth: additionalData.dateOfBirth,
      bio: additionalData.bio
    };

    const { error } = await supabase.from('profiles').insert([profileData]);
    if (error) throw error;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await signUp(basicData.email, basicData.password);
      if (error) throw error;
      if (data?.user) {
        await saveUserProfile(data.user.id);
      }
      onClose && onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose && onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg animate-fadeIn relative">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4">Create Account</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name*</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={basicData.firstName}
                  onChange={handleBasicChange}
                  required
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary focus:border-primary"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name*</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={basicData.lastName}
                  onChange={handleBasicChange}
                  required
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary focus:border-primary"
                  placeholder="Enter your last name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email*</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={basicData.email}
                  onChange={handleBasicChange}
                  required
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary focus:border-primary"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password*</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={basicData.password}
                  onChange={handleBasicChange}
                  required
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary focus:border-primary"
                  placeholder="Create a password"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password*</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={basicData.confirmPassword}
                  onChange={handleBasicChange}
                  required
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary focus:border-primary"
                  placeholder="Confirm your password"
                />
              </div>
              <Button type="button" className="w-full" onClick={goToNextStep} disabled={loading}>
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
                <Button type="button" variant="outline" className="w-full mt-3" onClick={handleGoogleSignUp} disabled={loading}>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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
              <div>
                <label htmlFor="educationLevel" className="block text-sm font-medium text-gray-700">Education Level</label>
                <select
                  id="educationLevel"
                  name="educationLevel"
                  value={additionalData.educationLevel}
                  onChange={handleAdditionalChange}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary focus:border-primary"
                >
                  <option value="">Select your education level</option>
                  <option value="high_school">High School</option>
                  <option value="undergraduate">Undergraduate</option>
                  <option value="graduate">Graduate</option>
                  <option value="postgraduate">Postgraduate</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-700">Place of Birth</label>
                <input
                  id="placeOfBirth"
                  name="placeOfBirth"
                  type="text"
                  value={additionalData.placeOfBirth}
                  onChange={handleAdditionalChange}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary focus:border-primary"
                  placeholder="Enter your place of birth"
                />
              </div>
              <div>
                <label htmlFor="placeOfResidence" className="block text-sm font-medium text-gray-700">Place of Residence</label>
                <input
                  id="placeOfResidence"
                  name="placeOfResidence"
                  type="text"
                  value={additionalData.placeOfResidence}
                  onChange={handleAdditionalChange}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary focus:border-primary"
                  placeholder="Enter your current place of residence"
                />
              </div>
              <div>
                <label htmlFor="englishLevel" className="block text-sm font-medium text-gray-700">English Level</label>
                <select
                  id="englishLevel"
                  name="englishLevel"
                  value={additionalData.englishLevel}
                  onChange={handleAdditionalChange}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary focus:border-primary"
                >
                  <option value="">Select your English level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="fluent">Fluent</option>
                </select>
              </div>
              <div>
                <label htmlFor="toeflScore" className="block text-sm font-medium text-gray-700">TOEFL Score</label>
                <input
                  id="toeflScore"
                  name="toeflScore"
                  type="number"
                  value={additionalData.toeflScore}
                  onChange={handleAdditionalChange}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary focus:border-primary"
                  placeholder="Enter your TOEFL score"
                />
              </div>
              <div>
                <label htmlFor="interests" className="block text-sm font-medium text-gray-700">Interests</label>
                <input
                  id="interests"
                  name="interests"
                  type="text"
                  value={additionalData.interests}
                  onChange={handleAdditionalChange}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary focus:border-primary"
                  placeholder="List your interests"
                />
              </div>
              <div>
                <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  id="dateOfBirth"
                  name="dateOfBirth"
                  type="date"
                  value={additionalData.dateOfBirth}
                  onChange={handleAdditionalChange}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={additionalData.bio}
                  onChange={handleAdditionalChange}
                  className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-primary focus:border-primary"
                  placeholder="Tell us about yourself"
                ></textarea>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={goToPrevStep} disabled={loading}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </div>
            </>
          )}
        </form>
        <DialogClose asChild>
          <Button variant="ghost" className="absolute top-2 right-2" aria-label="Close">
            &times;
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default SignUp;
