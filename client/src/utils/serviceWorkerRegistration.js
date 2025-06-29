// Service Worker Registration for WatanHub PWA
import Logger from './logger';

const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
);

export function registerSW(config) {
    if ('serviceWorker' in navigator) {
        // The URL constructor is available in all browsers that support SW.
        const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
        if (publicUrl.origin !== window.location.origin) {
            // Our service worker won't work if PUBLIC_URL is on a different origin
            // from what our page is served on. This might happen if a CDN is used to
            // serve assets.
            return;
        }

        window.addEventListener('load', () => {
            const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

            if (isLocalhost) {
                // This is running on localhost. Let's check if a service worker still exists or not.
                checkValidServiceWorker(swUrl, config);

                // Add some additional logging to localhost, pointing developers to the
                // service worker/PWA documentation.
                navigator.serviceWorker.ready.then(() => {
                    Logger.info(
                        'This web app is being served cache-first by a service ' +
                        'worker. To learn more, visit https://cra.link/PWA'
                    );
                });
            } else {
                // Is not localhost. Just register service worker
                registerValidSW(swUrl, config);
            }
        });
    }
}

function registerValidSW(swUrl, config) {
    navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
            Logger.info('🔧 Service Worker registered successfully:', registration);

            // Listen for updates to the service worker
            registration.addEventListener('updatefound', () => {
                const installingWorker = registration.installing;
                if (installingWorker == null) {
                    return;
                }

                installingWorker.addEventListener('statechange', () => {
                    if (installingWorker.state === 'installed') {
                        if (navigator.serviceWorker.controller) {
                            // At this point, the updated precached content has been fetched,
                            // but the previous service worker will still serve the older
                            // content until all client tabs are closed.
                            Logger.info(
                                '🔄 New content is available and will be used when all ' +
                                'tabs for this page are closed. See https://cra.link/PWA.'
                            );

                            // Show update notification to user
                            showUpdateNotification();

                            // Execute callback
                            if (config && config.onUpdate) {
                                config.onUpdate(registration);
                            }
                        } else {
                            // At this point, everything has been precached.
                            // It's the perfect time to display a
                            // "Content is cached for offline use." message.
                            Logger.info('✅ Content is cached for offline use.');

                            // Show offline ready notification
                            showOfflineReadyNotification();

                            // Execute callback
                            if (config && config.onSuccess) {
                                config.onSuccess(registration);
                            }
                        }
                    }
                });
            });

            // Listen for messages from the service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SW_ACTIVATED') {
                    Logger.info('🚀 Service Worker activated with version:', event.data.version);
                }
            });

            // Check for updates periodically
            setInterval(() => {
                registration.update();
            }, 60000); // Check every minute

        })
        .catch((error) => {
            Logger.error('❌ Service Worker registration failed:', error);
        });
}

function checkValidServiceWorker(swUrl, config) {
    // Check if the service worker can be found. If it can't reload the page.
    fetch(swUrl, {
        headers: { 'Service-Worker': 'script' },
    })
        .then((response) => {
            // Ensure service worker exists, and that we really are getting a JS file.
            const contentType = response.headers.get('content-type');
            if (
                response.status === 404 ||
                (contentType != null && contentType.indexOf('javascript') === -1)
            ) {
                // No service worker found. Probably a different app. Reload the page.
                navigator.serviceWorker.ready.then((registration) => {
                    registration.unregister().then(() => {
                        window.location.reload();
                    });
                });
            } else {
                // Service worker found. Proceed as normal.
                registerValidSW(swUrl, config);
            }
        })
        .catch(() => {
            Logger.info(
                '⚠️ No internet connection found. App is running in offline mode.'
            );
        });
}

// Show update notification when new version is available
function showUpdateNotification() {
    if (window.confirm(
        'A new version of WatanHub is available! ' +
        'Click OK to update and reload the page.'
    )) {
        // Skip waiting and reload
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
    }
}

// Show offline ready notification
function showOfflineReadyNotification() {
    // Create a subtle notification that doesn't interrupt the user
    const notification = document.createElement('div');
    notification.className = 'offline-ready-notification';
    notification.innerHTML = `
    <div class="notification-content">
      📶 WatanHub is now available offline!
      <button onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;

    // Add some basic styling
    notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    font-size: 14px;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Enhanced service worker update handling
export function skipWaiting() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
}

// Force service worker update
export function forceUpdate() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.update();
        });
    }
}

// Unregister service worker (for debugging or emergency)
export function unregister() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
            .then((registration) => {
                registration.unregister();
                Logger.info('🗑️ Service Worker unregistered');
            })
            .catch((error) => {
                Logger.error('❌ Service Worker unregistration failed:', error);
            });
    }
}

// Get service worker status
export function getServiceWorkerStatus() {
    return new Promise((resolve) => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then((registration) => {
                resolve({
                    supported: true,
                    registered: !!registration,
                    active: !!registration.active,
                    waiting: !!registration.waiting,
                    installing: !!registration.installing,
                    scope: registration.scope
                });
            });
        } else {
            resolve({
                supported: false,
                registered: false,
                active: false,
                waiting: false,
                installing: false,
                scope: null
            });
        }
    });
}

// Background sync registration
export function registerBackgroundSync(tag = 'background-sync-queue') {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
            return registration.sync.register(tag);
        }).then(() => {
            Logger.info('🔄 Background sync registered');
        }).catch((error) => {
            Logger.warn('⚠️ Background sync registration failed:', error);
        });
    }
}

// Push notification subscription
export async function subscribeToPush() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
            const registration = await navigator.serviceWorker.ready;

            // Check if already subscribed
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                return existingSubscription;
            }

            // Subscribe to push notifications
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY)
            });

            Logger.info('📱 Push notification subscription created');
            return subscription;
        } catch (error) {
            Logger.error('❌ Push notification subscription failed:', error);
            throw error;
        }
    } else {
        throw new Error('Push notifications not supported');
    }
}

// Utility function to convert VAPID key
function urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// CSS for notifications (injected once)
if (document.head && !document.getElementById('sw-notification-styles')) {
    const style = document.createElement('style');
    style.id = 'sw-notification-styles';
    style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    .offline-ready-notification .notification-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    
    .offline-ready-notification button {
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      margin: 0;
      line-height: 1;
    }
    
    .offline-ready-notification button:hover {
      opacity: 0.8;
    }
  `;
    document.head.appendChild(style);
}

// Initialize service worker utilities and monitoring
export async function initializeServiceWorkerUtils() {
    try {
        // Dynamic import to avoid circular dependencies
        const { default: serviceWorkerManager } = await import('./serviceWorkerUtils');

        // Initialize the service worker manager
        await serviceWorkerManager.init();

        // Start monitoring app state for refresh prompts
        const cleanup = serviceWorkerManager.monitorAppState();

        Logger.info('✅ Service Worker utilities initialized');

        return cleanup;
    } catch (error) {
        Logger.warn('⚠️ Service Worker utilities initialization failed:', error);
        return () => { }; // Return empty cleanup function
    }
} 