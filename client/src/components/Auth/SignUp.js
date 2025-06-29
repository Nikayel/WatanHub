import React, { useEffect, useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { updateTermsAcceptance } from '../../lib/UserTerms';
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
  BookOpen, Users, Heart, Award, Shield, Mail, Lock, User,
  GraduationCap, Calendar, FileText, Coffee, ArrowLeft, ArrowRight, CheckCircle,
  X, ChevronDown, ChevronUp, Sparkles, Key, AlertTriangle, Eye, EyeOff,
  HelpCircle, Star, Target, Globe
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

// Compact FormSection component with improved styling
const FormSection = ({ children, title, icon }) => (
  <div className="mb-3 bg-white rounded-lg shadow-sm p-3 border border-gray-100 transition-all hover:shadow-md">
    <div className="flex items-center mb-2">
      <div className="p-1.5 bg-primary/10 rounded-full mr-2">
        {icon}
      </div>
      <h3 className="font-medium text-gray-800 text-sm">{title}</h3>
    </div>
    <div className="space-y-3">
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
    termsAccepted: false,
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
    const { name, value, type, checked } = e.target;
    setBasicData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

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

    // Terms of service validation
    if (!basicData.termsAccepted) return "You must accept the Terms of Service and Privacy Policy";

    return null;
  };

  const goToNextStep = async () => {
    const errorMsg = await validateBasicStep();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }
    setError(null);
    handleSubmit(new Event('submit'));
  };

  const handleClose = () => {
    navigate('/');
    onClose?.();
  };

  const saveUserProfile = async (userId) => {
    let profileData;
    try {
      // Ensure the terms_accepted is explicitly set to true when termsAccepted is checked
      profileData = {
        id: userId,
        first_name: basicData.firstName.trim(),
        last_name: basicData.lastName.trim(),
        email: basicData.email.toLowerCase().trim(),
        terms_accepted: basicData.termsAccepted === true,
      };

      console.log("Creating profile with data:", profileData);

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) throw error;

      console.log("Profile created successfully:", data);
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

      // Log for debugging
      console.log("Terms accepted status before signup:", basicData.termsAccepted);

      // Create the auth user
      const { data, error: authError } = await signUp(
        basicData.email,
        basicData.password,
        basicData.firstName,
        basicData.lastName
      );

      if (authError || !data?.user) {
        throw authError || new Error("User creation failed");
      }

      // After successful signup, update the terms_accepted field using the utility
      try {
        const termsUpdated = await updateTermsAcceptance(data.user.id, basicData.termsAccepted);
        if (termsUpdated) {
          console.log("Terms acceptance updated successfully");
        } else {
          console.warn("Terms acceptance update may have failed");
        }

        // Also create a full profile to ensure all data is saved
        await saveUserProfile(data.user.id);
      } catch (profileError) {
        console.error("Error updating terms acceptance:", profileError);
      }

      // Set flag to show onboarding on first login
      localStorage.setItem('newSignup', 'true');
      // Also set a flag to remember user accepted terms
      localStorage.setItem('termsAccepted', 'true');

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose} className="max-w-lg mx-auto">
      <DialogContent className="max-w-lg sm:max-w-lg max-h-[95vh] overflow-auto bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-gray-800 mx-4 sm:mx-auto">
        <DialogHeader className="space-y-4 text-center pb-6">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Join WatanHub Student Program
          </DialogTitle>

          {/* Purpose clarification section */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-3">
              <GraduationCap className="h-6 w-6" />
              <span className="font-semibold text-lg">Student & Mentee Registration</span>
            </div>

            <p className="text-blue-100 text-sm leading-relaxed">
              Get mentorship, scholarships, and educational support for your academic journey.
            </p>

            <div className="flex items-center justify-center gap-6 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4" />
                <span>Scholarships</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>1:1 Mentoring</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Career Guidance</span>
              </div>
            </div>
          </div>

          {/* Team notification - responsive positioning */}
          <div className="fixed left-2 top-16 sm:left-4 sm:top-1/2 sm:transform sm:-translate-y-1/2 z-50 max-w-xs">
            <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white p-3 sm:p-4 rounded-xl shadow-xl border-2 border-white animate-pulse">
              <div className="flex items-start gap-2 sm:gap-3">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-xs sm:text-sm">Want to join our team?</p>
                  <p className="text-xs text-green-100 mt-1 mb-2">
                    Apply as mentor or team member
                  </p>
                  <a
                    href="/get-involved"
                    className="inline-block bg-white text-green-600 px-2 py-1 sm:px-3 rounded-full text-xs font-medium hover:bg-green-50 transition-colors"
                  >
                    Get Involved →
                  </a>
                </div>
                <button
                  onClick={(e) => {
                    e.currentTarget.parentElement.parentElement.style.display = 'none';
                  }}
                  className="text-white hover:text-green-200 text-lg leading-none flex-shrink-0"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <DialogClose className="absolute right-4 top-4 z-10" asChild>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </DialogClose>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-red-600 text-sm flex items-start">
            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information Section */}
          <FormSection
            title="Personal Information"
            icon={<User className="h-4 w-4 text-blue-600" />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={basicData.firstName}
                  onChange={handleBasicChange}
                  className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={basicData.lastName}
                  onChange={handleBasicChange}
                  className="w-full p-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>
          </FormSection>

          {/* Account Details Section */}
          <FormSection
            title="Account Credentials"
            icon={<Shield className="h-4 w-4 text-green-600" />}
          >
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={basicData.email}
                    onChange={handleBasicChange}
                    className={`w-full pl-10 pr-3 py-3 text-sm border ${emailError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all`}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="confirmEmail"
                    name="confirmEmail"
                    value={basicData.confirmEmail}
                    onChange={handleBasicChange}
                    className={`w-full pl-10 pr-3 py-3 text-sm border ${emailError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all`}
                    placeholder="Confirm your email"
                    required
                  />
                </div>
                {emailError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {emailError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={basicData.password}
                    onChange={handleBasicChange}
                    className="w-full pl-10 pr-12 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                    placeholder="Create a secure password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Enhanced password strength indicator */}
                <div className="mt-2">
                  <div className="flex items-center gap-1 mb-1">
                    <div className={`h-2 flex-1 rounded-full transition-all ${getPasswordStrengthColor(basicData.password)}`}></div>
                    <div className={`h-2 flex-1 rounded-full transition-all ${basicData.password.length >= 8 ? getPasswordStrengthColor(basicData.password) : 'bg-gray-200'}`}></div>
                    <div className={`h-2 flex-1 rounded-full transition-all ${basicData.password.length >= 10 ? getPasswordStrengthColor(basicData.password) : 'bg-gray-200'}`}></div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    <span className={`font-medium ${passwordStrength.text === 'Strong' ? 'text-green-600' : passwordStrength.text === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                      {passwordStrength.text}
                    </span>
                    {' - '}Use 8+ characters with numbers & symbols for better security
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={basicData.confirmPassword}
                    onChange={handleBasicChange}
                    className="w-full pl-10 pr-12 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </FormSection>

          {/* Terms and Agreement */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="termsAccepted"
                name="termsAccepted"
                checked={basicData.termsAccepted}
                onChange={handleBasicChange}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                required
              />
              <div className="text-sm">
                <label htmlFor="termsAccepted" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
                    Privacy Policy
                  </a>
                  , and understand this registration is for the WatanHub Student Program.
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-4">
            <Button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Join Student Program
                </div>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={handleGoogleSignUp}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </Button>
          </div>

          {/* Login Link */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              Already have a student account?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  // Navigate to login or switch mode
                }}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
              >
                Sign in here
              </button>
            </span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SignUp;
