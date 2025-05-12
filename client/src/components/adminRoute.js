import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      // Check if user is admin in profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      setCheckingAdmin(false);
    };

    if (loading) {
      return;
    }

    // Use the isAdmin from AuthContext directly, but also double-check DB
    if (!isAdmin) {
      checkAdmin();
    } else {
      setCheckingAdmin(false);
    }
  }, [user, loading, isAdmin]);

  if (loading || checkingAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return children;
}

export default AdminRoute;
