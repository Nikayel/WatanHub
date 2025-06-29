import React, { useState, useEffect } from 'react';
import { RefreshCcw, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { smartRefreshApp, refreshAppCompletely, monitorAppState } from '../utils/serviceWorkerUtils';
import { toast } from 'sonner';

const PWARefreshPrompt = () => {
    const [isStale, setIsStale] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showRefreshPrompt, setShowRefreshPrompt] = useState(false);
    const [lastActivity, setLastActivity] = useState(Date.now());

    useEffect(() => {
        // Track online/offline status
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Track user activity and app visibility
        let activityTimer;
        let staleTimer;

        const resetActivityTimer = () => {
            setLastActivity(Date.now());
            clearTimeout(activityTimer);
            clearTimeout(staleTimer);
            setIsStale(false);
            setShowRefreshPrompt(false);

            // Set activity timer (5 minutes of inactivity)
            activityTimer = setTimeout(() => {
                console.log('User inactive, app may be stale');
                setIsStale(true);
            }, 5 * 60 * 1000); // 5 minutes

            // Set stale timer (15 minutes of inactivity shows refresh prompt)
            staleTimer = setTimeout(() => {
                console.log('App is stale, showing refresh prompt');
                setShowRefreshPrompt(true);
            }, 15 * 60 * 1000); // 15 minutes
        };

        const handleActivity = () => resetActivityTimer();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const timeAway = Date.now() - lastActivity;
                console.log('App became visible, time away:', timeAway / 1000, 'seconds');

                // Only consider stale if away for more than 10 minutes (increased from 2)
                if (timeAway > 10 * 60 * 1000) {
                    setIsStale(true);
                    // Only show refresh prompt if away for more than 20 minutes (increased from 10)
                    if (timeAway > 20 * 60 * 1000) {
                        setShowRefreshPrompt(true);
                    }
                } else {
                    // Reset timers for shorter absences
                    resetActivityTimer();
                }
            }
        };

        // Listen for user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        // Listen for visibility changes
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Initialize timer
        resetActivityTimer();

        // Set up service worker monitoring
        const cleanupMonitoring = monitorAppState();

        // Listen for stale data events from service worker
        const handleStaleData = (event) => {
            console.log('App data detected as stale:', event.detail);
            setIsStale(true);
            setShowRefreshPrompt(true);
        };

        window.addEventListener('app-data-stale', handleStaleData);

        return () => {
            clearTimeout(activityTimer);
            clearTimeout(staleTimer);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('app-data-stale', handleStaleData);
            cleanupMonitoring();
        };
    }, [lastActivity]);

    const handleRefresh = async () => {
        console.log('User initiated refresh');

        try {
            setShowRefreshPrompt(false); // Hide prompt immediately
            toast.loading('Refreshing app data...', { id: 'refresh-toast' });

            // Try smart refresh first
            const result = await smartRefreshApp();

            if (result.refreshed) {
                toast.success('App data refreshed successfully!', { id: 'refresh-toast' });
                setIsStale(false);
                setLastActivity(Date.now());
            } else {
                // If no stale data, do a complete refresh
                toast.loading('Refreshing app completely...', { id: 'refresh-toast' });
                await refreshAppCompletely();
            }
        } catch (error) {
            console.error('Refresh failed:', error);
            toast.error('Refresh failed. Falling back to page reload.', { id: 'refresh-toast' });

            // Fallback to simple page reload
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    };

    const handleDismiss = () => {
        setShowRefreshPrompt(false);
        setIsStale(false);
        setLastActivity(Date.now());
    };

    if (!showRefreshPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-2">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                        {isOnline ? (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                        ) : (
                            <WifiOff className="h-5 w-5 text-red-500" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900">
                            {isOnline ? 'App Data May Be Stale' : 'Connection Lost'}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">
                            {isOnline
                                ? 'You\'ve been away for a while. Refresh to get the latest data.'
                                : 'Please check your internet connection and refresh when online.'
                            }
                        </p>
                        <div className="flex items-center space-x-2 mt-3">
                            <button
                                onClick={handleRefresh}
                                disabled={!isOnline}
                                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isOnline
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <RefreshCcw className="h-3 w-3 mr-1" />
                                Refresh
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-1">
                        {isOnline ? (
                            <Wifi className="h-3 w-3 text-green-500" />
                        ) : (
                            <WifiOff className="h-3 w-3 text-red-500" />
                        )}
                        <span className="text-xs text-gray-500">
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                    <span className="text-xs text-gray-400">
                        {new Date().toLocaleTimeString()}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PWARefreshPrompt; 