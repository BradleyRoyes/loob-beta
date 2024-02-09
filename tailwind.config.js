/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
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
