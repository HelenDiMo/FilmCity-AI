/** @type {import('tailwindcss').Config}*/
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        film: {
          dark: "#0b0f17",
          card: "#111827",
          accent: "#e50914",
          gold: "#f59e0b",
        },
      },
    },
  },
  plugins: [],
};
