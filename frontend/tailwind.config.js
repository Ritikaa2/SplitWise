export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#10b981",
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        accent: {
          DEFAULT: "#6366f1",
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
        },
        surface: {
          DEFAULT: "#0f1117",
          secondary: "#1a1d27",
          tertiary: "#252836",
          hover: "#2d3142",
        },
        ink: {
          DEFAULT: "#f1f5f9",
          light: "#cbd5e1",
          lighter: "#94a3b8",
          muted: "#64748b",
          border: "#2d3142",
        },
        success: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -2px rgba(0,0,0,0.3)",
        lift: "0 10px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.4)",
        glow: "0 0 20px rgba(16, 185, 129, 0.25), 0 0 40px rgba(16, 185, 129, 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-glow": "pulseGlow 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(16, 185, 129, 0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(16, 185, 129, 0.4)" },
        },
      },
    },
  },
  plugins: [],
};