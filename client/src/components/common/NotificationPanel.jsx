import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    X,
    Download,
    Users,
    Calendar,
    Award,
    ChevronDown,
    ChevronUp,
    Sparkles
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

const NotificationPanel = ({ fellowshipInfo }) => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if (user) {
            // Create notifications for logged-in users
            const userNotifications = [];

            // Fellowship notification
            if (fellowshipInfo) {
                userNotifications.push({
                    id: 'fellowship',
                    type: 'fellowship',
                    title: 'Fellowship Program Available',
                    message: `Join our ${fellowshipInfo.start_date} cohort and accelerate your academic journey.`,
                    icon: Award,
                    color: 'blue',
                    action: () => window.open('/fellowship', '_blank'),
                    actionText: 'Learn More'
                });
            }

            // PWA Install notification (only show if not already installed)
            if (!window.matchMedia('(display-mode: standalone)').matches) {
                userNotifications.push({
                    id: 'pwa-install',
                    type: 'pwa',
                    title: 'Install WatanHub App',
                    message: 'Get faster access and offline features by installing our app.',
                    icon: Download,
                    color: 'green',
                    action: () => {
                        // Trigger PWA install prompt
                        const event = new CustomEvent('pwa-install-prompt');
                        window.dispatchEvent(event);
                    },
                    actionText: 'Install App'
                });
            }

            // Community notification
            userNotifications.push({
                id: 'community',
                type: 'community',
                title: 'Join Our Community',
                message: 'Connect with fellow students and mentors in our growing network.',
                icon: Users,
                color: 'purple',
                action: () => window.open('/get-involved', '_blank'),
                actionText: 'Get Involved'
            });

            setNotifications(userNotifications);
            setHasUnread(userNotifications.length > 0);
        }
    }, [user, fellowshipInfo]);

    const dismissNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        // Store dismissed notifications in localStorage
        const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        dismissed.push(id);
        localStorage.setItem('dismissed_notifications', JSON.stringify(dismissed));

        // Update unread status
        setHasUnread(notifications.filter(n => n.id !== id).length > 0);
    };

    const dismissAll = () => {
        const allIds = notifications.map(n => n.id);
        const dismissed = JSON.parse(localStorage.getItem('dismissed_notifications') || '[]');
        localStorage.setItem('dismissed_notifications', JSON.stringify([...dismissed, ...allIds]));
        setNotifications([]);
        setHasUnread(false);
        setIsOpen(false);
    };

    // Don't show notification panel if user is not logged in
    if (!user || notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50">
            {/* Notification Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
            >
                <Bell className="w-5 h-5 text-gray-600" />
                {hasUnread && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
            </button>

            {/* Notification Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-16 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 flex items-center">
                                    <Sparkles className="w-4 h-4 mr-2 text-blue-600" />
                                    Notifications
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={dismissAll}
                                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-white/50"
                                    >
                                        Clear All
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1 hover:bg-white/50 rounded-full"
                                    >
                                        <X className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.map((notification) => {
                                const IconComponent = notification.icon;
                                const colorClasses = {
                                    blue: 'bg-blue-100 text-blue-600',
                                    green: 'bg-green-100 text-green-600',
                                    purple: 'bg-purple-100 text-purple-600',
                                    yellow: 'bg-yellow-100 text-yellow-600'
                                };

                                return (
                                    <motion.div
                                        key={notification.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className={`p-2 rounded-lg ${colorClasses[notification.color]}`}>
                                                <IconComponent className="w-4 h-4" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <h4 className="font-medium text-gray-900 text-sm">
                                                        {notification.title}
                                                    </h4>
                                                    <button
                                                        onClick={() => dismissNotification(notification.id)}
                                                        className="p-1 hover:bg-gray-200 rounded-full ml-2"
                                                    >
                                                        <X className="w-3 h-3 text-gray-400" />
                                                    </button>
                                                </div>

                                                <p className="text-gray-600 text-xs mt-1 leading-relaxed">
                                                    {notification.message}
                                                </p>

                                                {notification.action && (
                                                    <button
                                                        onClick={notification.action}
                                                        className={`mt-2 text-xs font-medium px-3 py-1 rounded-full transition-colors ${notification.color === 'blue' ? 'bg-blue-600 hover:bg-blue-700 text-white' :
                                                                notification.color === 'green' ? 'bg-green-600 hover:bg-green-700 text-white' :
                                                                    notification.color === 'purple' ? 'bg-purple-600 hover:bg-purple-700 text-white' :
                                                                        'bg-yellow-600 hover:bg-yellow-700 text-white'
                                                            }`}
                                                    >
                                                        {notification.actionText}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-gray-50 text-center">
                            <p className="text-xs text-gray-500">
                                Stay updated with WatanHub notifications
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationPanel; 