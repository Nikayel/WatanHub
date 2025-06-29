import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Monitor, Share, Plus } from 'lucide-react';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [deviceType, setDeviceType] = useState('unknown');
    const [installInstructions, setInstallInstructions] = useState(null);

    useEffect(() => {
        // Check if already installed
        const checkInstalled = () => {
            if (window.matchMedia('(display-mode: standalone)').matches) {
                setIsInstalled(true);
                return;
            }

            if (window.navigator.standalone === true) {
                setIsInstalled(true);
                return;
            }
        };

        // Detect device type and set appropriate instructions
        const detectDevice = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const isIOS = /iphone|ipad|ipod/.test(userAgent);
            const isAndroid = /android/.test(userAgent);
            const isDesktop = !isIOS && !isAndroid;

            if (isIOS) {
                setDeviceType('ios');
                setInstallInstructions({
                    title: 'Install WatanHub on iOS',
                    steps: [
                        'Tap the Share button below',
                        'Scroll down and tap "Add to Home Screen"',
                        'Tap "Add" to install the app'
                    ],
                    icon: <Share className="h-5 w-5" />
                });
            } else if (isAndroid) {
                setDeviceType('android');
                setInstallInstructions({
                    title: 'Install WatanHub on Android',
                    steps: [
                        'Tap the menu button (⋮) in your browser',
                        'Select "Add to Home screen" or "Install app"',
                        'Tap "Add" or "Install" to confirm'
                    ],
                    icon: <Download className="h-5 w-5" />
                });
            } else {
                setDeviceType('desktop');
                setInstallInstructions({
                    title: 'Install WatanHub on Desktop',
                    steps: [
                        'Look for the install icon in your address bar',
                        'Click "Install" when prompted',
                        'The app will be added to your applications'
                    ],
                    icon: <Monitor className="h-5 w-5" />
                });
            }
        };

        checkInstalled();
        detectDevice();

        // Listen for the beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Show prompt after a delay if not installed
            setTimeout(() => {
                if (!isInstalled) {
                    setShowPrompt(true);
                }
            }, 5000); // Show after 5 seconds
        };

        // Listen for successful installation
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);

            // Show success message
            if (window.gtag) {
                window.gtag('event', 'pwa_install', {
                    event_category: 'PWA',
                    event_label: 'Installed Successfully'
                });
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, [isInstalled]);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();

            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }

            setDeferredPrompt(null);
            setShowPrompt(false);
        } else if (deviceType === 'ios' || deviceType === 'android') {
            // Show manual installation instructions
            setShowPrompt(true);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        // Don't show again for this session
        sessionStorage.setItem('pwa-prompt-dismissed', 'true');
    };

    // Don't show if already installed or dismissed
    if (isInstalled || sessionStorage.getItem('pwa-prompt-dismissed')) {
        return null;
    }

    return (
        <>
            {/* Floating Install Button */}
            {!showPrompt && (deferredPrompt || deviceType !== 'unknown') && (
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 3, duration: 0.5 }}
                    className="fixed bottom-4 right-4 z-50"
                >
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleInstallClick}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                        <Download className="h-5 w-5" />
                        <span className="hidden sm:inline text-sm font-medium">Install App</span>
                    </motion.button>
                </motion.div>
            )}

            {/* Install Prompt Modal */}
            <AnimatePresence>
                {showPrompt && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4"
                            onClick={handleDismiss}
                        >
                            {/* Modal */}
                            <motion.div
                                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                                transition={{ type: "spring", damping: 25, stiffness: 500 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden"
                            >
                                {/* Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative">
                                    <button
                                        onClick={handleDismiss}
                                        className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>

                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white bg-opacity-20 rounded-full">
                                            <Smartphone className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold">Install WatanHub</h3>
                                            <p className="text-blue-100 text-sm">Access faster, work offline</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="text-center mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                                            <img
                                                src="/web-app-manifest-192x192.png"
                                                alt="WatanHub"
                                                className="w-10 h-10 rounded-lg"
                                            />
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                            Get the WatanHub App
                                        </h4>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                                            Install our app for faster access, offline support, and a native experience.
                                        </p>
                                    </div>

                                    {/* Features */}
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="text-green-500 mb-1">⚡</div>
                                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Faster Loading</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="text-blue-500 mb-1">📱</div>
                                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Native Feel</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="text-purple-500 mb-1">🔔</div>
                                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Push Notifications</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="text-orange-500 mb-1">📴</div>
                                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Offline Access</div>
                                        </div>
                                    </div>

                                    {/* Installation Instructions */}
                                    {installInstructions && (
                                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                                            <div className="flex items-center gap-2 mb-3">
                                                {installInstructions.icon}
                                                <h5 className="font-medium text-gray-900 dark:text-white">
                                                    {installInstructions.title}
                                                </h5>
                                            </div>
                                            <ol className="space-y-2">
                                                {installInstructions.steps.map((step, index) => (
                                                    <li key={index} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                                                            {index + 1}
                                                        </span>
                                                        <span>{step}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-3">
                                        {deferredPrompt ? (
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleInstallClick}
                                                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all"
                                            >
                                                <Download className="h-4 w-4" />
                                                Install Now
                                            </motion.button>
                                        ) : (
                                            <div className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 py-3 px-4 rounded-lg font-medium text-center">
                                                Follow steps above
                                            </div>
                                        )}

                                        <button
                                            onClick={handleDismiss}
                                            className="px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                        >
                                            Maybe Later
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default PWAInstallPrompt; 