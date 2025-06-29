// Enhanced Performance Monitoring for WatanHub
import Logger from './logger';

class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = new Map();
        this.thresholds = {
            CLS: { good: 0.1, poor: 0.25 },
            FID: { good: 100, poor: 300 },
            LCP: { good: 2500, poor: 4000 },
            FCP: { good: 1800, poor: 3000 },
            TTFB: { good: 800, poor: 1800 }
        };

        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) return;

        try {
            // Core Web Vitals
            this.initializeCLS();
            this.initializeFID();
            this.initializeLCP();
            this.initializeFCP();
            this.initializeTTFB();

            // Custom metrics
            this.initializeResourceTiming();
            this.initializeNavigationTiming();
            this.initializeLongTasks();
            this.initializeMemoryUsage();

            // Network monitoring
            this.initializeNetworkMonitoring();

            // User interaction tracking
            this.initializeUserInteractions();

            this.isInitialized = true;
            Logger.info('📊 Performance monitoring initialized');
        } catch (error) {
            Logger.error('❌ Performance monitoring initialization failed:', error);
        }
    }

    // Cumulative Layout Shift (CLS)
    initializeCLS() {
        if (!('LayoutShift' in window)) return;

        let clsValue = 0;
        let sessionValue = 0;
        let sessionEntries = [];

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                // Only count layout shifts without recent input
                if (!entry.hadRecentInput) {
                    const firstSessionEntry = sessionEntries[0];
                    const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

                    // If the entry occurred less than 1 second after the previous entry
                    // and less than 5 seconds after the first entry in the session,
                    // include the entry in the current session. Otherwise, start a new session.
                    if (sessionValue &&
                        entry.startTime - lastSessionEntry.startTime < 1000 &&
                        entry.startTime - firstSessionEntry.startTime < 5000) {
                        sessionValue += entry.value;
                        sessionEntries.push(entry);
                    } else {
                        sessionValue = entry.value;
                        sessionEntries = [entry];
                    }

                    // If the current session value is larger than the current CLS value,
                    // update CLS and the entries contributing to it.
                    if (sessionValue > clsValue) {
                        clsValue = sessionValue;
                        this.reportMetric('CLS', clsValue, entry);
                    }
                }
            }
        });

        observer.observe({ type: 'layout-shift', buffered: true });
        this.observers.set('cls', observer);
    }

    // First Input Delay (FID)
    initializeFID() {
        if (!('PerformanceEventTiming' in window)) return;

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-input') {
                    const fid = entry.processingStart - entry.startTime;
                    this.reportMetric('FID', fid, entry);
                }
            }
        });

        observer.observe({ type: 'first-input', buffered: true });
        this.observers.set('fid', observer);
    }

    // Largest Contentful Paint (LCP)
    initializeLCP() {
        if (!('LargestContentfulPaint' in window)) return;

        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.reportMetric('LCP', lastEntry.startTime, lastEntry);
        });

        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.set('lcp', observer);
    }

    // First Contentful Paint (FCP)
    initializeFCP() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.reportMetric('FCP', entry.startTime, entry);
                }
            }
        });

        observer.observe({ type: 'paint', buffered: true });
        this.observers.set('fcp', observer);
    }

    // Time to First Byte (TTFB)
    initializeTTFB() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'navigation') {
                    const ttfb = entry.responseStart - entry.fetchStart;
                    this.reportMetric('TTFB', ttfb, entry);
                }
            }
        });

        observer.observe({ type: 'navigation', buffered: true });
        this.observers.set('ttfb', observer);
    }

    // Resource loading performance
    initializeResourceTiming() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.analyzeResourcePerformance(entry);
            }
        });

        observer.observe({ type: 'resource', buffered: true });
        this.observers.set('resource', observer);
    }

    // Navigation timing
    initializeNavigationTiming() {
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.analyzeNavigationPerformance(entry);
            }
        });

        observer.observe({ type: 'navigation', buffered: true });
        this.observers.set('navigation', observer);
    }

    // Long tasks monitoring
    initializeLongTasks() {
        if (!('PerformanceLongTaskTiming' in window)) return;

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.reportMetric('LONG_TASK', entry.duration, entry);
            }
        });

        observer.observe({ type: 'longtask', buffered: true });
        this.observers.set('longtask', observer);
    }

    // Memory usage monitoring
    initializeMemoryUsage() {
        if (!('memory' in performance)) return;

        const checkMemory = () => {
            const memory = performance.memory;
            this.reportMetric('MEMORY_USED', memory.usedJSHeapSize, {
                total: memory.totalJSHeapSize,
                limit: memory.jsHeapSizeLimit,
                percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
            });
        };

        // Check memory usage every 30 seconds
        setInterval(checkMemory, 30000);
        checkMemory(); // Initial check
    }

    // Network condition monitoring
    initializeNetworkMonitoring() {
        if (!('connection' in navigator)) return;

        const reportNetworkInfo = () => {
            const connection = navigator.connection;
            this.reportMetric('NETWORK_INFO', 0, {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            });
        };

        navigator.connection.addEventListener('change', reportNetworkInfo);
        reportNetworkInfo(); // Initial report
    }

    // User interaction tracking
    initializeUserInteractions() {
        const interactionTypes = ['click', 'keydown', 'scroll', 'touchstart'];
        let interactionCount = 0;

        interactionTypes.forEach(type => {
            document.addEventListener(type, () => {
                interactionCount++;

                // Report interaction rate every 100 interactions
                if (interactionCount % 100 === 0) {
                    this.reportMetric('USER_INTERACTIONS', interactionCount);
                }
            }, { passive: true });
        });
    }

    // Analyze resource performance
    analyzeResourcePerformance(entry) {
        const duration = entry.responseEnd - entry.fetchStart;
        const size = entry.transferSize || 0;
        const resourceType = this.getResourceType(entry.name);

        // Skip failed resources (404s, 500s, etc.) to reduce noise
        if (duration <= 0 || entry.responseEnd === 0) {
            return;
        }

        // Only flag legitimately slow resources (not failed ones)
        if (duration > 3000 && entry.responseEnd > entry.responseStart) {
            Logger.warn(`Slow resource detected: ${entry.name} (${duration}ms)`);
        }

        // Only flag large resources that actually loaded
        if (size > 1000000 && entry.transferSize > 0) { // 1MB
            Logger.warn(`Large resource detected: ${entry.name} (${(size / 1000000).toFixed(2)}MB)`);
        }

        // Only report metrics for successfully loaded resources
        if (entry.responseEnd > entry.responseStart) {
            this.reportMetric('RESOURCE_TIMING', duration, {
                url: entry.name,
                type: resourceType,
                size: size,
                cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
                success: true
            });
        }
    }

    // Analyze navigation performance
    analyzeNavigationPerformance(entry) {
        const metrics = {
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            tcp: entry.connectEnd - entry.connectStart,
            ssl: entry.connectEnd - entry.secureConnectionStart,
            ttfb: entry.responseStart - entry.fetchStart,
            download: entry.responseEnd - entry.responseStart,
            domProcessing: entry.domContentLoadedEventStart - entry.responseEnd,
            total: entry.loadEventEnd - entry.fetchStart
        };

        Object.entries(metrics).forEach(([key, value]) => {
            if (value > 0) {
                this.reportMetric(`NAV_${key.toUpperCase()}`, value);
            }
        });
    }

    // Get resource type from URL
    getResourceType(url) {
        if (url.includes('/api/')) return 'api';
        if (/\.(js|mjs)(\?|$)/.test(url)) return 'script';
        if (/\.css(\?|$)/.test(url)) return 'stylesheet';
        if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/.test(url)) return 'image';
        if (/\.(woff|woff2|ttf|eot)(\?|$)/.test(url)) return 'font';
        return 'other';
    }

    // Report metric with rating and context
    reportMetric(name, value, entry = null) {
        const metric = {
            name,
            value,
            rating: this.getRating(name, value),
            timestamp: Date.now(),
            url: window.location.href,
            entry
        };

        // Store metric
        this.metrics.set(`${name}_${Date.now()}`, metric);

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            const rating = metric.rating;
            const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
            console.log(`${emoji} ${name}: ${value.toFixed(2)}ms (${rating})`);
        }

        // Send to analytics if configured
        if (window.gtag && typeof window.gtag === 'function') {
            window.gtag('event', 'web_vital', {
                event_category: 'Performance',
                event_label: name,
                value: Math.round(value),
                custom_map: { metric_rating: metric.rating }
            });
        }

        // Trigger custom event for React components
        window.dispatchEvent(new CustomEvent('performance-metric', {
            detail: metric
        }));

        return metric;
    }

    // Get performance rating
    getRating(name, value) {
        const threshold = this.thresholds[name];
        if (!threshold) return 'unknown';

        if (value <= threshold.good) return 'good';
        if (value <= threshold.poor) return 'needs-improvement';
        return 'poor';
    }

    // Get all metrics
    getMetrics() {
        return Array.from(this.metrics.values());
    }

    // Get metrics by name
    getMetricsByName(name) {
        return this.getMetrics().filter(metric => metric.name === name);
    }

    // Get latest metric by name
    getLatestMetric(name) {
        const metrics = this.getMetricsByName(name);
        return metrics.length > 0 ? metrics[metrics.length - 1] : null;
    }

    // Clear old metrics (keep last 100)
    cleanup() {
        const allMetrics = Array.from(this.metrics.entries());

        if (allMetrics.length > 100) {
            const sortedMetrics = allMetrics.sort((a, b) => b[1].timestamp - a[1].timestamp);
            const toKeep = sortedMetrics.slice(0, 100);

            this.metrics.clear();
            toKeep.forEach(([key, metric]) => {
                this.metrics.set(key, metric);
            });
        }
    }

    // Destroy all observers
    destroy() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers.clear();
        this.metrics.clear();
        this.isInitialized = false;
    }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export functions
