// WatanHub Service Worker - Enhanced PWA Support
const CACHE_VERSION = 'watanhub-v2.1.0';
const CACHE_NAME = `watanhub-cache-${CACHE_VERSION}`;

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
    STATIC: 'static-cache',
    DYNAMIC: 'dynamic-cache',
    API: 'api-cache',
    IMAGES: 'image-cache',
    FONTS: 'font-cache'
};

// Resources to cache on install
const STATIC_CACHE_URLS = [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/manifest.json',
    '/favicon.ico',
    '/Logo.png',
    '/OurVision.png',
    // Essential pages for offline access
    '/login',
    '/signup',
    '/dashboard',
    '/offline.html'
];

// API endpoints to cache with short TTL
const API_CACHE_PATTERNS = [
    '/api/profile',
    '/api/dashboard',
    '/api/mentors',
    '/api/announcements'
];

// Image optimization and caching
const IMAGE_CACHE_PATTERNS = [
    /\.(jpg|jpeg|png|gif|webp|svg)$/i,
    /\/images\//,
    /\/screenshots\//,
    /\/Afghntheme\//
];

// Font caching for performance
const FONT_CACHE_PATTERNS = [
    /fonts\.googleapis\.com/,
    /fonts\.gstatic\.com/,
    /\.(woff|woff2|ttf|eot)$/i
];

// Network timeout for cache fallback
const NETWORK_TIMEOUT = 3000;

// Install event - Cache essential resources
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');

    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);

                // Cache static resources with error handling
                const cachePromises = STATIC_CACHE_URLS.map(async (url) => {
                    try {
                        const response = await fetch(url);
                        if (response.ok) {
                            await cache.put(url, response);
                            console.log(`✅ Cached: ${url}`);
                        }
                    } catch (error) {
                        console.warn(`⚠️ Failed to cache: ${url}`, error);
                    }
                });

                await Promise.allSettled(cachePromises);

                // Create offline page if it doesn't exist
                await createOfflinePage(cache);

                console.log('✅ Service Worker installed successfully');

                // Force activation of new service worker
                self.skipWaiting();
            } catch (error) {
                console.error('❌ Service Worker installation failed:', error);
            }
        })()
    );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');

    event.waitUntil(
        (async () => {
            try {
                // Clean up old caches
                const cacheNames = await caches.keys();
                const deleteCachePromises = cacheNames
                    .filter(name => name.startsWith('watanhub-cache-') && name !== CACHE_NAME)
                    .map(name => {
                        console.log(`🗑️ Deleting old cache: ${name}`);
                        return caches.delete(name);
                    });

                await Promise.all(deleteCachePromises);

                // Take control of all pages
                await self.clients.claim();

                console.log('✅ Service Worker activated successfully');

                // Notify clients of successful activation
                broadcastToClients({ type: 'SW_ACTIVATED', version: CACHE_VERSION });
            } catch (error) {
                console.error('❌ Service Worker activation failed:', error);
            }
        })()
    );
});

// Fetch event - Implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle GET requests
    if (request.method !== 'GET') return;

    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) return;

    event.respondWith(handleFetch(request));
});

// Main fetch handler with different strategies
async function handleFetch(request) {
    const url = new URL(request.url);

    try {
        // API requests - Network first with cache fallback
        if (isApiRequest(url)) {
            return await networkFirstStrategy(request, CACHE_STRATEGIES.API);
        }

        // Images - Cache first with network fallback
        if (isImageRequest(url)) {
            return await cacheFirstStrategy(request, CACHE_STRATEGIES.IMAGES);
        }

        // Fonts - Cache first (long term caching)
        if (isFontRequest(url)) {
            return await cacheFirstStrategy(request, CACHE_STRATEGIES.FONTS, 86400000); // 24 hours
        }

        // Static assets - Cache first
        if (isStaticAsset(url)) {
            return await cacheFirstStrategy(request, CACHE_STRATEGIES.STATIC);
        }

        // Navigation requests - Network first with offline fallback
        if (request.mode === 'navigate') {
            return await navigationStrategy(request);
        }

        // Default - Network first
        return await networkFirstStrategy(request, CACHE_STRATEGIES.DYNAMIC);

    } catch (error) {
        console.error('Fetch handler error:', error);
        return await getOfflineResponse(request);
    }
}

// Network first strategy (good for API calls)
async function networkFirstStrategy(request, cacheName, maxAge = 300000) { // 5 minutes default
    const cache = await caches.open(cacheName);

    try {
        // Try network first with timeout
        const networkResponse = await Promise.race([
            fetch(request),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Network timeout')), NETWORK_TIMEOUT)
            )
        ]);

        if (networkResponse.ok) {
            // Clone response before putting in cache
            const responseToCache = networkResponse.clone();

            // Add timestamp for cache expiry
            const headers = new Headers(responseToCache.headers);
            headers.set('sw-cache-timestamp', Date.now().toString());

            const responseWithTimestamp = new Response(responseToCache.body, {
                status: responseToCache.status,
                statusText: responseToCache.statusText,
                headers: headers
            });

            cache.put(request, responseWithTimestamp);
            return networkResponse;
        }
    } catch (error) {
        console.warn('Network failed, trying cache:', error);
    }

    // Try cache if network fails
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        // Check if cache is expired
        const timestamp = cachedResponse.headers.get('sw-cache-timestamp');
        if (timestamp && Date.now() - parseInt(timestamp) < maxAge) {
            return cachedResponse;
        }
    }

    throw new Error('No network or valid cache available');
}

