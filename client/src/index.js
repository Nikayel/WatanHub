// Force fresh deployment - All variable 'i' conflicts resolved
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './lib/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Production optimizations
import config from './config/environment';
import monitoring from './utils/monitoring';
import Logger from './utils/logger';

// PWA and optimization imports
import { registerSW } from './utils/serviceWorkerRegistration';
import { initializePerformanceMonitoring } from './utils/performanceMonitoring';

// Initialize monitoring in production
if (config.isProduction) {
    monitoring.init();
}

// Initialize PWA service worker with enhanced utilities
if ('serviceWorker' in navigator && config.isProduction) {
    registerSW({
        onSuccess: async (registration) => {
            Logger.info('✅ Service Worker registered successfully');

            // Initialize service worker utilities for enhanced functionality
            try {
                const { initializeServiceWorkerUtils } = await import('./utils/serviceWorkerRegistration');
                await initializeServiceWorkerUtils();
            } catch (error) {
                Logger.warn('⚠️ Failed to initialize SW utilities:', error);
            }
        },
        onUpdate: (registration) => {
            Logger.info('🔄 New app version available');
            // The PWARefreshPrompt component will handle update notifications
        }
    });
}

// Initialize performance monitoring
initializePerformanceMonitoring();

// Initialize app performance tracking
Logger.info('WatanHub starting', {
    environment: process.env.NODE_ENV,
    version: config.app.version,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    connectionType: navigator.connection?.effectiveType || 'unknown'
});

// Preload critical resources for better performance
const preloadCriticalResources = () => {
    const criticalResources = [
        { href: '/api/profile', as: 'fetch', crossOrigin: 'anonymous' },
        { href: '/Logo.png', as: 'image' },
        { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', as: 'style' }
    ];

    criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        Object.assign(link, resource);
        document.head.appendChild(link);
    });
};

// Only preload in production for better performance
if (config.isProduction) {
    preloadCriticalResources();
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <App />
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>
);

// Enhanced performance tracking with Core Web Vitals
const vitalsHandler = (metric) => {
    if (config.performance.enableAnalytics) {
        monitoring.trackUserAction('web_vital', {
            name: metric.name,
            value: metric.value,
            id: metric.id,
            timestamp: Date.now()
        });
    }

    Logger.debug('Web Vital:', {
        metric: metric.name,
        value: Math.round(metric.value * 100) / 100,
        rating: getVitalRating(metric.name, metric.value),
        timestamp: new Date().toISOString()
    });
};

// Get performance rating for Core Web Vitals
const getVitalRating = (name, value) => {
    const thresholds = {
        'CLS': { good: 0.1, poor: 0.25 },
        'FID': { good: 100, poor: 300 },
        'LCP': { good: 2500, poor: 4000 },
        'FCP': { good: 1800, poor: 3000 },
        'TTFB': { good: 800, poor: 1800 }
    };

    const threshold = thresholds[name];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
};

// Network condition monitoring
if ('connection' in navigator) {
    const logNetworkChange = () => {
        const connection = navigator.connection;
        Logger.info('Network changed:', {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData
        });
    };

    navigator.connection.addEventListener('change', logNetworkChange);
    logNetworkChange(); // Log initial state
}

// Install prompt handling for PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;

    // Show custom install button
    const installButton = document.getElementById('install-pwa-btn');
    if (installButton) {
        installButton.style.display = 'block';
        installButton.addEventListener('click', () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        Logger.info('User accepted the install prompt');
                        installButton.style.display = 'none';
                    }
                    deferredPrompt = null;
                });
            }
        });
    }
});

// Track PWA usage
window.addEventListener('appinstalled', () => {
    Logger.info('PWA was installed');
    monitoring.trackUserAction('pwa_installed', {
        timestamp: Date.now()
    });
});

reportWebVitals(vitalsHandler); 