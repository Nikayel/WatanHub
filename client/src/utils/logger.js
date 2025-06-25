// Production-safe logging utility
const isDevelopment = process.env.NODE_ENV === 'development';

class Logger {
    static log(...args) {
        if (isDevelopment) {
            console.log(...args);
        }
    }

    static error(...args) {
        if (isDevelopment) {
            console.error(...args);
        } else {
            // In production, you might want to send errors to a logging service
            // Example: sendToErrorTrackingService(args);
        }
    }

    static warn(...args) {
        if (isDevelopment) {
            console.warn(...args);
        }
    }

    static info(...args) {
        if (isDevelopment) {
            console.info(...args);
        }
    }

    static debug(...args) {
        if (isDevelopment) {
            console.debug(...args);
        }
    }
}

export default Logger; 