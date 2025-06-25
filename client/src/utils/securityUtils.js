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

        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return result;
    }

    // Validate file upload security
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

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Secure localStorage wrapper
    static secureStorage = {
        setItem(key, value, encrypt = false) {
            try {
                const data = encrypt ? btoa(JSON.stringify(value)) : JSON.stringify(value);
                localStorage.setItem(key, data);
            } catch (error) {
                console.warn('Failed to save to localStorage:', error);
            }
        },

        getItem(key, decrypt = false) {
            try {
                const data = localStorage.getItem(key);
                if (!data) return null;

                return decrypt ? JSON.parse(atob(data)) : JSON.parse(data);
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

    // Content Security Policy helper
    static setupCSP() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://vercel.live;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https:;
      connect-src 'self' https://*.supabase.co https://watanhub.onrender.com;
      frame-src 'none';
    `.replace(/\s+/g, ' ').trim();

        document.head.appendChild(meta);
    }
}

export default SecurityUtils; 