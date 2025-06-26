// Environment configuration with security considerations

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

// Validate required environment variables
const requiredEnvVars = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Configuration object
const config = {
    // Environment flags
    isDevelopment,
    isProduction,
    isTest,

    // API Configuration
    api: {
        baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
        timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || 10000,
        retries: parseInt(process.env.REACT_APP_API_RETRIES) || 3
    },

    // Supabase Configuration
    supabase: {
        url: process.env.REACT_APP_SUPABASE_URL,
        anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
        // Enhanced security and session management options
        options: {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: false, // Prevent state inconsistencies from URL
                storageKey: 'watanhub-auth',
                storage: {
                    getItem: (key) => {
                        try {
                            return localStorage.getItem(key);
                        } catch {
                            return null;
                        }
                    },
                    setItem: (key, value) => {
                        try {
                            localStorage.setItem(key, value);
                        } catch {
                            // Ignore storage errors
                        }
                    },
                    removeItem: (key) => {
                        try {
                            localStorage.removeItem(key);
                        } catch {
                            // Ignore storage errors
                        }
                    }
                },
                // Additional security headers
                flowType: 'pkce'
            },
            global: {
                headers: {
                    'X-Client-Info': 'watanhub-web',
                    ...(isProduction ? {
                        'X-Client-Version': config.app.version
                    } : {})
                }
            },
            // Add request timeout
            fetch: (url, options) => {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                return fetch(url, {
                    ...options,
                    signal: controller.signal
                }).finally(() => clearTimeout(timeoutId));
            }
        }
    },

    // Logging Configuration
    logging: {
        enabled: isDevelopment,
        level: isDevelopment ? 'debug' : 'error',
        console: isDevelopment,
        remote: isProduction // Enable remote logging in production
    },

    // Security Configuration
    security: {
        enableCSP: isProduction,
        strictMode: isProduction,
        validateInputs: true,
        rateLimiting: {
            enabled: isProduction,
            maxAttempts: 5,
            windowMs: 15 * 60 * 1000 // 15 minutes
        }
    },

    // Performance Configuration
    performance: {
        enableAnalytics: isProduction,
        bundleAnalyzer: isDevelopment,
        imageOptimization: isProduction,
        lazyLoading: true,
        caching: {
            enabled: isProduction,
            duration: 24 * 60 * 60 * 1000 // 24 hours
        }
    },

    // Feature Flags
    features: {
        aiAdvisor: true,
        profileAnalysis: true,
        blogSystem: true,
        mentorDashboard: true,
        adminDashboard: true,
        fileUpload: true,
        notifications: true
    },

    // Application Metadata
    app: {
        name: 'WatanHub',
        version: process.env.REACT_APP_VERSION || '1.0.0',
        buildTime: process.env.REACT_APP_BUILD_TIME || new Date().toISOString(),
        homepage: 'https://watanhub.org',
        supportEmail: 'support@watanhub.org'
    }
};

// Validation functions
export const validateConfig = () => {
    const errors = [];

    if (!config.supabase.url.startsWith('https://')) {
        errors.push('Supabase URL must use HTTPS');
    }

    if (config.supabase.anonKey.length < 100) {
        errors.push('Supabase anonymous key appears to be invalid');
    }

    if (isProduction && config.api.baseUrl.includes('localhost')) {
        errors.push('Production build should not use localhost API URL');
    }

    return errors;
};

// Initialize configuration validation
if (isProduction) {
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
        throw new Error(`Configuration validation failed: ${configErrors.join(', ')}`);
    }
}

export default config; 