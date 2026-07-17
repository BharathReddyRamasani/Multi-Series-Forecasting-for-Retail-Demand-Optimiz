/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "var(--blue)",
        secondary: "var(--purple)",
        accent: "var(--green)",
        muted: "var(--tx-3)",
        surface: "var(--surface-1)",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      borderRadius: {
        xl: "var(--r-xl)",
        "2xl": "var(--r-2xl)",
        full: "var(--r-full)",
      },
      boxShadow: {
        glass: "0 4px 12px rgba(79,131,255,0.35)",
        "glass-md": "0 8px 20px rgba(79,131,255,0.3)",
      },
    },
  },
  plugins: [],
};
