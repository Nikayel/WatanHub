// Performance optimization utilities

import { useCallback, useRef, useEffect, useMemo, useState } from 'react';

class PerformanceUtils {
    // Debounce function to limit API calls
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    // Throttle function for scroll events
    static throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Memory cleanup utility
    static createCleanupManager() {
        const timeouts = new Set();
        const intervals = new Set();
        const eventListeners = new Set();
        const subscriptions = new Set();

        return {
            setTimeout(callback, delay) {
                const id = setTimeout(() => {
                    timeouts.delete(id);
                    callback();
                }, delay);
                timeouts.add(id);
                return id;
            },

            setInterval(callback, delay) {
                const id = setInterval(callback, delay);
                intervals.add(id);
                return id;
            },

            addEventListener(element, event, handler, options) {
                element.addEventListener(event, handler, options);
                eventListeners.add({ element, event, handler, options });
            },

            addSubscription(subscription) {
                subscriptions.add(subscription);
            },

            cleanup() {
                timeouts.forEach(id => clearTimeout(id));
                intervals.forEach(id => clearInterval(id));
                eventListeners.forEach(({ element, event, handler }) => {
                    element.removeEventListener(event, handler);
                });
                subscriptions.forEach(sub => {
                    if (typeof sub.unsubscribe === 'function') {
                        sub.unsubscribe();
                    } else if (typeof sub === 'function') {
                        sub();
                    }
                });

                timeouts.clear();
                intervals.clear();
                eventListeners.clear();
                subscriptions.clear();
            }
        };
    }

    // Intersection Observer for lazy loading
    static createIntersectionObserver(callback, options = {}) {
        const defaultOptions = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1,
            ...options
        };

        return new IntersectionObserver(callback, defaultOptions);
    }

    // Virtual scrolling helper for large lists
    static calculateVirtualItems(containerHeight, itemHeight, totalItems, scrollTop) {
        const visibleCount = Math.ceil(containerHeight / itemHeight);
        const startIndex = Math.floor(scrollTop / itemHeight);
        const endIndex = Math.min(startIndex + visibleCount + 1, totalItems - 1);

        return {
            startIndex: Math.max(0, startIndex - 1),
            endIndex,
            visibleCount,
            offsetY: startIndex * itemHeight
        };
    }

    // Bundle size analyzer (for development)
    static analyzeBundleSize() {
        if (process.env.NODE_ENV === 'development') {
            const scripts = document.querySelectorAll('script[src]');
            let totalSize = 0;

            scripts.forEach(script => {
                fetch(script.src, { method: 'HEAD' })
                    .then(response => {
                        const size = response.headers.get('content-length');
                        if (size) {
                            totalSize += parseInt(size);
                            console.log(`Script: ${script.src.split('/').pop()} - ${(size / 1024).toFixed(2)}KB`);
                        }
                    })
                    .catch(() => { }); // Ignore CORS errors
            });

            setTimeout(() => {
                console.log(`Total estimated bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
            }, 1000);
        }
    }
}

// Custom hooks for performance optimization

// Hook to prevent unnecessary re-renders
export const useStableCallback = (callback, deps) => {
    return useCallback(callback, deps);
};

// Hook to memoize expensive calculations
export const useStableMemo = (factory, deps) => {
    return useMemo(factory, deps);
};

// Hook for cleanup management
export const useCleanup = () => {
    const cleanupManager = useRef(PerformanceUtils.createCleanupManager());

    useEffect(() => {
        return () => {
            cleanupManager.current.cleanup();
        };
    }, []);

    return cleanupManager.current;
};

// Hook for intersection observer
export const useIntersectionObserver = (callback, options) => {
    const observerRef = useRef();

    useEffect(() => {
        observerRef.current = PerformanceUtils.createIntersectionObserver(callback, options);
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [callback, options]);

    const observe = useCallback((element) => {
        if (observerRef.current && element) {
            observerRef.current.observe(element);
        }
    }, []);

    const unobserve = useCallback((element) => {
        if (observerRef.current && element) {
            observerRef.current.unobserve(element);
        }
    }, []);

    return { observe, unobserve };
};

// Hook for debounced values
export const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

export default PerformanceUtils; 