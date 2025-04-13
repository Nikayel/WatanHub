// tailwind.config.js
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
      extend: {
        colors: {
          primary: '#3B82F6',       // A polished blue for primary actions
          secondary: '#10B981',     // A refreshing green accent
          background: '#F9FAFB',    // Soft, light background
          darkGlass: 'rgba(31, 41, 55, 0.8)', // For dark translucent effects
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'], // Modern, professional sans-serif
        },
        keyframes: {
          spinSlow: {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
          pulseGlow: {
            '0%, 100%': { boxShadow: '0 0 0px rgba(16,185,129, 0.5)' },
            '50%': { boxShadow: '0 0 10px rgba(16,185,129, 1)' },
          },
        },
        animation: {
          spinSlow: 'spinSlow 20s linear infinite',
          pulseGlow: 'pulseGlow 2s ease-in-out infinite',
        },
      },
    },
    plugins: [],
  };
  