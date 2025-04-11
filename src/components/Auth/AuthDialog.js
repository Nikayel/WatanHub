import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import Login from './Login';
import SignUp from './SignUp';

export const AuthDialog = ({ mode = 'login', trigger }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [authMode, setAuthMode] = useState(mode);

    const handleToggleMode = () => {
        setAuthMode(authMode === 'login' ? 'signup' : 'login');
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md md:max-w-lg">
                <div className="px-4 py-6">
                    {authMode === 'login' ? (
                        <div className="space-y-4">
                            <Login onClose={handleClose} />
                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    Don't have an account?{' '}
                                    <button
                                        onClick={handleToggleMode}
                                        className="text-primary hover:underline focus:outline-none"
                                    >
                                        Sign up
                                    </button>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <SignUp onClose={handleClose} />
                            <div className="text-center">
                                <p className="text-sm text-gray-600">
                                    Already have an account?{' '}
                                    <button
                                        onClick={handleToggleMode}
                                        className="text-primary hover:underline focus:outline-none"
                                    >
                                        Log in
                                    </button>
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuthDialog; 