export function initializePerformanceMonitoring() {
    performanceMonitor.initialize();
}

export function getPerformanceMetrics() {
    return performanceMonitor.getMetrics();
}

export function getLatestMetric(name) {
    return performanceMonitor.getLatestMetric(name);
}

export function reportCustomMetric(name, value, context = null) {
    return performanceMonitor.reportMetric(name, value, context);
}

// Performance measurement helpers
export function measureFunction(fn, name) {
    return function (...args) {
        const startTime = performance.now();
        const result = fn.apply(this, args);
        const endTime = performance.now();

        reportCustomMetric(`FUNCTION_${name}`, endTime - startTime);

        return result;
    };
}

export function measureAsyncFunction(fn, name) {
    return async function (...args) {
        const startTime = performance.now();
        const result = await fn.apply(this, args);
        const endTime = performance.now();

        reportCustomMetric(`ASYNC_FUNCTION_${name}`, endTime - startTime);

        return result;
    };
}

// React hook for performance monitoring
export function usePerformanceMetric(metricName) {
    // Check if React is available
    if (typeof window === 'undefined' || !window.React) {
        console.warn('React not available for usePerformanceMetric hook');
        return null;
    }

    const [metric, setMetric] = window.React.useState(null);

    window.React.useEffect(() => {
        const handleMetricUpdate = (event) => {
            if (event.detail.name === metricName) {
                setMetric(event.detail);
            }
        };

        window.addEventListener('performance-metric', handleMetricUpdate);

        // Get latest metric on mount
        const latestMetric = getLatestMetric(metricName);
        if (latestMetric) {
            setMetric(latestMetric);
        }

        return () => {
            window.removeEventListener('performance-metric', handleMetricUpdate);
        };
    }, [metricName]);

    return metric;
}

// Cleanup function
export function cleanupPerformanceMonitoring() {
    performanceMonitor.cleanup();
}

export function destroyPerformanceMonitoring() {
    performanceMonitor.destroy();
}

export default performanceMonitor; 