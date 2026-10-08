/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          darkest: '#0A1931',
          light: '#B3CFE5',
          medium: '#4A7FA7',
          deep: '#1A3D63',
          bg: '#F6FAFD'
        }
      }
    },
  },
  plugins: [],
}
