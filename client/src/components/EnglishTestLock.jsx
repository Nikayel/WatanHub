import React from 'react';
import { Lock, AlertTriangle, Clock } from 'lucide-react';

const EnglishTestLock = ({ isStudent = false, isMentor = false, isAdmin = false }) => {
    // For now, always show as locked since the feature isn't implemented yet
    const isLocked = true;

    // For students viewing their own test access
    if (isStudent) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-medium text-gray-900">English Test Access</h4>
                        <div className="text-sm text-red-600">
                            <div className="flex items-center space-x-1">
                                <AlertTriangle className="h-4 w-4" />
                                <span>Access Locked - Contact your mentor</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                    </div>
                </div>
            </div>
        );
    }

    // For mentors/admins managing student test access
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <Lock className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900">English Test Access</h4>
                        <div className="text-sm text-red-600">
                            Feature Coming Soon - Currently Locked
                        </div>
                    </div>
                </div>

                <div className="flex space-x-2">
                    <button
                        disabled={true}
                        className="px-3 py-1.5 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed text-sm"
                    >
                        Grant Access (Coming Soon)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnglishTestLock; 