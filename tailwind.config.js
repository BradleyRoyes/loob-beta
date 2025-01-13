/** @type {import('tailwindcss').Config} */
module.exports = {
  // Define the paths to all template files for tree-shaking unused styles
  content: [
    './pages/**/*.{js,ts,jsx,tsx}', // Pages
    './components/**/*.{js,ts,jsx,tsx}', // Components
    './layouts/**/*.{js,ts,jsx,tsx}', // Layouts
    './lib/**/*.{js,ts,jsx,tsx}', // Libraries
    './styles/**/*.css', // Global and custom styles
  ],
  theme: {
    extend: {
      // Responsive font sizes for better mobile UX
      fontSize: {
        xs: '0.75rem', // Extra small for captions
        sm: '0.875rem', // Small text
        base: '1rem', // Default body text
        lg: '1.125rem', // Larger text for emphasis
        xl: '1.25rem', // Headings
        '2xl': '1.5rem', // Larger headings
      },
      spacing: {
        xs: '0.25rem', // Extra small spacing
        sm: '0.5rem', // Small spacing
        md: '0.75rem', // Medium spacing
        lg: '1rem', // Larger spacing
        xl: '1.5rem', // Extra large spacing
        '2xl': '2rem', // Larger layouts
      },
      colors: {
        primary: '#2563EB', // Primary blue
        secondary: '#10B981', // Accent green
        danger: '#EF4444', // Error red
        success: '#22C55E', // Success green
        neutral: {
          light: '#F9FAFB', // Light gray
          DEFAULT: '#9CA3AF', // Neutral gray
          dark: '#1F2937', // Dark gray
        },
        background: {
          light: '#FFFFFF', // Light background
          dark: '#121212', // Dark background (mobile-first)
        },
      },
      fontFamily: {
        sans: ['Nunito', 'Varela Round', 'sans-serif'], // Primary font
        display: ['Inter', 'sans-serif'], // Headings and special use cases
      },
      // Custom screen breakpoints
      screens: {
        xs: '360px', // Small devices (e.g., iPhone SE)
        sm: '480px', // Small phones
        md: '768px', // Tablets
        lg: '1024px', // Laptops
        xl: '1280px', // Desktops
        '2xl': '1440px', // Larger desktops
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.05)', // Subtle shadow
        md: '0 4px 6px rgba(0, 0, 0, 0.1)', // Medium shadow
        lg: '0 10px 15px rgba(0, 0, 0, 0.15)', // Larger shadow
        xl: '0 20px 25px rgba(0, 0, 0, 0.2)', // Bold shadow
      },
      borderRadius: {
        sm: '0.375rem', // Small radius
        DEFAULT: '0.5rem', // Default radius
        lg: '1rem', // Large radius
        xl: '1.5rem', // Extra large radius
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'), // Improved form control styles
    require('@tailwindcss/typography'), // Prose content
    require('@tailwindcss/aspect-ratio'), // Aspect ratio utilities
    require('@tailwindcss/line-clamp'), // Line clamping for truncating text
  ],
  corePlugins: {
    container: false, // Use custom container styles for mobile
  },
  future: {
    hoverOnlyWhenSupported: true, // Prevent hover states on touch devices
  },
};
