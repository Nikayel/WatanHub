import React from 'react';
import { CheckSquare, BookMarked, Users } from 'lucide-react';
import ResumeUpload from '../ResumeUpload';

const FellowshipSidebar = ({
    subTab,
    setSubTab,
    pendingNotes,
    analyticsData,
    assignedMentor
}) => {
    return (
        <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-32">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <Users size={18} className="mr-2 text-indigo-600" />
                    Fellowship
                </h3>

                {/* Vertical tabs for Fellowship */}
                <nav className="space-y-2">
                    <button
                        onClick={() => setSubTab('assignments')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center transition-all ${subTab === 'assignments'
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                            }`}
                    >
                        <CheckSquare size={18} className="mr-3" />
                        <div className="flex-1">
                            <div className="font-medium">Assignments</div>
                            <div className="text-xs text-gray-500">Tasks from your mentor</div>
                        </div>
                        {pendingNotes > 0 && (
                            <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-semibold">
                                {pendingNotes}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setSubTab('courses')}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center transition-all ${subTab === 'courses'
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                            }`}
                    >
                        <BookMarked size={18} className="mr-3" />
                        <div className="flex-1">
                            <div className="font-medium">Courses</div>
                            <div className="text-xs text-gray-500">Learning materials</div>
                        </div>
                    </button>
                </nav>

                {/* Quick Stats in Sidebar */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-3 text-sm">Quick Stats</h4>
                    <div className="space-y-3">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">Profile</span>
                                <span className="text-lg font-bold text-blue-600">{analyticsData.profileCompleteness}%</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${analyticsData.profileCompleteness}%` }}
                                />
                            </div>
                        </div>

                        {assignedMentor && (
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-lg border border-purple-100">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-medium text-gray-700">Tasks</span>
                                    <span className="text-lg font-bold text-purple-600">{pendingNotes}</span>
                                </div>
                                <p className="text-xs text-gray-600">{analyticsData.tasksCompleted} completed</p>
                            </div>
                        )}

                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-3 rounded-lg border border-amber-100">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">Response Time</span>
                                <span className="text-lg font-bold text-amber-600">{analyticsData.avgResponseTime || 0}d</span>
                            </div>
                            <p className="text-xs text-gray-600">Days to complete tasks</p>
                        </div>
                    </div>
                </div>

                {/* Resume Upload in Sidebar */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <ResumeUpload compact={true} showTitle={true} />
                </div>
            </div>
        </div>
    );
};

export default FellowshipSidebar; 