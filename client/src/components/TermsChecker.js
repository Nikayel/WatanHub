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
    const { user, hasAcceptedTermsOfService } = useAuth();
    const [showTerms, setShowTerms] = useState(false);

    useEffect(() => {
        // Only show terms dialog if user is logged in and hasn't accepted terms
        if (user && hasAcceptedTermsOfService === false) {
            console.log('User has not accepted terms, showing dialog');
            setShowTerms(true);
        } else if (hasAcceptedTermsOfService === true) {
            // Make sure dialog is closed when terms are accepted
            setShowTerms(false);
        }
    }, [user, hasAcceptedTermsOfService]);

    const handleCloseTerms = () => {
        // We'll allow closing only if terms have been accepted
        // This gets called from TermsDialog when acceptance is successful
        console.log('Closing terms dialog');
        setShowTerms(false);
    };

    // Only render if we have a logged-in user who hasn't accepted terms
    if (!user || hasAcceptedTermsOfService !== false) {
        return null;
    }

    return <TermsDialog isOpen={showTerms} onClose={handleCloseTerms} />;
};

export default TermsChecker; 