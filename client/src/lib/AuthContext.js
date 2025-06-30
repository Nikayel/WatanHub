import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from './supabase';
import { ROLES, getUserRole, getStudentProfile, getMentorProfile } from './UserRoles';
import * as UserTerms from './UserTerms';
import { sessionManager } from './SessionManager';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [hasAcceptedTermsOfService, setHasAcceptedTermsOfService] = useState(false);

  // Check if user is admin
  const checkAdmin = async (email) => {
    try {
      const { data, error } = await supabase
        .from('admin')
        .select('email')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Admin check error:", error.message);
      }

      const isUserAdmin = !!data;
      setIsAdmin(isUserAdmin);
      return isUserAdmin;
    } catch (err) {
      console.error('Error checking admin:', err.message);
      return false;
    }
  };

  // Check if user is mentor
  const checkMentor = async (email) => {
    try {
      const { data, error } = await supabase
        .from('mentorapplications')
        .select('*')
        .eq('email', email)
        .eq('status', 'approved')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Mentor check error:", error.message);
      }

      const isUserMentor = !!data;
      setIsMentor(isUserMentor);
      return isUserMentor;
    } catch (err) {
      console.error('Error checking mentor:', err.message);
      return false;
    }
  };

  // Check if profile is complete with all required fields
  const checkProfileCompleteness = (profileData) => {
    if (!profileData) return false;

    // Define required fields based on role
    const requiredFields = ['first_name', 'last_name'];
    const studentFields = ['education_level', 'english_level', 'interests'];

    // Check basic fields
    const hasBasicFields = requiredFields.every(field =>
      profileData[field] && profileData[field].trim() !== ''
    );

    // For students, check additional fields
    const needsStudentFields = userRole === ROLES.STUDENT || userRole === null;
    if (needsStudentFields) {
      const hasStudentFields = studentFields.every(field =>
        profileData[field] && profileData[field].toString().trim() !== ''
      );
      return hasBasicFields && hasStudentFields;
    }

    return hasBasicFields;
  };

  // Fetch or insert user profile
  const handleUserProfile = async (currentUser) => {
    if (!currentUser) {
      setProfile(null);
      setUserRole(null);
      setIsAdmin(false);
      setIsMentor(false);
      setIsStudent(false);
      setIsProfileComplete(true);
      setHasAcceptedTermsOfService(false);
      return;
    }

    try {
      // Check for existing profile
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Profile fetch error:", profileError.message);
      }

      // Check if terms have been accepted
      const termsAccepted = await UserTerms.hasAcceptedTerms(currentUser.id);
      setHasAcceptedTermsOfService(termsAccepted);

      // Determine if user is admin or mentor
      const isUserAdmin = await checkAdmin(currentUser.email);
      let isUserMentor = false;

      if (!isUserAdmin) {
        isUserMentor = await checkMentor(currentUser.email);
      }

      // Set UI state
      setIsAdmin(isUserAdmin);
      setIsMentor(isUserMentor);
      setIsStudent(!isUserAdmin && !isUserMentor);

      // Determine role for context
      let role = isUserAdmin ? ROLES.ADMIN : isUserMentor ? ROLES.MENTOR : ROLES.STUDENT;
      setUserRole(role);

      if (!existingProfile) {
        // Insert new profile if it doesn't exist
        await insertProfileIfMissing(currentUser, isUserAdmin);

        // Fetch again after insertion
        const { data: newProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (newProfile) {
          setProfile(newProfile);
          // Check if profile is complete
          const isComplete = checkProfileCompleteness(newProfile);
          setIsProfileComplete(isComplete);
        } else {
          setProfile(null);
          setIsProfileComplete(false);
        }
      } else {
        setProfile(existingProfile);
        // Check if profile is complete
        const isComplete = checkProfileCompleteness(existingProfile);
        setIsProfileComplete(isComplete);
      }
    } catch (err) {
      console.error('Error handling user profile:', err);
      setIsProfileComplete(false);
    }
  };

  // Insert profile if not exists
  const insertProfileIfMissing = async (user, isUserAdmin) => {
    if (!user) return;

    // Check if profile exists
    const { data: profile, error: selectError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error("Profile fetch error:", selectError.message);
      return;
    }

    if (!profile) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          is_admin: isUserAdmin || false
        });

      if (insertError) {
        console.error("Profile insert error:", insertError.message);
      }
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    let mounted = true;
    let timeoutId;

    const setupAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          if (mounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          setUser(session.user);
          await handleUserProfile(session.user);
        } else if (mounted) {
          setUser(null);
          setProfile(null);
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth setup error:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    // Set up auth state change listener - THIS WAS MISSING!
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);

        if (event === 'SIGNED_IN' && session?.user && mounted) {
          setUser(session.user);
          setError(null);
          await handleUserProfile(session.user);
        } else if (event === 'SIGNED_OUT' && mounted) {
          console.log('User signed out, clearing state');
          clearUserState();
        } else if (event === 'TOKEN_REFRESHED' && mounted) {
          console.log('Token refreshed successfully');
          setError(null);
        }
      }
    );

    // Set a longer timeout for auth setup - 30 seconds instead of 15
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.log('Auth setup taking longer than expected, forcing completion');
        setLoading(false);
        console.log('Auth timeout reached but continuing without error');
      }
    }, 10000); // Reduced from 30 seconds to 10 seconds for faster response

    setupAuth();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription?.unsubscribe();
    };
  }, []);

  // Clear all user state
  const clearUserState = () => {
    setUser(null);
    setProfile(null);
    setUserRole(null);
    setIsAdmin(false);
    setIsMentor(false);
    setIsStudent(false);
    setHasAcceptedTermsOfService(false);
  };

  const signUp = async (email, password, firstName, lastName) => {
    try {
      setLoading(true);

      // Basic email validation
      if (!email.match(/^\S+@\S+\.\S+$/)) {
        throw new Error("Please enter a valid email address");
      }

      // Normalize email to lowercase
      const normalizedEmail = email.toLowerCase().trim();

      // Check for disposable email domains
      const domain = normalizedEmail.split('@')[1];
      const disposableDomains = [
        'tempmail.com', 'temp-mail.org', 'mailinator.com', 'tempail.com',
        '10minutemail.com', 'guerrillamail.com', 'sharklasers.com',
        'trashmail.com', 'throwawaymail.com', 'yopmail.com'
      ];

      if (disposableDomains.includes(domain)) {
        throw new Error("Please use a non-disposable email address");
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName
          }
        }
      });

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Starting logout process');
      setLoading(true);

      // 1. FIRST: Immediately notify SessionManager to stop all checks
      sessionManager.prepareForLogout();

      // 2. Clear all React state immediately to prevent UI confusion
      setUser(null);
      setProfile(null);
      setUserRole(null);
      setIsAdmin(false);
      setIsMentor(false);
      setIsStudent(false);
      setHasAcceptedTermsOfService(false);

      // 3. Log current storage state for debugging
      const storageKeys = Object.keys(localStorage);
      console.log('📦 Storage keys before logout:',
        storageKeys.filter(key => key.startsWith('sb-') || key.includes('supabase'))
      );

      // 4. Signal to SessionManager that this is a controlled logout
      localStorage.setItem('watanhub_controlled_logout', Date.now().toString());

      // 5. Attempt Supabase global sign out with retry logic
      let signOutSuccess = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          console.log(`🔐 Attempting Supabase signOut (attempt ${attempt + 1})`);
          const { error } = await supabase.auth.signOut({ scope: 'global' });
          if (error) {
            console.error('❌ Supabase signOut error:', error);
            if (attempt === 2) throw error; // Throw on final attempt
          } else {
            console.log('✅ Supabase signOut successful');
            signOutSuccess = true;
            break;
          }
        } catch (signOutError) {
          console.error(`❌ SignOut attempt ${attempt + 1} failed:`, signOutError);
          if (attempt === 2) {
            console.warn('⚠️ All signOut attempts failed, proceeding with manual cleanup');
          }
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
        }
      }

      // 6. Comprehensive localStorage cleanup
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
      const projectRef = supabaseUrl.match(/https:\/\/(.*?)\.supabase/)?.[1] || '';

      // Clear project-specific Supabase auth token
      if (projectRef) {
        const sbKey = `sb-${projectRef}-auth-token`;
        console.log('🗑️ Removing project auth token:', sbKey);
        localStorage.removeItem(sbKey);
      }

      // Collect and remove all auth-related keys
      const authKeysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('sb-') ||
          key.includes('supabase') ||
          key.includes('auth') ||
          key.includes('watanhub')
        )) {
          authKeysToRemove.push(key);
        }
      }

      // Remove all collected keys
      authKeysToRemove.forEach(key => {
        console.log('🗑️ Removing localStorage key:', key);
        try {
          localStorage.removeItem(key);
        } catch (removeError) {
          console.warn('⚠️ Failed to remove key:', key, removeError);
        }
      });

      // 7. Clear session storage
      try {
        sessionStorage.clear();
        console.log('🗑️ Session storage cleared');
      } catch (sessionError) {
        console.warn('⚠️ Failed to clear session storage:', sessionError);
      }

      // 8. Clear all cookies
      try {
        document.cookie.split(";").forEach(function (c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        console.log('🍪 Cookies cleared');
      } catch (cookieError) {
        console.warn('⚠️ Failed to clear cookies:', cookieError);
      }

      // 9. Final verification - check if any auth tokens remain
      const remainingKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('sb-') || key.includes('supabase') || key.includes('auth')
      );

      if (remainingKeys.length > 0) {
        console.warn('⚠️ Warning: Some auth keys still remain:', remainingKeys);
        // Force remove any remaining keys
        remainingKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
            console.log('🗑️ Force removed:', key);
          } catch (e) {
            console.error('❌ Failed to force remove:', key, e);
          }
        });
      }

      // 10. Wait a moment for all async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('✅ Logout process completed, redirecting to home');

      // 11. Force a complete page refresh to ensure clean state
      // This prevents any remaining JavaScript state from persisting
      window.location.replace('/');

      return { success: true };
    } catch (err) {
      console.error('❌ Critical error in logout process:', err);

      // Emergency logout: Force clear everything and redirect
      try {
        // Emergency localStorage clear
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(key => {
          if (key.includes('sb-') || key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });

        // Emergency session clear
        sessionStorage.clear();

        console.log('🚨 Emergency logout completed');
      } catch (emergencyError) {
        console.error('🚨 Emergency logout also failed:', emergencyError);
      }

      // Force redirect regardless of errors
      window.location.replace('/');

      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Function to update terms acceptance status
  const updateTermsAcceptance = async (accepted = true) => {
    if (!user) return false;

    try {
      // Update in database
      const success = await UserTerms.updateTermsAcceptance(user.id, accepted);

      if (success) {
        // Update local state immediately to prevent flickering of terms dialog
        setProfile(prev => ({
          ...prev,
          terms_accepted: accepted
        }));
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error updating terms acceptance:", err);
      return false;
    }
  };

  // Enhanced PWA session management
  const checkIfPWA = () => {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      document.referrer.includes('android-app://');
  };

  const shouldExtendSession = () => {
    const isPWA = checkIfPWA();
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return isPWA || isMobile;
  };

  const getSessionDuration = () => {
    if (shouldExtendSession()) {
      return 24 * 60 * 60 * 1000; // 24 hours for PWA/mobile
    }
    return 2 * 60 * 60 * 1000; // 2 hours for desktop
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAdmin,
        isMentor,
        isStudent,
        userRole,
        profile,
        isProfileComplete,
        hasAcceptedTermsOfService,
        updateTermsAcceptance,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        handleUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
