import React, { useState, useEffect } from 'react';
import {
    BookOpen, Download, Play, CheckCircle, Star, Trophy,
    Target, Users, Calendar, Bell, Wifi, WifiOff,
    Award, Zap, Clock, BarChart3, Globe
} from 'lucide-react';
import { toast } from 'sonner';

const OfflineFellowshipContent = ({ isOnline, userProgress = {} }) => {
    const [cachedContent, setCachedContent] = useState([]);
    const [downloadProgress, setDownloadProgress] = useState({});
    const [userAchievements, setUserAchievements] = useState([]);
    const [streakCount, setStreakCount] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);
    const [currentLevel, setCurrentLevel] = useState(1);

    // Sample fellowship content structure
    const fellowshipModules = [
        {
            id: 1,
            title: 'Personal Statement Development',
            description: 'Craft compelling personal statements that showcase your unique story and aspirations.',
            progress: 0,
            totalLessons: 8,
            estimatedTime: '2-3 weeks',
            difficulty: 'Beginner',
            category: 'Writing',
            content: [
                {
                    id: 'ps1',
                    title: 'Understanding Your Audience',
                    type: 'video',
                    duration: '15 min',
                    completed: false,
                    description: 'Learn who reads your personal statement and what they\'re looking for.'
                },
                {
                    id: 'ps2',
                    title: 'Brainstorming Your Story',
                    type: 'interactive',
                    duration: '30 min',
                    completed: false,
                    description: 'Discover your unique experiences and how to present them effectively.'
                },
                {
                    id: 'ps3',
                    title: 'Structure and Flow',
                    type: 'article',
                    duration: '20 min',
                    completed: false,
                    description: 'Master the art of organizing your thoughts for maximum impact.'
                },
                {
                    id: 'ps4',
                    title: 'Writing Workshop',
                    type: 'assignment',
                    duration: '2 hours',
                    completed: false,
                    description: 'Practice writing with guided prompts and peer feedback.'
                }
            ]
        },
        {
            id: 2,
            title: 'College Application Strategy',
            description: 'Develop a comprehensive approach to college applications and admissions.',
            progress: 0,
            totalLessons: 12,
            estimatedTime: '4-5 weeks',
            difficulty: 'Intermediate',
            category: 'Strategy',
            content: [
                {
                    id: 'cas1',
                    title: 'Research and School Selection',
                    type: 'video',
                    duration: '25 min',
                    completed: false,
                    description: 'Learn how to research and select schools that align with your goals.'
                },
                {
                    id: 'cas2',
                    title: 'Application Timeline',
                    type: 'interactive',
                    duration: '45 min',
                    completed: false,
                    description: 'Create a personalized timeline for your application process.'
                },
                {
                    id: 'cas3',
                    title: 'Letters of Recommendation',
                    type: 'article',
                    duration: '15 min',
                    completed: false,
                    description: 'Understand how to request and manage recommendation letters.'
                }
            ]
        },
        {
            id: 3,
            title: 'Interview Preparation',
            description: 'Master college and scholarship interviews with confidence and authenticity.',
            progress: 0,
            totalLessons: 6,
            estimatedTime: '1-2 weeks',
            difficulty: 'Advanced',
            category: 'Communication',
            content: [
                {
                    id: 'ip1',
                    title: 'Common Interview Questions',
                    type: 'video',
                    duration: '20 min',
                    completed: false,
                    description: 'Prepare for the most frequently asked interview questions.'
                },
                {
                    id: 'ip2',
                    title: 'Body Language and Presentation',
                    type: 'interactive',
                    duration: '30 min',
                    completed: false,
                    description: 'Learn to project confidence through your physical presence.'
                },
                {
                    id: 'ip3',
                    title: 'Practice Interview Recording',
                    type: 'video',
                    duration: '45 min',
                    completed: false,
                    requirements: ['5-minute introduction', 'Q&A simulation'],
                    description: 'Record practice interviews to review and improve your performance.'
                }
            ]
        }
    ];

    // Achievement system
    const achievements = [
        { id: 'first-module', title: 'Getting Started', description: 'Complete your first module', icon: '🎯', points: 50 },
        { id: 'streak-7', title: 'Week Warrior', description: '7-day learning streak', icon: '🔥', points: 100 },
        { id: 'quiz-master', title: 'Quiz Master', description: 'Score 100% on any quiz', icon: '🧠', points: 75 },
        { id: 'early-bird', title: 'Early Bird', description: 'Complete lesson before 9 AM', icon: '🌅', points: 25 },
        { id: 'night-owl', title: 'Night Owl', description: 'Complete lesson after 10 PM', icon: '🦉', points: 25 },
        { id: 'speed-runner', title: 'Speed Runner', description: 'Complete module in half estimated time', icon: '⚡', points: 150 },
        { id: 'perfectionist', title: 'Perfectionist', description: 'Complete all assignments with 100%', icon: '💎', points: 200 },
        { id: 'offline-warrior', title: 'Offline Warrior', description: 'Complete 5 modules offline', icon: '📡', points: 300 }
    ];

    useEffect(() => {
        loadCachedContent();
        loadUserProgress();
    }, []);

    const loadCachedContent = () => {
        // Load cached content from localStorage/IndexedDB
        const cached = localStorage.getItem('fellowship-offline-content');
        if (cached) {
            setCachedContent(JSON.parse(cached));
        }
    };

    const loadUserProgress = () => {
        // Load user progress, achievements, and gamification data
        const progress = localStorage.getItem('fellowship-user-progress');
        if (progress) {
            const data = JSON.parse(progress);
            setUserAchievements(data.achievements || []);
            setStreakCount(data.streakCount || 0);
            setTotalPoints(data.totalPoints || 0);
            setCurrentLevel(Math.floor(data.totalPoints / 500) + 1);
        }
    };

    const downloadModule = async (moduleId) => {
        const module = fellowshipModules.find(m => m.id === moduleId);
        if (!module) return;

        setDownloadProgress(prev => ({ ...prev, [moduleId]: 0 }));

        try {
            // Simulate progressive download with service worker caching
            const totalItems = [
                ...module.content.map(c => c.id),
            ];

            for (let i = 0; i < totalItems.length; i++) {
                // Simulate download delay
                await new Promise(resolve => setTimeout(resolve, 500));

                const progress = Math.round(((i + 1) / totalItems.length) * 100);
                setDownloadProgress(prev => ({ ...prev, [moduleId]: progress }));

                // Cache content using service worker
                if ('serviceWorker' in navigator) {
                    try {
                        const sw = await navigator.serviceWorker.ready;
                        sw.active?.postMessage({
                            type: 'CACHE_FELLOWSHIP_CONTENT',
                            data: { item: totalItems[i], moduleId }
                        });
                    } catch (error) {
                        console.warn('Failed to cache content:', error);
                    }
                }
            }

            // Mark as downloaded
            const updatedModules = fellowshipModules.map(m =>
                m.id === moduleId ? { ...m, isOfflineAvailable: true } : m
            );

            localStorage.setItem('fellowship-offline-content', JSON.stringify(updatedModules));
            setCachedContent(updatedModules);

            setDownloadProgress(prev => ({ ...prev, [moduleId]: 100 }));
            toast.success(`${module.title} downloaded for offline access!`);

            // Award achievement
            awardAchievement('offline-warrior');

        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Download failed. Please try again.');
            setDownloadProgress(prev => ({ ...prev, [moduleId]: undefined }));
        }
    };

    const awardAchievement = (achievementId) => {
        const achievement = achievements.find(a => a.id === achievementId);
        if (!achievement || userAchievements.includes(achievementId)) return;

        const newAchievements = [...userAchievements, achievementId];
        const newPoints = totalPoints + achievement.points;

        setUserAchievements(newAchievements);
        setTotalPoints(newPoints);
        setCurrentLevel(Math.floor(newPoints / 500) + 1);

        // Save progress
        const progressData = {
            achievements: newAchievements,
            totalPoints: newPoints,
            streakCount,
            lastActivity: Date.now()
        };
        localStorage.setItem('fellowship-user-progress', JSON.stringify(progressData));

        // Show achievement notification
        toast.success(
            <div className="flex items-center space-x-2">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                    <div className="font-medium">Achievement Unlocked!</div>
                    <div className="text-sm">{achievement.title} (+{achievement.points} points)</div>
                </div>
            </div>,
            { duration: 4000 }
        );
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Beginner': return 'bg-green-100 text-green-800';
            case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
            case 'Advanced': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'College Preparation': return <BookOpen className="h-5 w-5" />;
            case 'Financial Aid': return <Target className="h-5 w-5" />;
            case 'Interview Skills': return <Users className="h-5 w-5" />;
            default: return <BookOpen className="h-5 w-5" />;
        }
    };

    return (
        <div className="space-y-4 md:space-y-6">
            {/* Gamification Header - More compact on mobile */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 md:p-6 text-white">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold">Fellowship Journey</h2>
                        <p className="text-indigo-100 text-sm md:text-base">Path to college success</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center space-x-2 mb-1">
                            <Trophy className="h-4 w-4 md:h-5 md:w-5" />
                            <span className="font-semibold text-sm md:text-base">Level {currentLevel}</span>
                        </div>
                        <div className="text-indigo-100 text-xs md:text-sm">{totalPoints} points</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-4">
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                            <Zap className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="font-semibold text-sm md:text-base">{streakCount}</span>
                        </div>
                        <div className="text-xs text-indigo-100">Streak</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                            <Award className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="font-semibold text-sm md:text-base">{userAchievements.length}</span>
                        </div>
                        <div className="text-xs text-indigo-100">Awards</div>
                    </div>
                    <div className="text-center">
                        <div className="flex items-center justify-center space-x-1 mb-1">
                            <BarChart3 className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="font-semibold text-sm md:text-base">
                                {fellowshipModules.filter(m => userProgress[m.id]?.completed).length}
                            </span>
                        </div>
                        <div className="text-xs text-indigo-100">Done</div>
                    </div>
                </div>
            </div>

            {/* Connection Status - More compact */}
            <div className={`flex items-center space-x-2 px-3 md:px-4 py-2 rounded-lg ${isOnline ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                }`}>
                {isOnline ? <Wifi className="h-3 w-3 md:h-4 md:w-4" /> : <WifiOff className="h-3 w-3 md:h-4 md:w-4" />}
                <span className="text-xs md:text-sm font-medium">
                    {isOnline ? 'Online' : 'Offline Mode'}
                </span>
            </div>

            {/* Fellowship Modules - Reduced spacing */}
            <div className="grid gap-4 md:gap-6">
                {fellowshipModules.map((module) => {
                    const isDownloading = downloadProgress[module.id] !== undefined && downloadProgress[module.id] < 100;
                    const isCompleted = userProgress[module.id]?.completed;
                    const canAccess = isOnline || module.isOfflineAvailable;
                    const progress = userProgress[module.id]?.progress || 0;

                    return (
                        <div key={module.id} className={`border rounded-xl p-6 transition-all ${canAccess ? 'bg-white shadow-sm hover:shadow-md' : 'bg-gray-50 opacity-75'
                            }`}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start space-x-3">
                                    <div className={`p-2 rounded-lg ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'
                                        }`}>
                                        {isCompleted ? <CheckCircle className="h-6 w-6" /> : getCategoryIcon(module.category)}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                                        <p className="text-gray-600 text-sm mb-2">{module.description}</p>
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                            <span className={`px-2 py-1 rounded ${getDifficultyColor(module.difficulty)}`}>
                                                {module.difficulty}
                                            </span>
                                            <div className="flex items-center space-x-1">
                                                <Clock className="h-3 w-3" />
                                                <span>{module.estimatedTime}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Star className="h-3 w-3" />
                                                <span>{module.points} points</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col space-y-2">
                                    {!module.isOfflineAvailable && isOnline && (
                                        <button
                                            onClick={() => downloadModule(module.id)}
                                            disabled={isDownloading}
                                            className="flex items-center space-x-2 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                                        >
                                            <Download className="h-4 w-4" />
                                            <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                                        </button>
                                    )}

                                    {module.isOfflineAvailable && (
                                        <div className="flex items-center space-x-1 text-green-600 text-sm">
                                            <CheckCircle className="h-4 w-4" />
                                            <span>Offline Ready</span>
                                        </div>
                                    )}

                                    {!canAccess && (
                                        <div className="flex items-center space-x-1 text-gray-400 text-sm">
                                            <Globe className="h-4 w-4" />
                                            <span>Online Only</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Download Progress */}
                            {isDownloading && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>Downloading content...</span>
                                        <span>{downloadProgress[module.id]}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${downloadProgress[module.id]}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Module Progress */}
                            {progress > 0 && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Content Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                    <Play className="h-4 w-4" />
                                    <span>{module.content.length} Lessons</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <BookOpen className="h-4 w-4" />
                                    <span>{module.content.length} Documents</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Target className="h-4 w-4" />
                                    <span>{module.content.length} Quizzes</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Trophy className="h-4 w-4" />
                                    <span>{module.content.length} Projects</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-between items-center mt-6">
                                <div className="text-sm text-gray-500">
                                    Updated: {new Date(module.lastUpdated).toLocaleDateString()}
                                </div>
                                <div className="space-x-3">
                                    {canAccess ? (
                                        <>
                                            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                                                Preview
                                            </button>
                                            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                                                {isCompleted ? 'Review' : progress > 0 ? 'Continue' : 'Start'}
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-sm text-gray-400">
                                            Available when online
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Recent Achievements */}
            {userAchievements.length > 0 && (
                <div className="bg-white border rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {userAchievements.slice(-4).map(achievementId => {
                            const achievement = achievements.find(a => a.id === achievementId);
                            return (
                                <div key={achievementId} className="text-center p-3 bg-yellow-50 rounded-lg">
                                    <div className="text-2xl mb-2">{achievement.icon}</div>
                                    <div className="font-medium text-sm">{achievement.title}</div>
                                    <div className="text-xs text-gray-600">{achievement.points} pts</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Notification Settings */}
            <div className="bg-white border rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Learning Reminders</h3>
                        <p className="text-gray-600 text-sm">Stay on track with your fellowship journey</p>
                    </div>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors">
                        <Bell className="h-4 w-4" />
                        <span>Configure</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfflineFellowshipContent; 