import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from './supabase';
import { ROLES, getUserRole, getStudentProfile, getMentorProfile } from './UserRoles';
import * as UserTerms from './UserTerms';

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
    const setupAuthListener = async () => {
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();

        if (data?.session?.user) {
          setUser(data.session.user);
          await handleUserProfile(data.session.user);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              setUser(session.user);
              await handleUserProfile(session.user);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setProfile(null);
              setUserRole(null);
              setIsAdmin(false);
              setIsMentor(false);
              setIsStudent(false);
            }
          }
        );

        return () => {
          subscription?.unsubscribe();
        };
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    setupAuthListener();
  }, []);

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
      console.log('Starting logout process');
      setLoading(true);

      // First clear all React state
      setUser(null);
      setProfile(null);
      setUserRole(null);
      setIsAdmin(false);
      setIsMentor(false);
      setIsStudent(false);
      setHasAcceptedTermsOfService(false);

      // Get the current storage keys before logout
      const storageKeys = Object.keys(localStorage);
      console.log('Storage keys before logout:',
        storageKeys.filter(key => key.startsWith('sb-') || key.includes('supabase'))
      );

      // 1. First attempt global sign out through Supabase
      try {
        console.log('Attempting Supabase global signOut');
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (error) {
          console.error('Error in Supabase signOut:', error);
        }
      } catch (signOutError) {
        console.error("Error during Supabase signOut call:", signOutError);
      }

      // 2. Get and clear the Supabase URL from localStorage keys
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
      const projectRef = supabaseUrl.match(/https:\/\/(.*?)\.supabase/)?.[1] || '';

      if (projectRef) {
        console.log('Removing Supabase storage for project ref:', projectRef);
        // Find the specific Supabase auth key for this project
        const sbKey = `sb-${projectRef}-auth-token`;
        localStorage.removeItem(sbKey);
      }

      // 3. Clear all potential Supabase-related localStorage items
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('sb-') ||
          key.includes('supabase') ||
          key.includes('auth'))
        ) {
          console.log('Removing localStorage key:', key);
          localStorage.removeItem(key);
        }
      }

      // 4. Clear session cookies
      document.cookie.split(";").forEach(function (c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });

      console.log('All auth state cleared, redirecting to home page');

      // 5. Force a hard redirect to the root page, no client-side routing
      // This ensures the app completely reinitializes
      window.location.replace('/');

      return { success: true };
    } catch (err) {
      console.error('Final error in logout process:', err);
      setError(err.message);

      // Even if there's an error, force a logout by reloading
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
