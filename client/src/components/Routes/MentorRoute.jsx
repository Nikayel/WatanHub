import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

function MentorRoute({ children }) {
    const { user, loading, isMentor } = useAuth();
    const [checkingMentor, setCheckingMentor] = useState(true);

    useEffect(() => {
        const checkMentor = async () => {
            if (!user) {
                setCheckingMentor(false);
                return;
            }

            // We now use the mentorapplications table to determine if someone is a mentor
            const { data, error } = await supabase
                .from('mentorapplications')
                .select('*')
                .eq('email', user.email)
                .eq('status', 'approved')
                .single();

            setCheckingMentor(false);
        };

        if (loading) {
            return;
        }

        // Use isMentor from AuthContext directly, but also double-check
        if (!isMentor) {
            checkMentor();
        } else {
            setCheckingMentor(false);
        }
    }, [user, loading, isMentor]);

    if (loading || checkingMentor) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (!isMentor) {
        return <Navigate to="/" />;
    }

    // Return the children as is to preserve the router context
    return children;
}

export default MentorRoute; 