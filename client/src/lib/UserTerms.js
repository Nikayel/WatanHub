import { supabase } from './supabase';

/**
 * Check if a user has accepted the terms of service
 * @param {string} userId - The user's ID
 * @returns {Promise<boolean>} - Whether the user has accepted the terms
 */
export const hasAcceptedTerms = async (userId) => {
    try {
        if (!userId) return false;

        const { data, error } = await supabase
            .from('profiles')
            .select('terms_accepted')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error checking terms acceptance:', error);
            return false;
        }

        // Check explicitly for true value, treating null or undefined as false
        return data?.terms_accepted === true;
    } catch (err) {
        console.error('Error checking terms acceptance:', err);
        return false;
    }
};

/**
 * Update a user's terms acceptance status
 * @param {string} userId - The user's ID
 * @param {boolean} accepted - Whether the user has accepted the terms
 * @returns {Promise<boolean>} - Whether the update was successful
 */
export const updateTermsAcceptance = async (userId, accepted = true) => {
    try {
        if (!userId) return false;

        console.log(`Updating terms acceptance for user ${userId} to ${accepted}`);

        const { data, error } = await supabase
            .from('profiles')
            .update({ terms_accepted: accepted })
            .eq('id', userId)
            .select();

        if (error) {
            console.error('Error updating terms acceptance:', error);
            return false;
        }

        console.log('Terms acceptance updated successfully:', data);
        return true;
    } catch (err) {
        console.error('Error updating terms acceptance:', err);
        return false;
    }
};

/**
 * Show a terms of service acceptance modal if the user hasn't accepted the terms
 * @param {string} userId - The user's ID
 * @param {Function} showModal - Function to show the modal
 * @returns {Promise<void>}
 */
export const checkAndShowTermsModal = async (userId, showModal) => {
    if (!userId || typeof showModal !== 'function') return;

    const accepted = await hasAcceptedTerms(userId);
    if (!accepted) {
        showModal();
    }
}; 