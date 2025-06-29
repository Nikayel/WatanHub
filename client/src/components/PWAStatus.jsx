import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Download, Smartphone, Check, AlertCircle } from 'lucide-react';

const PWAStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isInstalled, setIsInstalled] = useState(false);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [showStatus, setShowStatus] = useState(false);

    useEffect(() => {
        // Check if running as PWA
        const checkInstallStatus = () => {
            const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true ||
                document.referrer.includes('android-app://');
            setIsInstalled(isPWA);
        };

        // Online/offline detection
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        // Service worker update detection
        const handleSWUpdate = () => {
            setUpdateAvailable(true);
            setShowStatus(true);
        };

        // PWA installation detection
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowStatus(true);
            setTimeout(() => setShowStatus(false), 3000);
        };

        checkInstallStatus();

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('sw-update-available', handleSWUpdate);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Show status on first load if installed
        if (isInstalled) {
            setShowStatus(true);
            setTimeout(() => setShowStatus(false), 2000);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('sw-update-available', handleSWUpdate);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [isInstalled]);

    const handleUpdateApp = () => {
        window.location.reload();
    };

    const getStatusConfig = () => {
        if (updateAvailable) {
            return {
                icon: <Download className="h-4 w-4" />,
                text: 'Update Available',
                subtext: 'Tap to refresh',
                color: 'bg-blue-500',
                action: handleUpdateApp
            };
        }

        if (!isOnline) {
            return {
                icon: <WifiOff className="h-4 w-4" />,
                text: 'Offline Mode',
                subtext: 'Using cached content',
                color: 'bg-orange-500'
            };
        }

        if (isInstalled) {
            return {
                icon: <Smartphone className="h-4 w-4" />,
                text: 'App Mode',
                subtext: 'Running as installed app',
                color: 'bg-green-500'
            };
        }

        return null;
    };

    const statusConfig = getStatusConfig();

    if (!statusConfig && isOnline) return null;

    return (
        <AnimatePresence>
            {(showStatus || !isOnline || updateAvailable) && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ type: "spring", damping: 25 }}
                    className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50"
                >
                    <motion.div
                        whileHover={{ scale: statusConfig.action ? 1.02 : 1 }}
                        whileTap={{ scale: statusConfig.action ? 0.98 : 1 }}
                        onClick={statusConfig.action}
                        className={`${statusConfig.color} text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium ${statusConfig.action ? 'cursor-pointer hover:shadow-xl' : ''
                            } transition-all duration-200`}
                    >
                        {statusConfig.icon}
                        <div>
                            <div>{statusConfig.text}</div>
                            {statusConfig.subtext && (
                                <div className="text-xs opacity-90">{statusConfig.subtext}</div>
                            )}
                        </div>

                        {/* Online indicator dot */}
                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-300' : 'bg-red-300'} ml-1`}></div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAStatus; 