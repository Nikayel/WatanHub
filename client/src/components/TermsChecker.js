import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import TermsDialog from './TermsDialog';

/**
 * A component that checks if the user has accepted the terms of service
 * and shows the terms dialog if they haven't.
 * 
 * Place this component in your app layout to ensure terms are checked
 * after login.
 */
const TermsChecker = () => {
    const { user, hasAcceptedTermsOfService, loading } = useAuth();
    const [showTerms, setShowTerms] = useState(false);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // Only run this effect after the auth state has been loaded
        // and only show terms dialog if user is logged in and hasn't accepted terms
        if (!loading) {
            if (user && hasAcceptedTermsOfService === false) {
                console.log('User has not accepted terms, showing dialog');
                setShowTerms(true);
            } else {
                // Make sure dialog is closed when terms are accepted or user is not logged in
                setShowTerms(false);
            }
            setInitialized(true);
        }
    }, [user, hasAcceptedTermsOfService, loading]);

    const handleCloseTerms = () => {
        // We'll allow closing only if terms have been accepted
        // This gets called from TermsDialog when acceptance is successful
        console.log('Closing terms dialog');
        setShowTerms(false);
    };

    // Only render if we have a logged-in user who hasn't accepted terms
    // and we've finished the initial loading of auth state
    if (!initialized || !user || hasAcceptedTermsOfService !== false) {
        return null;
    }

    return <TermsDialog isOpen={showTerms} onClose={handleCloseTerms} />;
};

export default TermsChecker; 