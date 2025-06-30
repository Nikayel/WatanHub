// Smart Cache Management System
import Logger from '../utils/logger';

class CacheManager {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes
        this.maxSize = 100;
        this.prefix = 'watanhub_cache_';

        this.setupStorageListener();
        this.loadFromStorage();
    }

    // Setup cross-tab cache synchronization
    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.startsWith(this.prefix)) {
                const cacheKey = e.key.replace(this.prefix, '');

                if (e.newValue === null) {
                    // Item was deleted in another tab
                    this.invalidateLocal(cacheKey);
                } else {
                    // Item was updated in another tab
                    try {
                        const data = JSON.parse(e.newValue);
                        this.setLocal(cacheKey, data.value, data.expiresAt - Date.now());
                    } catch (error) {
                        Logger.warn('Failed to sync cache from storage:', error);
                    }
                }
            }
        });
    }

    // Load existing cache from localStorage
    loadFromStorage() {
        try {
            const now = Date.now();

            for (let cacheIndex = 0; cacheIndex < localStorage.length; cacheIndex++) {
                const key = localStorage.key(cacheIndex);
                if (key && key.startsWith(this.prefix)) {
                    const cacheKey = key.replace(this.prefix, '');
                    const rawData = localStorage.getItem(key);

                    if (rawData) {
                        const data = JSON.parse(rawData);

                        if (data.expiresAt > now) {
                            this.setLocal(cacheKey, data.value, data.expiresAt - now);
                        } else {
                            localStorage.removeItem(key);
                        }
                    }
                }
            }
        } catch (error) {
            Logger.warn('Failed to load cache from storage:', error);
        }
    }

    // Set cache item locally only
    setLocal(key, value, ttl = this.defaultTTL) {
        // Check cache size limit
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        const expiresAt = Date.now() + ttl;

        // Clear existing timer
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
        }

        // Set cache value
        this.cache.set(key, {
            value,
            expiresAt,
            lastAccessed: Date.now()
        });

        // Set expiration timer
        const timer = setTimeout(() => {
            this.invalidate(key);
        }, ttl);

        this.timers.set(key, timer);
    }

    // Set cache item with cross-tab sync
    set(key, value, ttl = this.defaultTTL) {
        this.setLocal(key, value, ttl);

        // Sync to localStorage for cross-tab communication
        try {
            const data = {
                value,
                expiresAt: Date.now() + ttl,
                lastAccessed: Date.now()
            };

            localStorage.setItem(this.prefix + key, JSON.stringify(data));
        } catch (error) {
            Logger.warn('Failed to sync cache to storage:', error);
        }
    }

    // Get cache item
    get(key) {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        if (Date.now() > item.expiresAt) {
            this.invalidate(key);
            return null;
        }

        // Update last accessed time
        item.lastAccessed = Date.now();
        return item.value;
    }

    // Check if cache has key
    has(key) {
        const item = this.cache.get(key);
        return item && Date.now() <= item.expiresAt;
    }

    // Invalidate cache item locally only
    invalidateLocal(key) {
        if (this.timers.has(key)) {
            clearTimeout(this.timers.get(key));
            this.timers.delete(key);
        }

        this.cache.delete(key);
    }

    // Invalidate cache item with cross-tab sync
    invalidate(key) {
        this.invalidateLocal(key);

        // Remove from localStorage
        try {
            localStorage.removeItem(this.prefix + key);
        } catch (error) {
            Logger.warn('Failed to remove cache from storage:', error);
        }
    }

    // Invalidate multiple keys by pattern
    invalidatePattern(pattern) {
        const regex = new RegExp(pattern);
        const keysToInvalidate = [];

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                keysToInvalidate.push(key);
            }
        }

        keysToInvalidate.forEach(key => this.invalidate(key));
    }

    // Clear all cache
    clear() {
        // Clear timers
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }

        this.timers.clear();
        this.cache.clear();

        // Clear from localStorage
        try {
            const keysToRemove = [];
            for (let clearIndex = 0; clearIndex < localStorage.length; clearIndex++) {
                const key = localStorage.key(clearIndex);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch (error) {
            Logger.warn('Failed to clear cache from storage:', error);
        }
    }

    // Evict oldest items when cache is full
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, item] of this.cache.entries()) {
            if (item.lastAccessed < oldestTime) {
                oldestTime = item.lastAccessed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.invalidate(oldestKey);
        }
    }

    // Get cache statistics
    getStats() {
        const now = Date.now();
        let expiredCount = 0;

        for (const item of this.cache.values()) {
            if (now > item.expiresAt) {
                expiredCount++;
            }
        }

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            expired: expiredCount,
            activeTimers: this.timers.size
        };
    }

    // Cleanup expired items
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];

        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                expiredKeys.push(key);
            }
        }

        expiredKeys.forEach(key => this.invalidate(key));

        Logger.debug(`Cache cleanup: removed ${expiredKeys.length} expired items`);
    }

    // Emergency cache clear for troubleshooting
    emergencyClear() {
        console.log('🚨 Emergency cache clear initiated');

        // Clear all in-memory cache
        this.clear();

        // Clear all localStorage with watanhub prefix
        try {
            const allKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.includes('watanhub') || key.startsWith('sb-') || key.includes('supabase'))) {
                    allKeys.push(key);
                }
            }
            allKeys.forEach(key => localStorage.removeItem(key));
            console.log(`🧹 Cleared ${allKeys.length} localStorage keys`);
        } catch (error) {
            console.warn('Failed to clear localStorage in emergency clear:', error);
        }

        // Clear sessionStorage
        try {
            sessionStorage.clear();
            console.log('🧹 Cleared sessionStorage');
        } catch (error) {
            console.warn('Failed to clear sessionStorage:', error);
        }

        // Clear browser cache if possible
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    if (cacheName.includes('watanhub')) {
                        caches.delete(cacheName);
                        console.log(`🧹 Cleared cache: ${cacheName}`);
                    }
                });
            }).catch(error => {
                console.warn('Failed to clear browser caches:', error);
            });
        }
    }

    // Force refresh all cached data
    forceRefreshAll() {
        console.log('🔄 Force refreshing all cached data');

        // Clear all cache
        this.clear();

        // Notify all components that cache was cleared
        window.dispatchEvent(new CustomEvent('cache-cleared', {
            detail: { timestamp: Date.now() }
        }));
    }
}

// Cache wrapper for API calls
export class ApiCache {
    constructor(cacheManager) {
        this.cache = cacheManager;
    }

    // Cached fetch wrapper
    async fetch(key, fetchFn, ttl = 5 * 60 * 1000) {
        // Check cache first
        const cached = this.cache.get(key);
        if (cached) {
            Logger.debug(`Cache hit for: ${key}`);
            return cached;
        }

        // Fetch fresh data
        Logger.debug(`Cache miss for: ${key}, fetching...`);
        try {
            const data = await fetchFn();
            this.cache.set(key, data, ttl);
            return data;
        } catch (error) {
            Logger.error(`Fetch failed for: ${key}`, error);
            throw error;
        }
    }

    // Invalidate cache by API endpoint pattern
    invalidateEndpoint(endpoint) {
        this.cache.invalidatePattern(`api_${endpoint}.*`);
    }

    // Invalidate user-specific cache
    invalidateUserCache(userId) {
        this.cache.invalidatePattern(`.*_user_${userId}.*`);
    }
}

// Create singleton instances
export const cacheManager = new CacheManager();
export const apiCache = new ApiCache(cacheManager);

// Cleanup every 5 minutes
setInterval(() => {
    cacheManager.cleanup();
}, 5 * 60 * 1000);

export default CacheManager; 