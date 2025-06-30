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
        this.reportedResources = new Set(); // Track reported resources to avoid spam
    }

    initialize() {
        if (this.isInitialized) return;

        try {
            // Only initialize if we're in a browser environment
            if (typeof window === 'undefined') return;

            // Core Web Vitals
            this.initializeCLS();
            this.initializeFID();
            this.initializeLCP();
            this.initializeFCP();
            this.initializeTTFB();

            // Custom metrics (with reduced noise)
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
        if (!window.PerformanceObserver || !('LayoutShift' in window)) return;

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
        if (!window.PerformanceObserver || !('PerformanceEventTiming' in window)) return;

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
        if (!window.PerformanceObserver || !('LargestContentfulPaint' in window)) return;

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
        if (!window.PerformanceObserver) return;

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
        if (!window.PerformanceObserver) return;

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

    // Resource loading performance (with reduced noise)
    initializeResourceTiming() {
        if (!window.PerformanceObserver) return;

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                // Only analyze resources that might be problematic
                if (this.shouldAnalyzeResource(entry)) {
                    this.analyzeResourcePerformance(entry);
                }
            }
        });

        observer.observe({ type: 'resource', buffered: true });
        this.observers.set('resource', observer);
    }

    // Check if we should analyze this resource
    shouldAnalyzeResource(entry) {
        // Skip data URLs, chrome extensions, and other non-network resources
        if (entry.name.startsWith('data:') ||
            entry.name.startsWith('chrome-extension:') ||
            entry.name.startsWith('moz-extension:')) {
            return false;
        }

        // Skip if we already reported this resource
        if (this.reportedResources.has(entry.name)) {
            return false;
        }

        // Only report slow resources (>2 seconds) or failed resources
        const duration = entry.responseEnd - entry.startTime;
        const isSlow = duration > 2000;
        const isFailed = entry.responseEnd === 0;

        return isSlow || isFailed;
    }

    // Navigation timing
    initializeNavigationTiming() {
        if (!window.PerformanceObserver) return;

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
        if (!window.PerformanceObserver || !('PerformanceLongTaskTiming' in window)) return;

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                // Only report truly problematic long tasks (>100ms)
                if (entry.duration > 100) {
                    // Get more context about what caused the long task
                    const taskContext = entry.attribution && entry.attribution[0]
                        ? entry.attribution[0].name || 'unknown'
                        : 'unknown';

                    this.reportMetric('LONG_TASK', entry.duration, {
                        ...entry,
                        context: taskContext,
                        containerType: entry.attribution?.[0]?.containerType,
                        containerSrc: entry.attribution?.[0]?.containerSrc
                    });
                }
            }
        });

        observer.observe({ type: 'longtask', buffered: true });
        this.observers.set('longtask', observer);
    }

    // Memory usage monitoring
    initializeMemoryUsage() {
        if (!window.performance?.memory) return;

        const checkMemory = () => {
            const memory = window.performance.memory;
            const usage = {
                used: Math.round(memory.usedJSHeapSize / 1048576), // MB
                total: Math.round(memory.totalJSHeapSize / 1048576), // MB
                limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
            };

            // Only report if memory usage is concerning (>80% of limit)
            if (usage.used / usage.limit > 0.8) {
                this.reportMetric('MEMORY_USAGE', usage.used, usage);
            }
        };

        // Check memory every 30 seconds
        setInterval(checkMemory, 30000);
    }

    // Network monitoring
    initializeNetworkMonitoring() {
        if (!navigator.connection) return;

        const reportNetworkInfo = () => {
            const connection = navigator.connection;
            const networkInfo = {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };

            // Only report if network is slow
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                this.reportMetric('SLOW_NETWORK', connection.downlink, networkInfo);
            }
        };

        navigator.connection.addEventListener('change', reportNetworkInfo);
        reportNetworkInfo(); // Initial check
    }

    // User interaction tracking
    initializeUserInteractions() {
        if (!window.PerformanceObserver) return;

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                // Only track genuinely slow interactions (>1000ms instead of 100ms)
                if (entry.duration > 1000) {
                    this.reportMetric('SLOW_INTERACTION', entry.duration, {
                        type: entry.name,
                        target: entry.target,
                        startTime: entry.startTime
                    });
                }
            }
        });

        try {
            observer.observe({ type: 'event', buffered: true });
            this.observers.set('interaction', observer);
        } catch (e) {
            // Event timing might not be supported
        }
    }

    // Analyze resource performance (with reduced noise)
    analyzeResourcePerformance(entry) {
        const url = entry.name;
        const duration = entry.responseEnd - entry.startTime;

        // Skip if already reported
        if (this.reportedResources.has(url)) return;

        // Only report significant issues
        if (duration > 3000) { // Very slow resources (>3s)
            this.reportedResources.add(url);

            const resourceType = this.getResourceType(url);
            const timing = {
                dns: entry.domainLookupEnd - entry.domainLookupStart,
                connect: entry.connectEnd - entry.connectStart,
                request: entry.responseStart - entry.requestStart,
                response: entry.responseEnd - entry.responseStart,
                total: duration
            };

            this.reportMetric('SLOW_RESOURCE', duration, {
                url,
                type: resourceType,
                timing,
                size: entry.transferSize || 0
            });
        }
    }

    // Analyze navigation performance
    analyzeNavigationPerformance(entry) {
        const timing = {
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            connect: entry.connectEnd - entry.connectStart,
            request: entry.responseStart - entry.requestStart,
            response: entry.responseEnd - entry.responseStart,
            domLoad: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            pageLoad: entry.loadEventEnd - entry.loadEventStart
        };

        // Only report if page load is slow (>5s)
        if (timing.pageLoad > 5000) {
            this.reportMetric('SLOW_PAGE_LOAD', timing.pageLoad, timing);
        }
    }

    // Get resource type from URL
    getResourceType(url) {
        if (url.match(/\.(css)$/)) return 'stylesheet';
        if (url.match(/\.(js)$/)) return 'script';
        if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
        if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
        return 'other';
    }

    // Report metric (with reduced console noise)
    reportMetric(name, value, entry = null) {
        const timestamp = Date.now();
        const metric = {
            name,
            value,
            timestamp,
            entry,
            rating: this.getRating(name, value)
        };

        // Store metric
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name).push(metric);

        // Only log important metrics or poor performance
        const shouldLog = ['CLS', 'FID', 'LCP', 'FCP', 'TTFB'].includes(name) ||
            metric.rating === 'poor' ||
            name.startsWith('SLOW_');

        if (shouldLog) {
            const emoji = metric.rating === 'good' ? '✅' :
                metric.rating === 'needs-improvement' ? '⚠️' : '❌';

            Logger.info(`${emoji} ${name}: ${value}ms (${metric.rating})`);
        }

        // Dispatch custom event for React components
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('performance-metric', {
                detail: metric
            }));
        }
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
        return Object.fromEntries(this.metrics);
    }

    // Get metrics by name
    getMetricsByName(name) {
        return this.metrics.get(name) || [];
    }

    // Get latest metric
    getLatestMetric(name) {
        const metrics = this.getMetricsByName(name);
        return metrics[metrics.length - 1] || null;
    }

    // Cleanup observers
    cleanup() {
        this.observers.forEach((observer) => {
            try {
                observer.disconnect();
            } catch (e) {
                // Observer might already be disconnected
            }
        });
        this.observers.clear();
    }

    // Destroy instance
    destroy() {
        this.cleanup();
        this.metrics.clear();
        this.reportedResources.clear();
        this.isInitialized = false;
    }
}

