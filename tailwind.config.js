/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.css',
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