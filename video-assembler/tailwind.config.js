/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette
        primary: {
          DEFAULT: '#3B82F6', // blue-500
          dark: '#2563EB',    // blue-600
          light: '#60A5FA'    // blue-400
        },
        secondary: {
          DEFAULT: '#6B7280', // gray-500
          dark: '#4B5563',    // gray-600
          light: '#9CA3AF'    // gray-400
        },
        background: {
          primary: '#111827',   // gray-900
          secondary: '#1F2937', // gray-800
          tertiary: '#374151'   // gray-700
        }
      },
      spacing: {
        // Custom spacing for timeline
        'timeline-height': '200px',
        'track-height': '80px',
        'preview-height': '400px'
      },
      zIndex: {
        // Custom z-index values
        'timeline-segment': '10',
        'timeline-playhead': '20',
        'modal': '50',
        'tooltip': '40',
        'dropdown': '30'
      },
      animation: {
        // Custom animations
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'progress': 'progress 1s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' }
        }
      }
    }
  },
  plugins: [
    // Add custom utilities
    function({ addUtilities }) {
      const newUtilities = {
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        },
        '.timeline-segment': {
          'user-select': 'none',
          'touch-action': 'none'
        },
        '.text-shadow': {
          'text-shadow': '0 2px 4px rgba(0,0,0,0.1)'
        }
      };
      addUtilities(newUtilities);
    }
  ]
};