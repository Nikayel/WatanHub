import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '../ui/dialog';
import { 
  BookOpen, Bookmark, Globe, Home, Mail, Lock, User, Award, 
  Calendar, FileText, Coffee, ArrowLeft, ArrowRight, CheckCircle,
  X, ChevronDown, ChevronUp, Sparkles, Key
} from 'lucide-react';
//UPDATED SCHEMA FOR GENDRE AND RELIGION
// Enhanced FormSection component with improved styling
const FormSection = ({ children, title, icon }) => (
  <div className="mb-6 bg-white rounded-lg shadow-sm p-4 border border-gray-100 transition-all hover:shadow-md">
    <div className="flex items-center mb-4">
      <div className="p-2 bg-primary/10 rounded-full mr-3">
        {icon}
      </div>
      <h3 className="font-medium text-gray-800">{title}</h3>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const SignUp = ({ isOpen, onClose }) => {
  const initialBasicData = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    religion: ''
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [animation, setAnimation] = useState('');
  const { user, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setBasicData(prev => ({ ...prev, [name]: value }));
  };
  
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

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
    setAnimation('slide-left');
    setTimeout(() => {
      setStep(2);
      setAnimation('');
      // Scroll to top on mobile
      window.scrollTo(0, 0);
    }, 300);
  };

  const goToPrevStep = () => {
    setAnimation('slide-right');
    setTimeout(() => {
      setStep(1);
      setError(null);
      setAnimation('');
      // Scroll to top on mobile
      window.scrollTo(0, 0);
    }, 300);
  };

  const handleClose = () => {
    navigate('/');
    onClose?.();
  };

  const saveUserProfile = async (userId) => {
    let profileData;
    try {
      profileData = {
        id: userId,
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
        gender: additionalData.gender || null,            // new
        religion: additionalData.religion.trim() || null,
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

      if (authError || !authData?.user) {
        throw authError || new Error("User creation failed");
      }

      // Create user profile
      await saveUserProfile(authData.user.id);

      // Close dialog and navigate
      navigate('/'); 
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
      navigate('/');
      onClose?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: 'Very Weak', color: 'bg-gray-200' };
    
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (password.length >= 10) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    const strengthMap = [
      { text: 'Very Weak', color: 'bg-red-500' },
      { text: 'Weak', color: 'bg-orange-500' },
      { text: 'Medium', color: 'bg-yellow-500' },
      { text: 'Strong', color: 'bg-lime-500' },
      { text: 'Very Strong', color: 'bg-green-500' },
    ];
    
    return { 
      strength, 
      text: strengthMap[strength].text, 
      color: strengthMap[strength].color 
    };
  };
  
  const passwordStrength = getPasswordStrength(basicData.password);
  
  // Animation styles
  const slideStyles = {
    "slide-left": "animate-slide-left",
    "slide-right": "animate-slide-right",
    "": ""
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md md:max-w-2xl lg:max-w-4xl p-0 bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-xl overflow-hidden outline-none mx-auto my-auto w-full md:w-4/5 max-h-[95vh] md:max-h-[90vh] flex flex-col">
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          {/* Left Side - Illustration/Info */}
          <div className="hidden md:block md:w-2/5 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <radialGradient id="radialGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                    <stop offset="0%" stopColor="white" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="50" fill="url(#radialGradient)" />
              </svg>
            </div>
            
            <div className="relative z-10 h-full flex flex-col">
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-2">Welcome to our Learning Community</h2>
                <p className="text-blue-100">Join thousands of students enhancing their academic journey</p>
              </div>
              
              <div className="flex-grow space-y-6">
                <div className="flex items-start space-x-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <BookOpen size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Access to Premium Courses</h3>
                    <p className="text-sm text-blue-100">Learn from world-class educators</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Personalized Learning Path</h3>
                    <p className="text-sm text-blue-100">Tailored to your educational goals</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Globe size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Global Student Network</h3>
                    <p className="text-sm text-blue-100">Connect with peers worldwide</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto">
                <div className="bg-white/10 p-4 rounded-lg">
                  <p className="text-sm italic">"This platform transformed my learning experience and opened new opportunities."</p>
                  <div className="mt-3 flex items-center">
                    <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-semibold">JS</div>
                    <div className="ml-2">
                      <p className="text-sm font-medium">Jamie Smith</p>
                      <p className="text-xs text-blue-200">Graduate Student</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form Content */}
          <div className="w-full md:w-3/5 flex flex-col overflow-hidden">
            <DialogClose asChild>
              <Button 
                variant="ghost" 
                className="absolute top-2 right-2 h-8 w-8 rounded-full p-0 hover:bg-gray-200"
                aria-label="Close"
                onClick={handleClose}
              >
                <X size={16} />
              </Button>
            </DialogClose>

            {/* Mobile Header */}
            <div className="flex items-center justify-between md:hidden mb-4 px-4 pt-4">
              {step > 1 ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-1 hover:bg-gray-100 text-primary"
                  onClick={goToPrevStep}
                >
                  <ArrowLeft size={16} className="mr-1" /> Back
                </Button>
              ) : (
                <div className="w-16"></div>
              )}
              <div className="flex items-center">
                <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                  Step {step} of 2
                </span>
              </div>
              <div className="w-16"></div>
            </div>

            <div className={`px-4 sm:px-6 py-4 ${slideStyles[animation]} flex-1 overflow-y-auto`}>
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-bold text-center text-gray-800">
                  {step === 1 ? 'Create Your Account' : 'Tell Us About Yourself'}
                </DialogTitle>
                <p className="text-center text-sm text-gray-600 mt-2">
                  {step === 1
                    ? 'Enter your details to join our learning community.'
                    : 'Just a few more details to personalize your experience.'}
                </p>
              </DialogHeader>

              {/* Progress Bar */}
              <div className="mb-6 px-1">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: step === 1 ? '50%' : '100%' }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span className={`${step >= 1 ? "font-medium text-primary" : ""}`}>Account</span>
                  <span className={`${step >= 2 ? "font-medium text-primary" : ""}`}>Profile</span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center text-sm">
                  <div className="p-1 bg-red-100 rounded-full mr-2">
                    <X size={14} className="text-red-500" />
                  </div>
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className={`space-y-6 px-1 pb-6 ${slideStyles[animation]}`}>
                {step === 1 ? (
                  <>
                    {/* Basic Info */}
                    <FormSection 
                      title="Personal Information" 
                      icon={<User size={18} className="text-primary" />}
                    >
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name*</label>
                          <div className="relative rounded-md">
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
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name*</label>
                          <div className="relative rounded-md">
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
                    </FormSection>
                    
                    <FormSection 
                      title="Account Credentials" 
                      icon={<Key size={18} className="text-primary" />}
                    >
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address*</label>
                        <div className="relative rounded-md">
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
                            placeholder="Your email address"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password*</label>
                        <div className="relative rounded-md">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={14} className="text-gray-400" />
                          </div>
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={basicData.password}
                            onChange={handleBasicChange}
                            required
                            className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm pr-10"
                            placeholder="Create a secure password"
                          />
                          <button 
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <ChevronUp size={14} className="text-gray-400 hover:text-gray-600" />
                            ) : (
                              <ChevronDown size={14} className="text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                        
                        {/* Password strength indicator */}
                        {basicData.password && (
                          <div className="mt-2">
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${passwordStrength.color} transition-all duration-300`} 
                                style={{ width: `${(passwordStrength.strength + 1) * 20}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-xs text-gray-500">Password strength</span>
                              <span className={`text-xs font-medium ${
                                passwordStrength.strength >= 3 ? 'text-green-600' : 
                                passwordStrength.strength >= 2 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {passwordStrength.text}
                              </span>
                            </div>
                          </div>
                        )}
                        <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
                      </div>
                      
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password*</label>
                        <div className="relative rounded-md">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={14} className="text-gray-400" />
                          </div>
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={basicData.confirmPassword}
                            onChange={handleBasicChange}
                            required
                            className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm pr-10"
                            placeholder="Confirm your password"
                          />
                          <button 
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <ChevronUp size={14} className="text-gray-400 hover:text-gray-600" />
                            ) : (
                              <ChevronDown size={14} className="text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                        {basicData.confirmPassword && basicData.password !== basicData.confirmPassword && (
                          <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                        )}
                      </div>
                    </FormSection>

                    <Button 
                      type="button" 
                      className="w-full py-3 shadow-lg flex items-center justify-center bg-primary hover:bg-primary/90 font-medium text-white rounded-lg" 
                      onClick={goToNextStep} 
                      disabled={loading}
                    >
                      Continue to Profile Details <ArrowRight size={16} className="ml-2" />
                    </Button>

                    <div className="relative flex items-center my-6">
                      <div className="flex-grow border-t border-gray-300"></div>
                      <span className="flex-shrink mx-4 text-gray-600 text-sm">or continue with</span>
                      <div className="flex-grow border-t border-gray-300"></div>
                    </div>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full py-2.5 shadow-sm flex items-center justify-center border-gray-300 hover:bg-gray-50 transition-colors" 
                      onClick={handleGoogleSignUp} 
                      disabled={loading}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Sign up with Google
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Education Section */}
                    <FormSection 
                      title="Education & Language" 
                      icon={<BookOpen size={18} className="text-primary" />}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="educationLevel" className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                          <div className="relative rounded-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <BookOpen size={14} className="text-gray-400" />
                            </div>
                            <select
                              id="educationLevel"
                              name="educationLevel"
                              value={additionalData.educationLevel}
                              onChange={handleAdditionalChange}
                              className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white appearance-none"
                            >
                              <option value="">Select education level</option>
                              <option value="high_school">High School</option>
                              <option value="undergraduate">Undergraduate</option>
                              <option value="graduate">Graduate</option>
                              <option value="postgraduate">Postgraduate</option>
                              <option value="other">Other</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <ChevronDown size={14} className="text-gray-400" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="englishLevel" className="block text-sm font-medium text-gray-700 mb-1">English Level</label>
                          <div className="relative rounded-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Award size={14} className="text-gray-400" />
                            </div>
                            <select
                              id="englishLevel"
                              name="englishLevel"
                              value={additionalData.englishLevel}
                              onChange={handleAdditionalChange}
                              className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white appearance-none"
                            >
                              <option value="">Select English level</option>
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                              <option value="fluent">Fluent</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <ChevronDown size={14} className="text-gray-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label htmlFor="toeflScore" className="block text-sm font-medium text-gray-700 mb-1">TOEFL Score (if applicable)</label>
                        <div className="relative rounded-md">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Award size={14} className="text-gray-400" />
                          </div>
                          <input
                            id="toeflScore"
                            name="toeflScore"
                            type="number"
                            value={additionalData.toeflScore}
                            onChange={handleAdditionalChange}
                            min="0"
                            max="120"
                            className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                            placeholder="Your TOEFL score"
                          />
                        </div>
                          </div>
                      </FormSection>

                      {/* Personal Details */}
                      <FormSection
                        title="Personal Details"
                        icon={<Calendar size={18} className="text-primary" />}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                              Date of Birth
                            </label>
                            <input
                              id="dateOfBirth"
                              name="dateOfBirth"
                              type="date"
                              value={additionalData.dateOfBirth}
                              onChange={handleAdditionalChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label htmlFor="placeOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
                              Place of Birth
                            </label>
                            <div className="relative rounded-md">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Globe size={14} className="text-gray-400" />
                              </div>
                              <input
                                id="placeOfBirth"
                                name="placeOfBirth"
                                type="text"
                                value={additionalData.placeOfBirth}
                                onChange={handleAdditionalChange}
                                placeholder="City, Country"
                                className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="placeOfResidence" className="block text-sm font-medium text-gray-700 mb-1">
                              Place of Residence
                            </label>
                            <div className="relative rounded-md">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Home size={14} className="text-gray-400" />
                              </div>
                              <input
                                id="placeOfResidence"
                                name="placeOfResidence"
                                type="text"
                                value={additionalData.placeOfResidence}
                                onChange={handleAdditionalChange}
                                placeholder="City, Country"
                                className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-1">
                              Interests
                            </label>
                            <div className="relative rounded-md">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Sparkles size={14} className="text-gray-400" />
                              </div>
                              <input
                                id="interests"
                                name="interests"
                                type="text"
                                value={additionalData.interests}
                                onChange={handleAdditionalChange}
                                placeholder="e.g. Coding, Cooking, Traveling"
                                className="pl-8 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                              />
                            </div>
                          </div>

                          <div className="sm:col-span-2">
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                              Short Bio
                            </label>
                            <textarea
                              id="bio"
                              name="bio"
                              rows="3"
                              value={additionalData.bio}
                              onChange={handleAdditionalChange}
                              placeholder="Tell us a little about yourself"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                            />
                          </div>
                        </div>
                      </FormSection>

                      {/* Navigation Buttons */}
                      <div className="flex justify-between items-center mt-6">
                        <Button
                          type="button"
                          variant="outline"
                          className="px-6 py-2"
                          onClick={goToPrevStep}
                          disabled={loading}
                        >
                          <ArrowLeft size={16} className="mr-2" /> Back
                        </Button>
                        <Button
                          type="submit"
                          className="px-6 py-2 bg-primary hover:bg-primary/90 text-white"
                          disabled={loading}
                        >
                          {loading ? 'Creating…' : 'Create Account'} <CheckCircle size={16} className="ml-2" />
                        </Button>
                      </div>
                    </>
                  )}
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignUp;
