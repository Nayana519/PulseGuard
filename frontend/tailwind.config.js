/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50: '#f0f9ff', 500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1' },
        danger:  { 50: '#fff1f2', 500: '#f43f5e', 600: '#e11d48' },
        warn:    { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706' },
        safe:    { 50: '#f0fdf4', 500: '#22c55e', 600: '#16a34a' },
      }
    }
  },
  plugins: []
}