// Cache first strategy (good for images, fonts)
async function cacheFirstStrategy(request, cacheName, maxAge = 604800000) { // 7 days default
    const cache = await caches.open(cacheName);

    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        // Check if cache is expired for API calls
        if (maxAge < 86400000) { // Less than 24 hours, check expiry
            const timestamp = cachedResponse.headers.get('sw-cache-timestamp');
            if (timestamp && Date.now() - parseInt(timestamp) > maxAge) {
                // Cache expired, try network
                try {
                    const networkResponse = await fetch(request);
                    if (networkResponse.ok) {
                        cache.put(request, networkResponse.clone());
                        return networkResponse;
                    }
                } catch (error) {
                    // Network failed, return stale cache
                    console.warn('Network failed, returning stale cache');
                }
            }
        }
        return cachedResponse;
    }

    // Try network if not in cache
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
    } catch (error) {
        console.warn('Network failed for cache-first strategy:', error);
    }

    throw new Error('Resource not available');
}

// Navigation strategy (for page requests)
async function navigationStrategy(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Cache successful navigation responses
            const cache = await caches.open(CACHE_STRATEGIES.DYNAMIC);
            cache.put(request, networkResponse.clone());
            return networkResponse;
        }
    } catch (error) {
        console.warn('Navigation network failed:', error);
    }

    // Try cache
    const cache = await caches.open(CACHE_STRATEGIES.DYNAMIC);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    // Fallback to offline page
    return await getOfflineResponse(request);
}

// Helper functions for request classification
function isApiRequest(url) {
    return url.pathname.startsWith('/api/') ||
        url.hostname.includes('supabase') ||
        API_CACHE_PATTERNS.some(pattern => url.pathname.includes(pattern));
}

function isImageRequest(url) {
    return IMAGE_CACHE_PATTERNS.some(pattern => {
        if (pattern instanceof RegExp) {
            return pattern.test(url.pathname);
        }
        return url.pathname.includes(pattern);
    });
}

function isFontRequest(url) {
    return FONT_CACHE_PATTERNS.some(pattern => {
        if (pattern instanceof RegExp) {
            return pattern.test(url.hostname) || pattern.test(url.pathname);
        }
        return url.hostname.includes(pattern);
    });
}

function isStaticAsset(url) {
    return url.pathname.startsWith('/static/') ||
        url.pathname.includes('.js') ||
        url.pathname.includes('.css') ||
        url.pathname.includes('.ico') ||
        url.pathname === '/manifest.json';
}

