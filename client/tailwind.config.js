/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      spacing: {
        // Time slot heights (60px per hour = 1px per minute)
        hour: "60px",
        "half-hour": "30px",
        "quarter-hour": "15px",
      },
      minHeight: {
        "touch-target": "44px", // Mobile touch target minimum
      },
      minWidth: {
        "touch-target": "44px",
      },
    },
  },
  plugins: [],
};
