import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

function MentorRoute({ children }) {
    const { user, loading } = useAuth();
    const [isMentor, setIsMentor] = useState(false);
    const [checkingMentor, setCheckingMentor] = useState(true);

    useEffect(() => {
        const checkMentor = async () => {
            if (!user) {
                setCheckingMentor(false);
                return;
            }

            const { data, error } = await supabase
                .from('mentorapplications')
                .select('*')
                .eq('email', user.email)
                .eq('status', 'approved')
                .single();

            if (data) {
                setIsMentor(true);
            }

            setCheckingMentor(false);
        };

        checkMentor();
    }, [user]);

    if (loading || checkingMentor) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (!isMentor) {
        return <Navigate to="/" />;
    }

    return children;
}

export default MentorRoute; 