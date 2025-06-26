import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({
    src,
    alt,
    className = '',
    placeholder = null,
    quality = 'medium',
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [error, setError] = useState(false);
    const imgRef = useRef();

    // Intersection Observer for lazy loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            },
            {
                threshold: 0.1,
                rootMargin: '50px' // Start loading 50px before image comes into view
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Quality-based image optimization
    const getOptimizedSrc = (originalSrc, quality) => {
        // For now, return original src - in production you'd want to use a CDN
        // with query parameters like ?quality=80&format=webp
        return originalSrc;
    };

    // Placeholder component
    const Placeholder = () => (
        placeholder || (
            <div className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}>
                <svg
                    className="w-8 h-8 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
            </div>
        )
    );

    // Error fallback
    const ErrorFallback = () => (
        <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
            <div className="text-center text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p className="text-xs">Image failed to load</p>
            </div>
        </div>
    );

    if (error) {
        return <ErrorFallback />;
    }

    return (
        <div ref={imgRef} className={className}>
            {!isInView ? (
                <Placeholder />
            ) : (
                <>
                    {!isLoaded && <Placeholder />}
                    <img
                        src={getOptimizedSrc(src, quality)}
                        alt={alt}
                        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0 absolute'
                            } ${className}`}
                        onLoad={() => setIsLoaded(true)}
                        onError={() => setError(true)}
                        loading="lazy"
                        {...props}
                    />
                </>
            )}
        </div>
    );
};

export default LazyImage; 