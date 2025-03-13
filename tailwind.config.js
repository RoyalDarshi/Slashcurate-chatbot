/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "selector",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      animation: {
        fade: "fadeIn 0.5s ease-in-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          light: "#8B5CF6",
          dark: "#A78BFA",
        },
      },
      ringColor: {
        accent: {
          light: "#8B5CF6",
          dark: "#A78BFA",
        },
      },
    },
  },
  plugins: [],
};