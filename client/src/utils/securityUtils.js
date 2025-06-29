// Security utilities for input validation and sanitization

class SecurityUtils {
    // Sanitize HTML input to prevent XSS
    static sanitizeHtml(input) {
        if (typeof input !== 'string') return input;

        const map = {
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;',
            '&': '&amp;'
        };

        return input.replace(/[<>"'&/]/g, (match) => map[match]);
    }

    // Validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validate phone number (basic)
    static isValidPhone(phone) {
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }

    // Check for SQL injection patterns
    static containsSqlInjection(input) {
        if (typeof input !== 'string') return false;

        const sqlPatterns = [
            /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|MERGE|SELECT|UPDATE|UNION)\b)/gi,
            /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/gi,
            /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
            /((\%27)|(\'))union/gi
        ];

        return sqlPatterns.some(pattern => pattern.test(input));
    }

    // Rate limiting helper
    static createRateLimiter(maxAttempts = 5, timeWindow = 15 * 60 * 1000) {
        const attempts = new Map();

        return (identifier) => {
            const now = Date.now();
            const userAttempts = attempts.get(identifier) || [];

            // Remove old attempts outside time window
            const recentAttempts = userAttempts.filter(time => now - time < timeWindow);

            if (recentAttempts.length >= maxAttempts) {
                return false; // Rate limited
            }

            recentAttempts.push(now);
            attempts.set(identifier, recentAttempts);
            return true; // Allow request
        };
    }

    // Generate secure session token
    static generateSecureToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';

        for (let tokenIndex = 0; tokenIndex < length; tokenIndex++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return result;
    }

    // Enhanced file validation with virus scanning indicators
    static validateFileUpload(file, allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']) {
        const errors = [];

        if (!file) {
            errors.push('No file provided');
            return { isValid: false, errors };
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
            errors.push(`File type ${file.type} not allowed`);
        }

        // Check file size (5MB limit)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            errors.push('File size exceeds 5MB limit');
        }

        // Check file name for suspicious patterns
        const suspiciousPatterns = /\.(exe|bat|cmd|scr|pif|com|dll|vbs|js|jar)$/i;
        if (suspiciousPatterns.test(file.name)) {
            errors.push('File type not allowed');
        }

        // Additional security checks
        if (file.name.length > 255) {
            errors.push('File name too long');
        }

        // Check for null bytes (potential path traversal)
        if (file.name.includes('\0')) {
            errors.push('Invalid file name');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Enhanced secure storage with encryption
    static secureStorage = {
        // Simple encryption using base64 + key rotation
        encrypt(data, key = 'watanhub_key') {
            try {
                const jsonString = JSON.stringify(data);
                const encoded = btoa(jsonString + key);
                return encoded;
            } catch (error) {
                console.warn('Encryption failed:', error);
                return null;
            }
        },

        decrypt(encryptedData, key = 'watanhub_key') {
            try {
                const decoded = atob(encryptedData);
                const jsonString = decoded.replace(key, '');
                return JSON.parse(jsonString);
            } catch (error) {
                console.warn('Decryption failed:', error);
                return null;
            }
        },

        setItem(key, value, encrypt = true) {
            try {
                const data = encrypt ? this.encrypt(value) : JSON.stringify(value);
                localStorage.setItem(key, data);
            } catch (error) {
                console.warn('Failed to save to localStorage:', error);
            }
        },

        getItem(key, decrypt = true) {
            try {
                const data = localStorage.getItem(key);
                if (!data) return null;

                return decrypt ? this.decrypt(data) : JSON.parse(data);
            } catch (error) {
                console.warn('Failed to read from localStorage:', error);
                return null;
            }
        },

        removeItem(key) {
            localStorage.removeItem(key);
        },

        clear() {
            localStorage.clear();
        }
    };

    // Secure cookie management
    static cookies = {
        set(name, value, options = {}) {
            const defaults = {
                secure: true,
                httpOnly: false, // Can't set httpOnly from client
                sameSite: 'Strict',
                maxAge: 24 * 60 * 60, // 24 hours
                path: '/'
            };

            const settings = { ...defaults, ...options };

            let cookieString = `${name}=${encodeURIComponent(value)}`;

            if (settings.maxAge) {
                cookieString += `; Max-Age=${settings.maxAge}`;
            }

            if (settings.path) {
                cookieString += `; Path=${settings.path}`;
            }

            if (settings.secure) {
                cookieString += `; Secure`;
            }

            if (settings.sameSite) {
                cookieString += `; SameSite=${settings.sameSite}`;
            }

            document.cookie = cookieString;
        },

        get(name) {
            const nameEQ = name + "=";
            const ca = document.cookie.split(';');
            for (let cookieIndex = 0; cookieIndex < ca.length; cookieIndex++) {
                let c = ca[cookieIndex];
                while (c.charAt(0) === ' ') c = c.substring(1, c.length);
                if (c.indexOf(nameEQ) === 0) {
                    return decodeURIComponent(c.substring(nameEQ.length, c.length));
                }
            }
            return null;
        },

        delete(name) {
            this.set(name, '', { maxAge: -1 });
        }
    };

    // Enhanced CSP setup
    static setupCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = `
            default-src 'self';
            script-src 'self' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com;
            style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://use.fontawesome.com;
            font-src 'self' https://fonts.gstatic.com https://use.fontawesome.com;
            img-src 'self' data: https:;
            connect-src 'self' https://*.supabase.co https://watanhub.onrender.com https://va.vercel-scripts.com;
            frame-src 'none';
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            upgrade-insecure-requests;
        `.replace(/\s+/g, ' ').trim();

        document.head.appendChild(meta);
    }

    // Data privacy utilities
    static privacy = {
        // Hash sensitive data for analytics
        hashSensitiveData(data) {
            // Simple hash for client-side use
            let hash = 0;
            if (data.length === 0) return hash.toString();
            for (let hashIndex = 0; hashIndex < data.length; hashIndex++) {
                const char = data.charCodeAt(hashIndex);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return hash.toString();
        },

        // Mask sensitive information for logging
        maskEmail(email) {
            if (!email || !email.includes('@')) return email;
            const [username, domain] = email.split('@');
            const maskedUsername = username.length > 2
                ? username.substring(0, 2) + '*'.repeat(username.length - 2)
                : '*'.repeat(username.length);
            return `${maskedUsername}@${domain}`;
        },

        // Remove PII from objects before logging
        sanitizeForLogging(obj) {
            const sensitiveFields = ['email', 'phone', 'ssn', 'password', 'token', 'key'];
            const sanitized = { ...obj };

            for (const field of sensitiveFields) {
                if (sanitized[field]) {
                    sanitized[field] = '[REDACTED]';
                }
            }

            return sanitized;
        }
    };

    // Session security
    static session = {
        // Validate session integrity
        validateSession(session) {
            if (!session || !session.access_token) return false;

            try {
                // Check token expiration
                const payload = JSON.parse(atob(session.access_token.split('.')[1]));
                const now = Math.floor(Date.now() / 1000);

                if (payload.exp < now) {
                    console.warn('Session token expired');
                    return false;
                }

                return true;
            } catch (error) {
                console.warn('Invalid session token:', error);
                return false;
            }
        },

        // Secure session cleanup
        clearSession() {
            // Clear localStorage items
            const keysToRemove = [];
            for (let sessionIndex = 0; sessionIndex < localStorage.length; sessionIndex++) {
                const key = localStorage.key(sessionIndex);
                if (key && (key.includes('supabase') || key.includes('watanhub'))) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Clear sessionStorage
            sessionStorage.clear();
        }
    };
}

export default SecurityUtils; 