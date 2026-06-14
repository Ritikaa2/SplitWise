export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F4F1EA",
        card: "#FFFFFF",
        primary: "#146C5D",
        secondary: "#C65F46",
        accent: "#315F8C",
        success: "#24835B",
        danger: "#B6403A",
        warning: "#B7791F",
        text: "#17211F",
        ink: "#17211F",
        mist: "#E7E1D6",
        cream: "#FBFAF7",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 18px 45px rgba(20, 108, 93, .22)",
        card: "0 18px 45px rgba(23, 33, 31, .10)",
        lift: "0 20px 50px rgba(23, 33, 31, .16)",
      },
    },
  },
  plugins: [],
};
