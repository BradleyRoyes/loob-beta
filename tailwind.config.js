/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}', // If using the App Router
    './components/**/*.{js,ts,jsx,tsx}',
    './layouts/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.css',
  ],  
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'Varela Round', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        header: ['Modulus Pro', 'sans-serif'], // Add Modulus Pro font
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
        header: '4rem', // Custom header height for offset
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        'favicon': '10px', // Custom size for favicon
      },
      colors: {
        primary: '#2563EB',
        secondary: '#10B981',
        danger: '#EF4444',
        success: '#22C55E',
        neutral: {
          light: '#F9FAFB',
          DEFAULT: '#9CA3AF',
          dark: '#1F2937',
        },
        background: {
          light: '#FFFFFF',
          dark: '#121212',
        },
      },
      screens: {
        'xs': '360px',
        sm: '480px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.15)',
        xl: '0 20px 25px rgba(0, 0, 0, 0.2)',
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
  corePlugins: {
    container: true, // Enable container utility
  },
  future: {
    hoverOnlyWhenSupported: true,
  },
};
