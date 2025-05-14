import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from './ui/dialog';
import { FileText, Check } from 'lucide-react';

/**
 * A dialog component that shows the Terms of Service and Privacy Policy
 * and allows users to accept them.
 */
const TermsDialog = ({ isOpen, onClose }) => {
    const { user, handleUserProfile, updateTermsAcceptance } = useAuth();
    const [loading, setLoading] = useState(false);
    const [accepted, setAccepted] = useState(false);

    const handleAccept = async () => {
        if (!user || !accepted) return;

        setLoading(true);
        try {
            const success = await updateTermsAcceptance(true);
            if (success) {
                toast.success('Terms of Service accepted');
                onClose();
            } else {
                toast.error('Failed to update terms acceptance');
            }
        } catch (error) {
            console.error('Error accepting terms:', error);
            toast.error('An error occurred while accepting terms');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;

        if (accepted) {
            onClose();
        } else {
            toast.info("Please accept the terms to continue using the platform");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose} onEscapeKeyDown={(e) => !accepted && e.preventDefault()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center text-xl font-semibold">
                        <FileText className="mr-2 h-5 w-5 text-indigo-600" />
                        Terms of Service & Privacy Policy
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    <div className="border rounded-md p-4 bg-gray-50">
                        <h3 className="font-medium text-gray-900 mb-2">Terms of Service Summary</h3>
                        <p className="text-sm text-gray-600 mb-2">
                            By accepting these terms, you agree to use WatanHub in accordance with our guidelines and policies. WatanHub provides educational mentoring services, and all users must behave respectfully.
                        </p>
                        <Link
                            to="/terms"
                            target="_blank"
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            Read full Terms of Service
                        </Link>
                    </div>

                    <div className="border rounded-md p-4 bg-gray-50">
                        <h3 className="font-medium text-gray-900 mb-2">Privacy Policy Summary</h3>
                        <p className="text-sm text-gray-600 mb-2">
                            WatanHub collects personal information to provide and improve our services. Your data is protected and never sold to third parties. We collect data such as your name, email, education information, and mentorship preferences.
                        </p>
                        <Link
                            to="/privacy"
                            target="_blank"
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            Read full Privacy Policy
                        </Link>
                    </div>

                    <div className="flex items-start space-x-3 mt-4">
                        <input
                            type="checkbox"
                            id="acceptTerms"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                            className="mt-1"
                        />
                        <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                            I have read and agree to the Terms of Service and Privacy Policy, and I consent to WatanHub collecting and using my information as described in the Privacy Policy.
                        </label>
                    </div>
                </div>

                <DialogFooter className="mt-6">
                    <button
                        onClick={handleAccept}
                        disabled={loading || !accepted}
                        className={`flex items-center px-4 py-2 rounded-md text-white ${accepted
                            ? 'bg-indigo-600 hover:bg-indigo-700'
                            : 'bg-gray-400 cursor-not-allowed'
                            } transition-colors`}
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin mr-2">⟳</span>
                                Processing...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Accept & Continue
                            </>
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TermsDialog; 