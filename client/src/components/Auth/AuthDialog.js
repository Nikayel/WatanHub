import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import Login from './Login';
import SignUp from './SignUp';

const AuthDialog = ({ mode = 'login', trigger }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [authMode, setAuthMode] = useState(mode);

    useEffect(() => {
        if (isOpen) setAuthMode(mode);
    }, [isOpen, mode]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {React.cloneElement(trigger, { onClick: () => setIsOpen(true) })}
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-md md:max-w-lg">
                <div className="px-4 py-6">
                    {authMode === 'login' ? (
                        <Login 
                            onClose={() => setIsOpen(false)}
                            switchToSignup={() => setAuthMode('signup')}
                        />
                    ) : (
                        <SignUp 
                            onClose={() => setIsOpen(false)}
                            switchToLogin={() => setAuthMode('login')}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default AuthDialog;