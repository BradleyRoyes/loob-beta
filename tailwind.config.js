/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.css',
    './layouts/**/*.{js,ts,jsx,tsx}', // Example: Add other folders
    './lib/**/*.{js,ts,jsx,tsx}', // Example: Add lib files if used
  ],
  
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        vareal: ["Varela Round", "normal"],
        sans: ["var(--font-geist-sans)"],
      },
      screens: {
        origin: "800px",
      },
    },
  },
  plugins: [],
};