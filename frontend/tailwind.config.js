export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        card: "#1E293B",
        primary: "#4F46E5",
        secondary: "#7C3AED",
        accent: "#06B6D4",
        success: "#22C55E",
        danger: "#EF4444",
        text: "#F8FAFC",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 20px 80px rgba(79,70,229,.25)",
      },
    },
  },
  plugins: [],
};