// Create offline page
async function createOfflinePage(cache) {
    const offlineHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline - WatanHub</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                text-align: center;
                padding: 20px;
            }
            .offline-container {
                max-width: 400px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px 30px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .logo { font-size: 2.5rem; font-weight: bold; margin-bottom: 20px; }
            h1 { font-size: 1.5rem; margin-bottom: 15px; }
            p { opacity: 0.9; margin-bottom: 25px; line-height: 1.6; }
            .retry-btn {
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 16px;
            }
            .retry-btn:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
            }
            .offline-icon {
                font-size: 4rem;
                margin-bottom: 20px;
                opacity: 0.8;
            }
        </style>
    </head>
    <body>
        <div class="offline-container">
            <div class="offline-icon">📡</div>
            <div class="logo">WatanHub</div>
            <h1>You're Offline</h1>
            <p>It looks like you've lost your internet connection. Don't worry, you can still access some cached content.</p>
            <button class="retry-btn" onclick="location.reload()">Try Again</button>
        </div>
    </body>
    </html>
  `;

    const offlineResponse = new Response(offlineHTML, {
        headers: { 'Content-Type': 'text/html' }
    });

    await cache.put('/offline.html', offlineResponse);
}

// Get offline response
async function getOfflineResponse(request) {
    // For navigation requests, return offline page
    if (request.mode === 'navigate') {
        const cache = await caches.open(CACHE_NAME);
        const offlineResponse = await cache.match('/offline.html');
        if (offlineResponse) return offlineResponse;
    }

    // For other requests, return a simple error response
    return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable'
    });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync triggered:', event.tag);

    if (event.tag === 'background-sync-queue') {
        event.waitUntil(processBackgroundSync());
    }
});

// Process background sync queue
async function processBackgroundSync() {
    try {
        // Get queued requests from IndexedDB
        const queuedRequests = await getQueuedRequests();

        for (const queuedRequest of queuedRequests) {
            try {
                await fetch(queuedRequest.url, queuedRequest.options);
                await removeFromQueue(queuedRequest.id);
                console.log('✅ Synced queued request:', queuedRequest.url);
            } catch (error) {
                console.warn('⚠️ Failed to sync request:', queuedRequest.url, error);
            }
        }
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

// Push notification handler
self.addEventListener('push', (event) => {
    console.log('📱 Push notification received');

    const options = {
        body: 'You have new updates in WatanHub!',
        icon: '/favicon-96x96.png',
        badge: '/favicon-96x96.png',
        vibrate: [100, 50, 100],
        data: { url: '/dashboard' },
        actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    if (event.data) {
        try {
            const payload = event.data.json();
            options.body = payload.message || options.body;
            options.data.url = payload.url || options.data.url;
        } catch (error) {
            console.warn('Invalid push payload:', error);
        }
    }

    event.waitUntil(
        self.registration.showNotification('WatanHub', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked:', event.action);

    event.notification.close();

    if (event.action === 'dismiss') return;

    const urlToOpen = event.notification.data?.url || '/dashboard';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }

                // Open new window if app is not open
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// Utility functions for IndexedDB operations (simplified)
async function getQueuedRequests() {
    // Implement IndexedDB logic for queued requests
    return [];
}

async function removeFromQueue(id) {
    // Implement IndexedDB logic to remove processed requests
}

// Broadcast messages to all clients
function broadcastToClients(message) {
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage(message);
        });
    });
}

// Periodic cleanup of old cache entries
setInterval(() => {
    cleanupOldCaches();
}, 3600000); // Every hour

async function cleanupOldCaches() {
    try {
        const cacheNames = await caches.keys();

        for (const cacheName of cacheNames) {
            if (cacheName.startsWith('watanhub-')) {
                const cache = await caches.open(cacheName);
                const requests = await cache.keys();

                for (const request of requests) {
                    const response = await cache.match(request);
                    const timestamp = response.headers.get('sw-cache-timestamp');

                    // Remove entries older than 7 days
                    if (timestamp && Date.now() - parseInt(timestamp) > 604800000) {
                        await cache.delete(request);
                    }
                }
            }
        }
    } catch (error) {
        console.warn('Cache cleanup failed:', error);
    }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
    const { type, data } = event.data;

    switch (type) {
        case 'SKIP_WAITING':
            console.log('🔄 Client requested service worker update');
            self.skipWaiting();
            break;

        case 'GET_VERSION':
            event.ports[0]?.postMessage({ version: CACHE_VERSION });
            break;

        case 'CLEAR_CACHE':
            console.log('🗑️ Client requested cache clear');
            clearAllCaches().then(() => {
                event.ports[0]?.postMessage({ success: true });
            }).catch(error => {
                event.ports[0]?.postMessage({ success: false, error: error.message });
            });
            break;

        case 'FORCE_REFRESH':
            console.log('🔄 Client requested force refresh');
            forceCacheRefresh(data?.urls || []).then(() => {
                event.ports[0]?.postMessage({ success: true });
            }).catch(error => {
                event.ports[0]?.postMessage({ success: false, error: error.message });
            });
            break;

        case 'CHECK_STALENESS':
            checkCacheStaleness().then((result) => {
                event.ports[0]?.postMessage(result);
            });
            break;

        default:
            console.log('📨 Unknown message type:', type);
    }
});

// Clear all caches
async function clearAllCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('✅ All caches cleared');
    } catch (error) {
        console.error('❌ Failed to clear caches:', error);
        throw error;
    }
}

// Force refresh specific cache entries
async function forceCacheRefresh(urls) {
    try {
        const cache = await caches.open(CACHE_NAME);

        for (const url of urls) {
            try {
                await cache.delete(url);
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                    console.log(`🔄 Refreshed cache for: ${url}`);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to refresh: ${url}`, error);
            }
        }
    } catch (error) {
        console.error('❌ Failed to force refresh cache:', error);
        throw error;
    }
}

// Check if cached data is stale
async function checkCacheStaleness() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cacheKeys = await cache.keys();
        const staleEntries = [];

        for (const request of cacheKeys) {
            const response = await cache.match(request);
            if (response) {
                const timestamp = response.headers.get('sw-cache-timestamp');
                if (timestamp) {
                    const age = Date.now() - parseInt(timestamp);
                    const maxAge = 300000; // 5 minutes

                    if (age > maxAge) {
                        staleEntries.push({
                            url: request.url,
                            age: age,
                            stale: true
                        });
                    }
                }
            }
        }

        return {
            hasStaleData: staleEntries.length > 0,
            staleEntries: staleEntries,
            totalCached: cacheKeys.length
        };
    } catch (error) {
        console.error('❌ Failed to check cache staleness:', error);
        return { hasStaleData: false, error: error.message };
    }
}

console.log('🚀 WatanHub Service Worker loaded successfully'); 