// Global instance
let performanceMonitor = null;

// Initialize performance monitoring
export function initializePerformanceMonitoring() {
    if (!performanceMonitor) {
        performanceMonitor = new PerformanceMonitor();
    }
    performanceMonitor.initialize();
    return performanceMonitor;
}

// Get performance metrics
export function getPerformanceMetrics() {
    return performanceMonitor?.getMetrics() || {};
}

// Get latest metric
export function getLatestMetric(name) {
    return performanceMonitor?.getLatestMetric(name) || null;
}

// Report custom metric
export function reportCustomMetric(name, value, context = null) {
    performanceMonitor?.reportMetric(name, value, context);
}

// Measure function performance
export function measureFunction(fn, name) {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    if (duration > 16) { // Only report if >16ms (1 frame)
        reportCustomMetric(`FUNCTION_${name}`, duration);
    }

    return result;
}

// Measure async function performance
export async function measureAsyncFunction(fn, name) {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;

    if (duration > 100) { // Only report if >100ms for async
        reportCustomMetric(`ASYNC_${name}`, duration);
    }

    return result;
}

// React hook for performance metrics (removed React dependency)
export function usePerformanceMetric(metricName) {
    // This function is only for reference - actual React hook should be implemented in React components with proper React imports
    console.warn('usePerformanceMetric should be implemented in React components with proper React imports');
    return null;
}

// Cleanup performance monitoring
export function cleanupPerformanceMonitoring() {
    performanceMonitor?.cleanup();
}

// Destroy performance monitoring
export function destroyPerformanceMonitoring() {
    performanceMonitor?.destroy();
    performanceMonitor = null;
}

export default PerformanceMonitor; 