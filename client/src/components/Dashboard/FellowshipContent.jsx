import React from 'react';
import {
    User,
    CheckSquare,
    CheckCircle,
    Clock,
    Calendar,
    MessageSquare,
    BookMarked
} from 'lucide-react';

const FellowshipContent = ({
    subTab,
    assignedMentor,
    mentorNotes,
    acknowledgeNote,
    formatDate,
    getDaysRemaining
}) => {
    return (
        <div className="lg:col-span-3">
            {/* Assignments Tab */}
            {subTab === 'assignments' && (
                <>
                    {assignedMentor ? (
                        <>
                            {/* Mentor Information */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                        {assignedMentor.profile_picture_url ? (
                                            <img
                                                src={assignedMentor.profile_picture_url}
                                                alt={`${assignedMentor.first_name} ${assignedMentor.last_name}`}
                                                className="w-16 h-16 rounded-full object-cover"
                                            />
                                        ) : (
                                            <User size={32} className="text-indigo-600" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">
                                            Your Mentor: {assignedMentor.first_name} {assignedMentor.last_name}
                                        </h3>
                                        <p className="text-sm text-gray-600">{assignedMentor.specialization}</p>
                                        {assignedMentor.whatsapp_number && (
                                            <a
                                                href={`https://wa.me/${assignedMentor.whatsapp_number}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-sm text-green-600 hover:text-green-700 mt-2"
                                            >
                                                <MessageSquare size={14} className="mr-1" />
                                                Chat on WhatsApp
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Tasks List */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                    <CheckSquare size={20} className="mr-2 text-indigo-600" />
                                    Your Assignments ({mentorNotes.length})
                                </h3>

                                {mentorNotes.length === 0 ? (
                                    <div className="text-center py-8">
                                        <CheckSquare size={48} className="mx-auto text-gray-300 mb-4" />
                                        <h4 className="text-lg font-medium text-gray-500 mb-2">No assignments yet</h4>
                                        <p className="text-gray-400">Your mentor will send you tasks to help with your applications</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {mentorNotes.map((note) => (
                                            <div key={note.id} className={`p-4 rounded-lg border-2 ${note.acknowledged
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-blue-50 border-blue-200'
                                                }`}>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold text-gray-800 mb-2">{note.task}</h4>
                                                        <p className="text-gray-700 mb-3">{note.note}</p>

                                                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                                                            <span className="flex items-center">
                                                                <Calendar size={14} className="mr-1" />
                                                                {formatDate(note.created_at)}
                                                            </span>
                                                            {note.deadline && (
                                                                <span className={`flex items-center ${getDaysRemaining(note.deadline) <= 3 ? 'text-red-600' : 'text-amber-600'
                                                                    }`}>
                                                                    <Clock size={14} className="mr-1" />
                                                                    Due: {formatDate(note.deadline)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="ml-4">
                                                        {note.acknowledged ? (
                                                            <div className="flex items-center text-green-600">
                                                                <CheckCircle size={20} className="mr-2" />
                                                                <span className="text-sm font-medium">Completed</span>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => acknowledgeNote(note.id)}
                                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                            >
                                                                Mark Complete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                            <User size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Mentor Assigned Yet</h3>
                            <p className="text-gray-600 mb-4">
                                We're working to connect you with the perfect mentor for your journey.
                            </p>
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-blue-800 mb-2">
                                    <strong>Need help or have questions?</strong>
                                </p>
                                <p className="text-sm text-blue-700">
                                    Please email us at{' '}
                                    <a
                                        href="mailto:watan8681@gmail.com"
                                        className="font-medium underline hover:text-blue-800"
                                    >
                                        watan8681@gmail.com
                                    </a>
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    We're here to help while we match you with a mentor!
                                </p>
                            </div>
                            <p className="text-sm text-gray-500">
                                You'll receive an email notification once a mentor is assigned to you.
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Courses Tab */}
            {subTab === 'courses' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                    <BookMarked size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Courses Coming Soon</h3>
                    <p className="text-gray-600 mb-4">
                        We're preparing comprehensive courses to help you with your fellowship applications.
                    </p>
                    <p className="text-sm text-gray-500">
                        This section will include video lessons, practice exercises, and expert guidance.
                    </p>
                </div>
            )}
        </div>
    );
};

export default FellowshipContent; 