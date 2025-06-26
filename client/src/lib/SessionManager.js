// Advanced Session Management System
import { supabase } from './supabase';
import Logger from '../utils/logger';

class SessionManager {
    constructor() {
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
        this.inactivityTimeout = 8 * 60 * 60 * 1000; // 8 hours of inactivity (much more lenient)
        this.checkInterval = 60 * 60 * 1000; // Check every 1 hour (much less frequent)
        this.lastActivity = Date.now();
        this.isActive = true;
        this.intervalId = null;
        this.listeners = new Set();
        this.isInitialized = false;

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

    // Handle tab visibility changes
    setupVisibilityTracking() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isActive = false;
                this.saveActivityToStorage();
                Logger.debug('Tab became hidden, pausing session checks');
            } else {
                this.isActive = true;
                this.lastActivity = Date.now();
                Logger.debug('Tab became visible, resuming session checks');
                // Don't validate session on every tab switch - too aggressive
            }
        });

        // Handle window focus/blur - but don't validate session immediately
        window.addEventListener('focus', () => {
            this.isActive = true;
            this.lastActivity = Date.now();
            // Removed automatic session validation on focus
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

    // Validate current session
    async validateSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                Logger.error('Session validation error:', error);
                // Don't immediately trigger logout on validation errors
                this.notifyListeners('session_error', error);
                return false;
            }

            if (!session) {
                Logger.info('No active session found');
                // Only logout if we've been running for a while (not immediately on startup)
                if (this.isInitialized) {
                    this.notifyListeners('session_expired');
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
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
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