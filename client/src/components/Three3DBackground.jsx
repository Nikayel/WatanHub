import React from 'react';

// Lightweight CSS-based animated background (replaces heavy 3D components)
const Three3DBackground = ({ className = "" }) => {
    return (
        <div className={`absolute inset-0 overflow-hidden ${className}`} style={{ zIndex: -1 }}>
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 animate-pulse"
                style={{ animation: 'gradientShift 8s ease-in-out infinite' }} />

            {/* Floating CSS particles */}
            <div className="absolute inset-0">
                {/* CSS Stars */}
                {[...Array(30)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute bg-white rounded-full opacity-60"
                        style={{
                            width: Math.random() * 3 + 1 + 'px',
                            height: Math.random() * 3 + 1 + 'px',
                            left: Math.random() * 100 + '%',
                            top: Math.random() * 100 + '%',
                            animation: `twinkle ${Math.random() * 3 + 2}s infinite alternate`,
                            animationDelay: Math.random() * 2 + 's'
                        }}
                    />
                ))}

                {/* CSS Geometric shapes */}
                <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-indigo-500/20 rounded-lg transform rotate-45 animate-bounce"
                    style={{ animationDuration: '4s', animationDelay: '0s' }} />
                <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-purple-500/20 rounded-full animate-pulse"
                    style={{ animationDuration: '3s', animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-3/4 w-4 h-4 bg-blue-500/20 transform rotate-12 animate-bounce"
                    style={{ animationDuration: '5s', animationDelay: '2s' }} />
                <div className="absolute bottom-1/4 left-1/2 w-5 h-5 bg-cyan-500/20 rounded-lg transform -rotate-45 animate-pulse"
                    style={{ animationDuration: '4s', animationDelay: '1.5s' }} />
            </div>

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes gradientShift {
                    0%, 100% { 
                        background: linear-gradient(135deg, #1e1b4b, #1e3a8a, #581c87);
                    }
                    50% { 
                        background: linear-gradient(135deg, #1e3a8a, #581c87, #1e1b4b);
                    }
                }
                
                @keyframes twinkle {
                    0% { opacity: 0.3; transform: scale(1); }
                    100% { opacity: 1; transform: scale(1.2); }
                }
                
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(180deg); }
                }
            `}</style>
        </div>
    );
};

export default Three3DBackground; 