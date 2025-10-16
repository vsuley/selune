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
      boxShadow: {
        "neon-pink":
          "0 0 10px rgba(255, 0, 110, 0.5), 0 0 20px rgba(255, 0, 110, 0.3)",
        "neon-purple":
          "0 0 10px rgba(131, 56, 236, 0.5), 0 0 20px rgba(131, 56, 236, 0.3)",
        "neon-blue":
          "0 0 10px rgba(58, 134, 255, 0.5), 0 0 20px rgba(58, 134, 255, 0.3)",
        "neon-teal":
          "0 0 10px rgba(6, 255, 165, 0.5), 0 0 20px rgba(6, 255, 165, 0.3)",
      },
    },
  },
  plugins: [],
};
