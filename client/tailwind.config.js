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
        // New fadeIn animation keyframes
        fadeIn: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        spinSlow: 'spinSlow 20s linear infinite',
        pulseGlow: 'pulseGlow 2s ease-in-out infinite',
        // New fadeIn animation
        fadeIn: 'fadeIn 0.3s ease-out',
        'bounce-subtle': 'bounce 3s infinite',
        'fade-in': 'fadeIn 0.5s ease-in',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      scale: {
        '102': '1.02',
      },
    },
  },
  plugins: [],
};
