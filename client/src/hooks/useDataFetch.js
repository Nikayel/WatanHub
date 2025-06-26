// Enhanced Data Fetching Hook with Caching and Session Management
import { useState, useEffect, useRef, useCallback } from 'react';
import { apiCache } from '../lib/CacheManager';
import { sessionManager } from '../lib/SessionManager';
import Logger from '../utils/logger';

export const useDataFetch = (
    key,
    fetchFn,
    options = {}
) => {
    const {
        cacheTTL = 5 * 60 * 1000, // 5 minutes default
        retryAttempts = 3,
        retryDelay = 1000,
        revalidateOnFocus = true,
        revalidateOnReconnect = true,
        enabled = true,
        deps = []
    } = options;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);

    const abortControllerRef = useRef();
    const retryTimeoutRef = useRef();
    const isComponentMounted = useRef(true);

    // Create abort controller for cancelling requests
    const createAbortController = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        return abortControllerRef.current;
    }, []);

    // Enhanced fetch function with retry logic
    const fetchData = useCallback(async (forceFresh = false, retryCount = 0) => {
        if (!enabled || !isComponentMounted.current) return;

        try {
            setLoading(true);
            setError(null);

            const controller = createAbortController();

            // Check cache first (unless forcing fresh data)
            if (!forceFresh) {
                const cachedData = apiCache.cache.get(key);
                if (cachedData) {
                    setData(cachedData);
                    setLoading(false);
                    setLastFetch(Date.now());
                    Logger.debug(`Using cached data for: ${key}`);
                    return cachedData;
                }
            }

            // Create fetch function with abort signal
            const fetchWithAbort = async () => {
                const result = await fetchFn({
                    signal: controller.signal
                });
                return result;
            };

            Logger.debug(`Fetching fresh data for: ${key}`);

            // Use API cache wrapper
            const result = await apiCache.fetch(
                key,
                fetchWithAbort,
                cacheTTL
            );

            if (isComponentMounted.current) {
                setData(result);
                setLastFetch(Date.now());
                Logger.debug(`Successfully fetched data for: ${key}`);
            }

            return result;

        } catch (err) {
            if (err.name === 'AbortError') {
                Logger.debug(`Request aborted for: ${key}`);
                return;
            }

            Logger.error(`Fetch error for ${key}:`, err);

            // Retry logic
            if (retryCount < retryAttempts && isComponentMounted.current) {
                const delay = retryDelay * Math.pow(2, retryCount); // Exponential backoff
                Logger.debug(`Retrying ${key} in ${delay}ms (attempt ${retryCount + 1}/${retryAttempts})`);

                retryTimeoutRef.current = setTimeout(() => {
                    fetchData(forceFresh, retryCount + 1);
                }, delay);

                return;
            }

            if (isComponentMounted.current) {
                setError(err);
            }
        } finally {
            if (isComponentMounted.current) {
                setLoading(false);
            }
        }
    }, [key, fetchFn, enabled, cacheTTL, retryAttempts, retryDelay, createAbortController]);

    // Manual refresh function
    const refresh = useCallback(() => {
        fetchData(true);
    }, [fetchData]);

    // Invalidate cache for this key
    const invalidate = useCallback(() => {
        apiCache.cache.invalidate(key);
        fetchData(true);
    }, [key, fetchData]);

    // Setup focus revalidation
    useEffect(() => {
        if (!revalidateOnFocus) return;

        const handleFocus = () => {
            // Only revalidate if data is older than 30 seconds
            if (lastFetch && Date.now() - lastFetch > 30000) {
                Logger.debug(`Revalidating on focus: ${key}`);
                fetchData(true);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [revalidateOnFocus, lastFetch, key, fetchData]);

    // Setup online/offline revalidation
    useEffect(() => {
        if (!revalidateOnReconnect) return;

        const handleOnline = () => {
            Logger.debug(`Revalidating on reconnect: ${key}`);
            fetchData(true);
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [revalidateOnReconnect, key, fetchData]);

    // Setup session manager listener
    useEffect(() => {
        const removeListener = sessionManager.addListener((event) => {
            if (event === 'session_expired' || event === 'force_logout') {
                // Clear cache when session expires
                apiCache.cache.invalidate(key);
                setData(null);
                setError(new Error('Session expired'));
            } else if (event === 'token_refreshed') {
                // Revalidate data after token refresh
                fetchData(true);
            }
        });

        return removeListener;
    }, [key, fetchData]);

    // Initial fetch and dependency changes
    useEffect(() => {
        if (enabled) {
            fetchData();
        } else {
            setLoading(false);
        }

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, [enabled, ...deps]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isComponentMounted.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

    return {
        data,
        loading,
        error,
        refresh,
        invalidate,
        lastFetch: lastFetch ? new Date(lastFetch) : null
    };
};

// Hook for mutations with cache invalidation
export const useMutation = (
    mutationFn,
    options = {}
) => {
    const {
        onSuccess,
        onError,
        invalidateKeys = []
    } = options;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mutate = useCallback(async (variables) => {
        try {
            setLoading(true);
            setError(null);

            const result = await mutationFn(variables);

            // Invalidate specified cache keys
            invalidateKeys.forEach(key => {
                if (typeof key === 'string') {
                    apiCache.cache.invalidate(key);
                } else if (key instanceof RegExp) {
                    apiCache.cache.invalidatePattern(key.source);
                }
            });

            if (onSuccess) {
                onSuccess(result, variables);
            }

            return result;
        } catch (err) {
            setError(err);
            if (onError) {
                onError(err, variables);
            }
            throw err;
        } finally {
            setLoading(false);
        }
    }, [mutationFn, onSuccess, onError, invalidateKeys]);

    return {
        mutate,
        loading,
        error
    };
};

export default useDataFetch; 