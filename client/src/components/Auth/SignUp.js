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
  X, ChevronDown, ChevronUp, Sparkles, Key, AlertTriangle, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

// Password strength assessment
const getPasswordStrength = (password) => {
  if (!password) return { strength: 0, text: 'Weak', color: 'bg-red-500' };

  let strength = 0;

  // Length check
  if (password.length >= 6) strength += 1;
  if (password.length >= 8) strength += 1;

  // Complexity checks
  if (/[A-Z]/.test(password)) strength += 1; // Has uppercase
  if (/[0-9]/.test(password)) strength += 1; // Has number
  if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Has special char

  // Result mapping
  if (strength <= 2) return { strength, text: 'Weak', color: 'bg-red-500' };
  if (strength <= 4) return { strength, text: 'Medium', color: 'bg-yellow-500' };
  return { strength, text: 'Strong', color: 'bg-green-500' };
};

// Get password strength color for UI
const getPasswordStrengthColor = (password) => {
  const { color } = getPasswordStrength(password);
  return color;
};

// List of common disposable email domains to block
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'temp-mail.org', 'mailinator.com', 'tempail.com',
  '10minutemail.com', 'guerrillamail.com', 'sharklasers.com',
  'trashmail.com', 'throwawaymail.com', 'yopmail.com', 'mailnesia.com',
  'tempr.email', 'dispostable.com', 'maildrop.cc', 'getnada.com',
  'temp-mail.io', 'emailondeck.com', 'spamgourmet.com', 'anonbox.net',
  'grr.la', 'mintemail.com', 'fakeinbox.com', 'mailcatch.com',
  'trbvm.com', 'harakirimail.com', 'mailforspam.com', 'mvrht.net',
  'mytemp.email', 'safetymail.info', 'trash-mail.at', 'trashmail.ws'
];

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
    confirmEmail: '',
    password: '',
    confirmPassword: '',
  };

  const [basicData, setBasicData] = useState(initialBasicData);
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [animation, setAnimation] = useState('');
  const [emailError, setEmailError] = useState('');
  const { user, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setBasicData(prev => ({ ...prev, [name]: value }));

    // Clear email error when typing
    if (name === 'email' || name === 'confirmEmail') {
      setEmailError('');
    }
  };

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Email domain validation
  const isValidEmailDomain = async (email) => {
    if (!email) return false;

    const domain = email.split('@')[1];

    // Check if domain is in the disposable email list
    if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
      setEmailError("Please use a non-disposable email address");
      return false;
    }

    // Basic domain check
    try {
      // Simple domain format validation
      const domainParts = domain.split('.');
      if (domainParts.length < 2 || domainParts[domainParts.length - 1].length < 2) {
        setEmailError("Please enter a valid email domain");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Domain validation error:", error);
      return false;
    }
  };

  const validateBasicStep = async () => {
    // Reset errors
    setError(null);
    setEmailError('');

    if (!basicData.firstName.trim()) return "First name is required";
    if (!basicData.lastName.trim()) return "Last name is required";

    // Email validation
    if (!basicData.email.match(/^\S+@\S+\.\S+$/)) return "Valid email is required";
    if (basicData.email !== basicData.confirmEmail) {
      setEmailError("Email addresses do not match");
      return "Email addresses do not match";
    }

    // Validate email domain
    const isValidDomain = await isValidEmailDomain(basicData.email);
    if (!isValidDomain) {
      return emailError || "Invalid email domain";
    }

    // Password validation
    if (basicData.password.length < 6) return "Password must be at least 6 characters";
    if (basicData.password !== basicData.confirmPassword) return "Passwords do not match";

    return null;
  };

  const goToNextStep = async () => {
    const errorMsg = await validateBasicStep();
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
      // Final validation before submission
      const validationError = await validateBasicStep();
      if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
      }

      const { data, error: authError } = await signUp(
        basicData.email,
        basicData.password,
        basicData.firstName,
        basicData.lastName
      );

      if (authError || !data?.user) {
        throw authError || new Error("User creation failed");
      }

      // Set flag to show onboarding on first login
      localStorage.setItem('newSignup', 'true');

      // Show success toast if not redirected
      toast.success('Account created successfully! Please check your email to confirm your account.');

      // ✅ Give them time to read (e.g. 5 seconds), then redirect
      setTimeout(() => {
        navigate('/');
        onClose?.();
      }, 5000);

    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
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

  const passwordStrength = getPasswordStrength(basicData.password);

  // Animation styles
  const slideStyles = {
    "slide-left": "animate-slide-left",
    "slide-right": "animate-slide-right",
    "": ""
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} className="max-w-2xl mx-auto">
      <DialogContent className="max-w-2xl sm:max-w-2xl min-h-[50vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Join WatanHub
          </DialogTitle>
          <p className="text-center text-gray-500 mt-1">
            {step === 1 ? "Create your account" : "Additional Information"}
          </p>
        </DialogHeader>

        <DialogClose className="absolute right-4 top-4" asChild>
          <button className="p-1 rounded-full hover:bg-gray-100" onClick={handleClose}>
            <X className="h-4 w-4" />
          </button>
        </DialogClose>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 text-red-600 text-sm flex items-start">
            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={step === 1 ? goToNextStep : handleSubmit} className={`space-y-4 ${animation}`}>
          {step === 1 && (
            <>
              {/* User details section */}
              <FormSection title="Personal Information" icon={<User className="h-5 w-5 text-primary" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={basicData.firstName}
                      onChange={handleBasicChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={basicData.lastName}
                      onChange={handleBasicChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      required
                    />
                  </div>
                </div>
              </FormSection>

              {/* Account details section */}
              <FormSection title="Account Details" icon={<Mail className="h-5 w-5 text-primary" />}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={basicData.email}
                    onChange={handleBasicChange}
                    className={`w-full p-2 border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-primary focus:border-primary`}
                    required
                  />
                </div>

                {/* Email confirmation field */}
                <div>
                  <label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="confirmEmail"
                    name="confirmEmail"
                    value={basicData.confirmEmail}
                    onChange={handleBasicChange}
                    className={`w-full p-2 border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-primary focus:border-primary`}
                    required
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-600">{emailError}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={basicData.password}
                      onChange={handleBasicChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <div className={`h-1 flex-1 rounded-full ${getPasswordStrengthColor(basicData.password)}`}></div>
                    <div className={`h-1 flex-1 rounded-full ${basicData.password.length >= 8 ? getPasswordStrengthColor(basicData.password) : 'bg-gray-200'}`}></div>
                    <div className={`h-1 flex-1 rounded-full ${basicData.password.length >= 10 ? getPasswordStrengthColor(basicData.password) : 'bg-gray-200'}`}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Minimum 6 characters, stronger with numbers & symbols</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={basicData.confirmPassword}
                      onChange={handleBasicChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary pr-10"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
              </FormSection>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  onClick={handleClose}
                  variant="outline"
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-lg"
                  onClick={goToNextStep}
                  disabled={loading}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {/* Education Section */}


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
      </DialogContent>
    </Dialog>
  );
};

export default SignUp;
