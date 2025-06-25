// Image optimization and lazy loading utility

class ImageOptimizer {
    // Compress image to WebP format if supported
    static getOptimizedImageUrl(originalUrl, options = {}) {
        const { width, height, quality = 85, format = 'webp' } = options;

        // If it's already a local image or if WebP is not supported, return original
        if (!originalUrl || originalUrl.startsWith('/') || !this.supportsWebP()) {
            return originalUrl;
        }

        // For external images, you could use a service like Cloudinary, Vercel Image Optimization, etc.
        // For now, return original but this is where you'd implement optimization
        return originalUrl;
    }

    // Check if browser supports WebP
    static supportsWebP() {
        if (typeof window === 'undefined') return false;

        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
    }

    // Lazy load image with intersection observer
    static createLazyImage(src, alt, className = '', placeholder = '') {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => resolve(img);
            img.onerror = reject;

            // Set attributes
            img.src = src;
            img.alt = alt;
            img.className = className;

            // Add loading attribute for native lazy loading
            img.loading = 'lazy';

            // Add placeholder while loading
            if (placeholder) {
                img.style.background = `url(${placeholder}) center/cover`;
            }
        });
    }

    // Preload critical images
    static preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    // Get responsive image sources
    static getResponsiveSources(baseSrc, sizes = [320, 640, 960, 1280]) {
        return sizes.map(size => ({
            srcSet: this.getOptimizedImageUrl(baseSrc, { width: size }),
            media: `(max-width: ${size}px)`
        }));
    }

    // Compress local images for better performance
    static async compressImage(file, maxWidth = 1920, quality = 0.8) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;

                // Draw and compress
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(resolve, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }
}

export default ImageOptimizer; 