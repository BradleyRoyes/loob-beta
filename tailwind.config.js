/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}', // Include all pages
    './components/**/*.{js,ts,jsx,tsx}', // Include all components
    './styles/**/*.css', // Include custom styles
    './layouts/**/*.{js,ts,jsx,tsx}', // Include layouts
    './lib/**/*.{js,ts,jsx,tsx}', // Include utility libraries
  ],
  theme: {
    extend: {
      fontSize: {
        sm: '0.875rem', // Compact size for small text
        base: '1rem', // Default size for body text
        lg: '1.125rem', // Slightly larger for headings
      },
      spacing: {
        sm: '0.4rem', // Small spacing for compact designs
        md: '0.5rem', // Medium spacing
        lg: '1rem', // Larger spacing for broader areas
      },
      colors: {
        primary: '#007AFF', // App primary color (blue for buttons, etc.)
        secondary: '#34C759', // Accent color (green for success, etc.)
        neutral: {
          light: '#F5F5F5', // Light backgrounds
          dark: '#121212', // Dark backgrounds
        },
        danger: '#FF3B30', // Red for errors
        success: '#4CD964', // Green for success messages
      },
      fontFamily: {
        sans: ['Nunito', 'Varela Round', 'sans-serif'], // Main font family
        display: ['Inter', 'sans-serif'], // Secondary font family
      },
      screens: {
        xs: '375px', // Small devices like iPhone SE
        sm: '640px', // Small tablets or large phones
        md: '768px', // Tablets
        lg: '1024px', // Laptops
        xl: '1280px', // Desktops
        '2xl': '1536px', // Larger desktops
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Form controls styling
    require('@tailwindcss/typography'), // Prose content styling
    require('@tailwindcss/aspect-ratio'), // Aspect ratio utilities
    require('@tailwindcss/line-clamp'), // Text truncation utilities
  ],
  future: {
    hoverOnlyWhenSupported: true, // Optimize hover behavior for touch devices
  },
};
