/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Add custom colors for calendar categories if needed
      },
      spacing: {
        // Add custom spacing for time slots
      },
      minHeight: {
        'touch-target': '44px', // Mobile touch target minimum
      },
      minWidth: {
        'touch-target': '44px',
      },
    },
  },
  plugins: [],
}
