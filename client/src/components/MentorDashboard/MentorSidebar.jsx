import React from 'react';
import {
    Users,
    School,
    Trophy,
    BarChart3,
    FileText,
    Calendar,
    UserCheck
} from 'lucide-react';

const MentorSidebar = ({
    activeTab,
    setActiveTab,
    subTab,
    setSubTab,
    students,
    stats
}) => {
    const mainTabs = [
        {
            key: 'students',
            label: 'Students',
            icon: Users,
            count: students.length,
            subTabs: [
                { key: 'list', label: 'Student List', icon: Users },
                { key: 'notes', label: 'Notes & Tasks', icon: FileText },
                { key: 'meetings', label: 'Meetings', icon: Calendar }
            ]
        },
        {
            key: 'schools',
            label: 'School Choices',
            icon: School,
            subTabs: [
                { key: 'overview', label: 'Overview', icon: School }
            ]
        },
        {
            key: 'outcomes',
            label: 'Outcomes',
            icon: Trophy,
            subTabs: [
                { key: 'admissions', label: 'Admissions', icon: Trophy }
            ]
        }
    ];

    return (
        <div className="bg-white rounded-xl shadow-md p-6 h-fit">
            <h2 className="text-lg font-bold mb-6 text-gray-800">Dashboard</h2>

            {/* Main Navigation */}
            <div className="space-y-2">
                {mainTabs.map((tab) => (
                    <div key={tab.key}>
                        {/* Main Tab */}
                        <button
                            onClick={() => {
                                setActiveTab(tab.key);
                                if (tab.subTabs.length > 0) {
                                    setSubTab(tab.subTabs[0].key);
                                }
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${activeTab === tab.key
                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center">
                                <tab.icon className="h-4 w-4 mr-3" />
                                <span className="font-medium">{tab.label}</span>
                            </div>
                            {tab.count !== undefined && (
                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                    {tab.count}
                                </span>
                            )}
                        </button>

                        {/* Sub Tabs */}
                        {activeTab === tab.key && tab.subTabs && (
                            <div className="ml-4 mt-2 space-y-1">
                                {tab.subTabs.map((subTabItem) => (
                                    <button
                                        key={subTabItem.key}
                                        onClick={() => setSubTab(subTabItem.key)}
                                        className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${subTab === subTabItem.key
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        <subTabItem.icon className="h-3.5 w-3.5 mr-2" />
                                        {subTabItem.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Quick Stats */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-600 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Students</span>
                        <span className="text-sm font-medium text-gray-800">{students.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Meetings</span>
                        <span className="text-sm font-medium text-gray-800">{stats.totalMeetings || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Notes</span>
                        <span className="text-sm font-medium text-gray-800">{stats.notesMade || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentorSidebar; 