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
    <Dialog open={isOpen} onOpenChange={handleClose} className="max-w-md mx-auto">
      <DialogContent className="max-w-md sm:max-w-md max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Join WatanHub
          </DialogTitle>
          <p className="text-center text-gray-500 mt-1 text-sm">
            Create your account
          </p>
        </DialogHeader>

        <DialogClose className="absolute right-4 top-4" asChild>
          <button className="p-1 rounded-full hover:bg-gray-100" onClick={handleClose}>
            <X className="h-4 w-4" />
          </button>
        </DialogClose>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-2 mb-3 text-red-600 text-sm flex items-start">
            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* User details section */}
          <FormSection title="Personal Information" icon={<User className="h-4 w-4 text-primary" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-xs font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={basicData.firstName}
                  onChange={handleBasicChange}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-xs font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={basicData.lastName}
                  onChange={handleBasicChange}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>
            </div>
          </FormSection>

          {/* Account details section */}
          <FormSection title="Account Details" icon={<Mail className="h-4 w-4 text-primary" />}>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={basicData.email}
                onChange={handleBasicChange}
                className={`w-full p-2 text-sm border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-primary focus:border-primary`}
                required
              />
            </div>

            {/* Email confirmation field */}
            <div>
              <label htmlFor="confirmEmail" className="block text-xs font-medium text-gray-700 mb-1">
                Confirm Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="confirmEmail"
                name="confirmEmail"
                value={basicData.confirmEmail}
                onChange={handleBasicChange}
                className={`w-full p-2 text-sm border ${emailError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-primary focus:border-primary`}
                required
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-600">{emailError}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={basicData.password}
                  onChange={handleBasicChange}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary pr-10"
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
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={basicData.confirmPassword}
                  onChange={handleBasicChange}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary pr-10"
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

          {/* Terms & Privacy section - simplified */}
          <div className="flex items-start space-x-3 mt-2 px-2">
            <input
              type="checkbox"
              id="termsAccepted"
              name="termsAccepted"
              checked={basicData.termsAccepted}
              onChange={handleBasicChange}
              className="mt-1"
              required
            />
            <label htmlFor="termsAccepted" className="text-xs text-gray-600">
              I agree to the <a href="/terms" target="_blank" className="text-indigo-600 hover:text-indigo-800 underline">Terms</a> and <a href="/privacy" target="_blank" className="text-indigo-600 hover:text-indigo-800 underline">Privacy Policy</a>. <span className="text-red-500">*</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              onClick={handleClose}
              variant="outline"
              className="rounded-lg text-sm py-1 px-3 h-8"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-lg text-sm py-1 px-3 h-8"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Account'}
              <CheckCircle className="ml-2 h-3.5 w-3.5" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SignUp;
