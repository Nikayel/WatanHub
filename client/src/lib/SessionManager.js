// Advanced Session Management System
import { supabase } from './supabase';
import Logger from '../utils/logger';

class SessionManager {
    constructor() {
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
        this.inactivityTimeout = 8 * 60 * 60 * 1000; // 8 hours of inactivity (much more lenient)
        this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes (more reasonable)
        this.lastActivity = Date.now();
        this.isActive = true;
        this.intervalId = null;
        this.listeners = new Set();
        this.isInitialized = false;
        this.initTime = Date.now(); // Track when session manager was initialized

        this.init();
    }

    init() {
        this.setupActivityTracking();
        this.setupVisibilityTracking();
        this.setupSessionChecking();
        this.setupStorageListener();
        this.setupBeforeUnload();
    }

    // Track user activity
    setupActivityTracking() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        const updateActivity = () => {
            this.lastActivity = Date.now();
            this.saveActivityToStorage();
        };

        events.forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true });
        });
    }

    // Handle tab visibility changes - simplified to avoid conflicts
    setupVisibilityTracking() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isActive = false;
                this.saveActivityToStorage();
                Logger.debug('Tab became hidden, saving activity');
            } else {
                this.isActive = true;
                this.lastActivity = Date.now();
                Logger.debug('Tab became visible, updating activity');
                // REMOVED: Session validation - let other systems handle refresh logic
            }
        });

        // Handle window focus/blur - simplified tracking only
        window.addEventListener('focus', () => {
            this.isActive = true;
            this.lastActivity = Date.now();
        });

        window.addEventListener('blur', () => {
            this.isActive = false;
            this.saveActivityToStorage();
        });
    }

    // Setup periodic session validation
    setupSessionChecking() {
        this.intervalId = setInterval(() => {
            if (this.isActive) {
                this.validateSession();
                this.checkInactivity();
            }
        }, this.checkInterval);
    }

    // Listen for storage changes (multi-tab sync)
    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'watanhub_session_logout') {
                Logger.info('Logout detected in another tab');
                this.handleGlobalLogout();
            } else if (e.key === 'watanhub_last_activity') {
                this.lastActivity = parseInt(e.newValue) || Date.now();
            }
        });
    }

    // Handle page unload
    setupBeforeUnload() {
        window.addEventListener('beforeunload', () => {
            this.saveActivityToStorage();
        });
    }

    // Validate current session with retry logic
    async validateSession(retryCount = 0) {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                Logger.error('Session validation error:', error);

                // Implement retry logic for network errors
                if (retryCount < 2 && (error.message.includes('network') || error.message.includes('fetch'))) {
                    Logger.info(`Retrying session validation (attempt ${retryCount + 1})`);
                    await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                    return this.validateSession(retryCount + 1);
                }

                // Don't immediately trigger logout on validation errors
                this.notifyListeners('session_error', error);
                return false;
            }

            if (!session) {
                Logger.info('No active session found');
                // Only logout if we've been running for a while (not immediately on startup)
                // More conservative check - wait at least 60 seconds after initialization
                const timeSinceInit = this.isInitialized ? Date.now() - this.initTime : 0;
                if (this.isInitialized && timeSinceInit > 60000) {
                    Logger.info('Session expired after grace period, triggering logout');
                    this.notifyListeners('session_expired');
                } else {
                    Logger.info('No session found but within grace period, not logging out');
                }
                return false;
            }

            // Check if session is expired with safety buffer
            const now = Date.now();
            const sessionTime = new Date(session.expires_at).getTime();
            const safetyBuffer = 60 * 1000; // 1 minute buffer for clock differences

            if (sessionTime <= (now - safetyBuffer)) {
                Logger.info('Session expired, forcing logout');
                await this.forceLogout('Session expired');
                return false;
            }

            // Check token expiry (refresh if needed) - more conservative
            const timeUntilExpiry = sessionTime - now;
            if (timeUntilExpiry < 10 * 60 * 1000) { // Less than 10 minutes (increased from 5)
                Logger.info('Token expiring soon, attempting refresh');
                await this.refreshToken();
            }

            // Mark as initialized after first successful validation
            if (!this.isInitialized) {
                this.isInitialized = true;
                this.initTime = Date.now(); // Update init time on successful validation
                Logger.info('Session manager initialized successfully');
            }

            this.notifyListeners('session_valid', session);
            return true;
        } catch (error) {
            Logger.error('Session validation failed:', error);
            // Don't trigger logout on network/connection errors
            this.notifyListeners('session_error', error);
            return false;
        }
    }

    // Check for user inactivity
    checkInactivity() {
        const now = Date.now();
        const timeSinceActivity = now - this.lastActivity;

        // Only check inactivity if we're properly initialized and tab is active
        if (this.isInitialized && this.isActive && timeSinceActivity > this.inactivityTimeout) {
            Logger.info(`User inactive for ${Math.round(timeSinceActivity / (1000 * 60))} minutes, logging out`);
            this.forceLogout('Inactive session timeout');
        }
    }

    // Refresh authentication token
    async refreshToken() {
        try {
            const { data, error } = await supabase.auth.refreshSession();

            if (error) {
                Logger.error('Token refresh failed:', error);
                // Don't immediately logout - just warn and let normal session validation handle it
                this.notifyListeners('token_refresh_failed', error);
                return false;
            }

            Logger.info('Token refreshed successfully');
            this.notifyListeners('token_refreshed', data.session);
            return true;
        } catch (error) {
            Logger.error('Token refresh error:', error);
            // Don't immediately logout on network errors - just warn
            this.notifyListeners('token_refresh_error', error);
            return false;
        }
    }

    // Force logout with reason
    async forceLogout(reason = 'Session ended') {
        try {
            // Add debugging info
            console.log('🚨 FORCE LOGOUT TRIGGERED:', {
                reason,
                lastActivity: new Date(this.lastActivity).toLocaleString(),
                timeSinceActivity: Math.round((Date.now() - this.lastActivity) / (1000 * 60)),
                isActive: this.isActive,
                isInitialized: this.isInitialized,
                inactivityTimeout: Math.round(this.inactivityTimeout / (1000 * 60)),
                stackTrace: new Error().stack
            });

            Logger.info('Force logout initiated:', reason);

            // Signal other tabs
            localStorage.setItem('watanhub_session_logout', Date.now().toString());

            // Clear Supabase session
            await supabase.auth.signOut({ scope: 'global' });

            // Clear all storage
            this.clearAllStorage();

            // Notify listeners
            this.notifyListeners('force_logout', { reason });

            // Redirect to home
            setTimeout(() => {
                window.location.replace('/');
            }, 100);

        } catch (error) {
            Logger.error('Force logout error:', error);
            // Force redirect anyway
            window.location.replace('/');
        }
    }

    // Handle logout detected in another tab
    handleGlobalLogout() {
        this.clearAllStorage();
        this.notifyListeners('global_logout');
        window.location.replace('/');
    }

    // Save activity to localStorage for multi-tab coordination
    saveActivityToStorage() {
        try {
            localStorage.setItem('watanhub_last_activity', this.lastActivity.toString());
        } catch (error) {
            Logger.warn('Failed to save activity to storage:', error);
        }
    }

    // Clear all authentication-related storage
    clearAllStorage() {
        const keysToRemove = [];

        // Collect keys to remove
        for (let sessionIndex = 0; sessionIndex < localStorage.length; sessionIndex++) {
            const key = localStorage.key(sessionIndex);
            if (key && (
                key.startsWith('sb-') ||
                key.includes('supabase') ||
                key.includes('watanhub') ||
                key.includes('auth')
            )) {
                keysToRemove.push(key);
            }
        }

        // Remove collected keys
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });

        // Clear session storage
        sessionStorage.clear();

        // Clear cookies
        document.cookie.split(";").forEach(function (c) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
    }

    // Event listener management
    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                Logger.error('Session listener error:', error);
            }
        });
    }

    // Cleanup
    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.listeners.clear();
    }

    // Get session info
    getSessionInfo() {
        return {
            lastActivity: this.lastActivity,
            isActive: this.isActive,
            timeSinceActivity: Date.now() - this.lastActivity
        };
    }
}

// Create singleton instance
export const sessionManager = new SessionManager();
export default SessionManager; 