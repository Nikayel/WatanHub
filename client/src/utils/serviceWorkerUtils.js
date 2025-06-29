// Service Worker Communication Utilities

class ServiceWorkerManager {
    constructor() {
        this.registration = null;
        this.isSupported = 'serviceWorker' in navigator;
        this.messageCallbacks = new Map();
    }

    // Initialize and get service worker registration
    async init() {
        if (!this.isSupported) {
            console.warn('Service Workers not supported');
            return null;
        }

        try {
            this.registration = await navigator.serviceWorker.ready;
            console.log('✅ Service Worker ready');
            return this.registration;
        } catch (error) {
            console.error('❌ Service Worker initialization failed:', error);
            return null;
        }
    }

    // Send message to service worker with optional response handling
    async sendMessage(type, data = null) {
        if (!this.registration) {
            await this.init();
        }

        if (!this.registration) {
            throw new Error('Service Worker not available');
        }

        return new Promise((resolve, reject) => {
            const messageChannel = new MessageChannel();

            messageChannel.port1.onmessage = (event) => {
                resolve(event.data);
            };

            messageChannel.port1.onerror = (error) => {
                reject(error);
            };

            try {
                this.registration.active?.postMessage(
                    { type, data },
                    [messageChannel.port2]
                );
            } catch (error) {
                reject(error);
            }

            // Timeout after 10 seconds
            setTimeout(() => {
                reject(new Error('Service Worker message timeout'));
            }, 10000);
        });
    }

    // Get current service worker version
    async getVersion() {
        try {
            const response = await this.sendMessage('GET_VERSION');
            return response.version;
        } catch (error) {
            console.error('Failed to get SW version:', error);
            return null;
        }
    }

    // Clear all caches
    async clearCache() {
        try {
            const response = await this.sendMessage('CLEAR_CACHE');
            if (response.success) {
                console.log('✅ Cache cleared successfully');
                return true;
            } else {
                throw new Error(response.error || 'Cache clear failed');
            }
        } catch (error) {
            console.error('❌ Failed to clear cache:', error);
            throw error;
        }
    }

    // Force refresh specific URLs in cache
    async forceRefresh(urls = []) {
        try {
            const response = await this.sendMessage('FORCE_REFRESH', { urls });
            if (response.success) {
                console.log('✅ Cache refresh successful');
                return true;
            } else {
                throw new Error(response.error || 'Cache refresh failed');
            }
        } catch (error) {
            console.error('❌ Failed to force refresh cache:', error);
            throw error;
        }
    }

    // Check if cached data is stale
    async checkStaleness() {
        try {
            const response = await this.sendMessage('CHECK_STALENESS');
            return response;
        } catch (error) {
            console.error('❌ Failed to check cache staleness:', error);
            return { hasStaleData: false, error: error.message };
        }
    }

    // Skip waiting for new service worker
    async skipWaiting() {
        try {
            await this.sendMessage('SKIP_WAITING');
            console.log('✅ Service Worker update triggered');
            return true;
        } catch (error) {
            console.error('❌ Failed to skip waiting:', error);
            return false;
        }
    }

    // Refresh application completely
    async refreshApp() {
        try {
            // First clear cache
            await this.clearCache();

            // Then reload the page
            window.location.reload(true);
        } catch (error) {
            console.error('❌ Failed to refresh app:', error);
            // Fallback to simple reload
            window.location.reload();
        }
    }

    // Smart refresh - only refresh if data is stale
    async smartRefresh() {
        try {
            const staleness = await this.checkStaleness();

            if (staleness.hasStaleData) {
                console.log('📊 Stale data detected, refreshing...');

                // Get the stale URLs
                const staleUrls = staleness.staleEntries?.map(entry => entry.url) || [];

                if (staleUrls.length > 0) {
                    await this.forceRefresh(staleUrls);
                    return { refreshed: true, staleEntries: staleness.staleEntries };
                }
            }

            return { refreshed: false, message: 'No stale data found' };
        } catch (error) {
            console.error('❌ Smart refresh failed:', error);
            throw error;
        }
    }

    // Check if app needs update (new service worker available)
    async checkForUpdate() {
        if (!this.registration) {
            await this.init();
        }

        if (!this.registration) {
            return false;
        }

        try {
            await this.registration.update();
            return !!this.registration.waiting;
        } catch (error) {
            console.error('❌ Failed to check for update:', error);
            return false;
        }
    }

    // Install app update
    async installUpdate() {
        if (!this.registration || !this.registration.waiting) {
            throw new Error('No update available');
        }

        try {
            await this.skipWaiting();

            // Listen for controllerchange to reload
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                window.location.reload();
            }, { once: true });

            return true;
        } catch (error) {
            console.error('❌ Failed to install update:', error);
            throw error;
        }
    }

    // Monitor app state and suggest refresh when needed
    monitorAppState() {
        let lastActivity = Date.now();
        let visibilityTimer;

        // Track user activity
        const trackActivity = () => {
            lastActivity = Date.now();
        };

        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        events.forEach(event => {
            document.addEventListener(event, trackActivity, { passive: true });
        });

        // Monitor visibility changes
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                const timeAway = Date.now() - lastActivity;

                // Only check for stale data if away for more than 15 minutes (increased from 5)
                if (timeAway > 15 * 60 * 1000) {
                    try {
                        const staleness = await this.checkStaleness();

                        if (staleness.hasStaleData) {
                            // Dispatch custom event for components to handle
                            window.dispatchEvent(new CustomEvent('app-data-stale', {
                                detail: { staleness, timeAway }
                            }));
                        }
                    } catch (error) {
                        console.warn('Failed to check staleness on visibility change:', error);
                    }
                }

                lastActivity = Date.now();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup function
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, trackActivity);
            });
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearTimeout(visibilityTimer);
        };
    }
}

// Singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

// Convenience functions
export const clearAppCache = () => serviceWorkerManager.clearCache();
export const refreshAppData = (urls) => serviceWorkerManager.forceRefresh(urls);
export const checkDataStaleness = () => serviceWorkerManager.checkStaleness();
export const refreshAppCompletely = () => serviceWorkerManager.refreshApp();
export const smartRefreshApp = () => serviceWorkerManager.smartRefresh();
export const checkForAppUpdate = () => serviceWorkerManager.checkForUpdate();
export const installAppUpdate = () => serviceWorkerManager.installUpdate();
export const getServiceWorkerVersion = () => serviceWorkerManager.getVersion();
export const monitorAppState = () => serviceWorkerManager.monitorAppState();

export default serviceWorkerManager; 