// Advanced Session Management System
import { supabase } from './supabase';
import Logger from '../utils/logger';

class SessionManager {
    constructor() {
        // Enhanced PWA detection and session management
        this.isPWA = this.checkIfPWA();
        this.isMobile = this.checkIfMobile();
        this.shouldExtendSession = this.isPWA || this.isMobile;

        // Dynamic session timeouts based on platform
        this.sessionTimeout = this.shouldExtendSession ? 24 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000; // 24h for PWA/mobile, 4h for desktop
        this.inactivityTimeout = this.shouldExtendSession ? 12 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000; // 12h for PWA/mobile, 2h for desktop
        this.checkInterval = this.shouldExtendSession ? 10 * 60 * 1000 : 5 * 60 * 1000; // Check every 10min for PWA/mobile, 5min for desktop

        this.lastActivity = Date.now();
        this.isActive = true;
        this.intervalId = null;
        this.listeners = new Set();
        this.isInitialized = false;
        this.initTime = Date.now(); // Track when session manager was initialized
        this.isLoggingOut = false; // Flag to prevent conflicts during logout

        console.log(`🔧 SessionManager: PWA=${this.isPWA}, Mobile=${this.isMobile}, ExtendedSession=${this.shouldExtendSession}`);
        console.log(`⏱️ SessionManager: Timeout=${this.sessionTimeout / 1000 / 60}min, Inactivity=${this.inactivityTimeout / 1000 / 60}min`);

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
            // Skip all checks if logout is in progress
            if (this.isLoggingOut) {
                return;
            }

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
            } else if (e.key === 'watanhub_controlled_logout') {
                Logger.info('Controlled logout detected, stopping session management');
                this.isLoggingOut = true;
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
        // Don't validate if we're in the middle of logging out
        if (this.isLoggingOut) {
            Logger.debug('Skipping session validation - logout in progress');
            return false;
        }

        // Check for controlled logout signal
        const controlledLogout = localStorage.getItem('watanhub_controlled_logout');
        if (controlledLogout) {
            Logger.info('Controlled logout detected, stopping validation');
            this.isLoggingOut = true;
            return false;
        }

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
                if (this.isInitialized && timeSinceInit > 60000 && !this.isLoggingOut) {
                    Logger.info('Session expired after grace period, triggering logout');
                    this.notifyListeners('session_expired');
                } else {
                    Logger.info('No session found but within grace period or logout in progress, not logging out');
                }
                return false;
            }

            // Check if session is expired with safety buffer
            const now = Date.now();
            const sessionTime = new Date(session.expires_at).getTime();
            const safetyBuffer = 60 * 1000; // 1 minute buffer for clock differences

            if (sessionTime <= (now - safetyBuffer)) {
                Logger.info('Session expired, forcing logout');
                if (!this.isLoggingOut) {
                    await this.forceLogout('Session expired');
                }
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

    // Check for user inactivity - Enhanced for PWA/mobile users
    checkInactivity() {
        // Skip inactivity check if logout is in progress
        if (this.isLoggingOut) {
            return;
        }

        const now = Date.now();
        const timeSinceActivity = now - this.lastActivity;

        // More lenient inactivity check for PWA/mobile users
        if (this.isInitialized && this.isActive && timeSinceActivity > this.inactivityTimeout) {
            const minutesInactive = Math.round(timeSinceActivity / (1000 * 60));
            const hoursInactive = Math.round(minutesInactive / 60);

            console.log(`⚠️ User inactive: ${hoursInactive}h ${minutesInactive % 60}m (PWA: ${this.isPWA}, Mobile: ${this.isMobile})`);

            // For PWA/mobile users, give extra warning before logout
            if (this.shouldExtendSession && timeSinceActivity < (this.inactivityTimeout + 30 * 60 * 1000)) {
                console.log('🔔 PWA/Mobile user - showing inactivity warning instead of immediate logout');
                this.notifyListeners('inactivity_warning', {
                    minutesInactive,
                    timeUntilLogout: Math.round((this.inactivityTimeout + 30 * 60 * 1000 - timeSinceActivity) / (1000 * 60))
                });
                return;
            }

            Logger.info(`User inactive for ${minutesInactive} minutes, logging out`);
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

    // Prepare for logout - called by AuthContext to prevent conflicts
    prepareForLogout() {
        console.log('🔄 SessionManager: Preparing for logout');
        this.isLoggingOut = true;

        // Clear the interval to stop all checks
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        // Stop listening for storage events that might interfere
        this.clearAllStorage();

        Logger.info('SessionManager prepared for logout');
    }

    // Enhanced PWA detection
    checkIfPWA() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone ||
            document.referrer.includes('android-app://') ||
            (window.location.search.includes('utm_source=pwa'));
    }

    // Mobile device detection
    checkIfMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (window.innerWidth <= 768 && 'ontouchstart' in window);
    }
}

// Create singleton instance
export const sessionManager = new SessionManager();
export default SessionManager; 