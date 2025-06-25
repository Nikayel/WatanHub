// Production monitoring and analytics utilities

import config from '../config/environment';
import Logger from './logger';

class MonitoringService {
    constructor() {
        this.metrics = new Map();
        this.startTime = performance.now();
        this.isEnabled = config.performance.enableAnalytics;
    }

    // Track page load performance
    trackPageLoad(pageName) {
        if (!this.isEnabled) return;

        const loadTime = performance.now() - this.startTime;
        this.recordMetric('page_load', {
            page: pageName,
            loadTime,
            timestamp: new Date().toISOString()
        });

        Logger.debug(`Page ${pageName} loaded in ${loadTime.toFixed(2)}ms`);
    }

    // Track user interactions
    trackUserAction(action, data = {}) {
        if (!this.isEnabled) return;

        this.recordMetric('user_action', {
            action,
            ...data,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
    }

    // Track API call performance
    trackApiCall(endpoint, method, duration, status) {
        if (!this.isEnabled) return;

        this.recordMetric('api_call', {
            endpoint,
            method,
            duration,
            status,
            timestamp: new Date().toISOString()
        });

        if (duration > 5000) {
            Logger.warn(`Slow API call detected: ${method} ${endpoint} took ${duration}ms`);
        }
    }

    // Track errors with context
    trackError(error, context = {}) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...context
        };

        this.recordMetric('error', errorData);
        Logger.error('Application error tracked:', errorData);

        // Send to error reporting service in production
        if (config.isProduction) {
            this.sendToErrorService(errorData);
        }
    }

    // Track performance metrics
    trackPerformance() {
        if (!this.isEnabled || typeof window.performance === 'undefined') return;

        const navigation = window.performance.getEntriesByType('navigation')[0];
        if (!navigation) return;

        const metrics = {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            ssl: navigation.secureConnectionStart > 0 ?
                navigation.connectEnd - navigation.secureConnectionStart : 0,
            ttfb: navigation.responseStart - navigation.requestStart,
            download: navigation.responseEnd - navigation.responseStart,
            dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
            load: navigation.loadEventEnd - navigation.loadEventStart
        };

        this.recordMetric('performance', {
            ...metrics,
            timestamp: new Date().toISOString()
        });

        Logger.debug('Performance metrics recorded:', metrics);
    }

    // Track Core Web Vitals
    trackWebVitals() {
        if (!this.isEnabled) return;

        // Track LCP (Largest Contentful Paint)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.recordMetric('web_vital_lcp', {
                value: lastEntry.startTime,
                timestamp: new Date().toISOString()
            });
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Track FID (First Input Delay)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                this.recordMetric('web_vital_fid', {
                    value: entry.processingStart - entry.startTime,
                    timestamp: new Date().toISOString()
                });
            });
        }).observe({ entryTypes: ['first-input'] });

        // Track CLS (Cumulative Layout Shift)
        let clsValue = 0;
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
            this.recordMetric('web_vital_cls', {
                value: clsValue,
                timestamp: new Date().toISOString()
            });
        }).observe({ entryTypes: ['layout-shift'] });
    }

    // Record metric internally
    recordMetric(type, data) {
        const key = `${type}_${Date.now()}`;
        this.metrics.set(key, { type, data });

        // Keep only last 100 metrics to prevent memory leaks
        if (this.metrics.size > 100) {
            const firstKey = this.metrics.keys().next().value;
            this.metrics.delete(firstKey);
        }
    }

    // Send error data to external service
    async sendToErrorService(errorData) {
        try {
            await fetch('/api/monitoring/errors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(errorData)
            });
        } catch (sendError) {
            Logger.error('Failed to send error to monitoring service:', sendError);
        }
    }

    // Get collected metrics
    getMetrics() {
        return Array.from(this.metrics.values());
    }

    // Clear metrics
    clearMetrics() {
        this.metrics.clear();
    }

    // Initialize monitoring
    init() {
        if (!this.isEnabled) return;

        // Track initial page load
        if (document.readyState === 'complete') {
            this.trackPerformance();
            this.trackWebVitals();
        } else {
            window.addEventListener('load', () => {
                this.trackPerformance();
                this.trackWebVitals();
            });
        }

        // Track unhandled errors
        window.addEventListener('error', (event) => {
            this.trackError(event.error, {
                type: 'javascript_error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        // Track unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError(new Error(event.reason), {
                type: 'promise_rejection'
            });
        });

        Logger.info('Monitoring service initialized');
    }
}

// Create singleton instance
const monitoring = new MonitoringService();

// Performance decorator for functions
export const withPerformanceTracking = (name, fn) => {
    return async (...args) => {
        const start = performance.now();
        try {
            const result = await fn(...args);
            const duration = performance.now() - start;
            monitoring.trackUserAction('function_call', {
                name,
                duration,
                success: true
            });
            return result;
        } catch (error) {
            const duration = performance.now() - start;
            monitoring.trackError(error, {
                function: name,
                duration
            });
            throw error;
        }
    };
};

// API call wrapper with monitoring
export const monitoredApiCall = async (url, options = {}) => {
    const start = performance.now();
    const method = options.method || 'GET';

    try {
        const response = await fetch(url, options);
        const duration = performance.now() - start;

        monitoring.trackApiCall(url, method, duration, response.status);

        return response;
    } catch (error) {
        const duration = performance.now() - start;
        monitoring.trackApiCall(url, method, duration, 'error');
        monitoring.trackError(error, {
            type: 'api_error',
            url,
            method
        });
        throw error;
    }
};

export default monitoring; 