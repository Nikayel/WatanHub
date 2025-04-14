import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Get the session from local storage
        const fetchSession = async () => {
            const { data, error } = await supabase.auth.getSession();
            setUser(data?.session?.user ?? null);
            setLoading(false);
        };

        fetchSession();

        // Listen for changes to auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Sign up with email and password
    // Sign up with email and password
    const signUp = async (email, password, firstName, lastName) => {
        try {
          setLoading(true);
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {  // Add metadata
                first_name: firstName,
                last_name: lastName
              }
            }
          });
      
          if (error) throw error;
          return { data, error };
        } catch (error) {
          console.error("Signup error:", {
            message: error.message,
            code: error.code,
            details: error.details
          });
          return { data: null, error };
        } finally {
          setLoading(false);
        }
      };
  

    // Sign in with email and password
    const signIn = async (email, password) => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Sign in with Google
    const signInWithGoogle = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });
            if (error) throw error;
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Sign out
    const signOut = async () => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                signUp,
                signIn,
                signInWithGoogle,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
}; 