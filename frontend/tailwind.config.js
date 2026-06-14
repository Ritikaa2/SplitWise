export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#080B12",
        card: "#111827",
        primary: "#2DD4BF",
        secondary: "#FB923C",
        accent: "#60A5FA",
        success: "#34D399",
        danger: "#FB7185",
        warning: "#FBBF24",
        text: "#F7FBFF",
        ink: "#F7FBFF",
        mist: "#273241",
        cream: "#111827",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 18px 50px rgba(45, 212, 191, .24)",
        card: "0 20px 64px rgba(0, 0, 0, .34)",
        lift: "0 26px 80px rgba(0, 0, 0, .42)",
      },
    },
  },
  plugins: [],
};
