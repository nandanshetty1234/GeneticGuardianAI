/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // scan all React files in src
    "./public/index.html"
  ],
  theme: {
    extend: {
      animation: {
      'spin-slow': 'spin 5s linear infinite',
    },
    },
  },
  plugins: [],
}

