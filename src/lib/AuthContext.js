import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const checkAdmin = async (email) => {
        try {
            const { data, error } = await supabase
                .from('admin')
                .select('email')
                .eq('email', email)
                .single();
    
            if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
                console.error("Admin check error:", error.message);
            }
    
            setIsAdmin(!!data); // true if found, false if not
        } catch (error) {
            console.error('Error checking admin:', error.message);
        }
    };
    
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
                const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
            checkAdmin(currentUser.email); 
        } else {
            setIsAdmin(false); 
        }
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
                isAdmin,
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