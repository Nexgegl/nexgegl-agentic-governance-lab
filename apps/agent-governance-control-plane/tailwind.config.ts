import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#050b1f",
          900: "#0a1330",
          800: "#101d45",
          700: "#162a5e",
          600: "#1e3a78",
          500: "#2c4d94",
          400: "#4c6bab",
          100: "#e2e7f3",
          50: "#f4f6fb",
        },
        gold: {
          600: "#a9791f",
          500: "#c79a3d",
          400: "#d9b45e",
          300: "#e7cd8c",
          100: "#f7ecd2",
        },
      },
      fontFamily: {
        sans: [
          "Tahoma",
          "Segoe UI",
          "Noto Sans Arabic",
          "Arial",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(10, 19, 48, 0.06), 0 1px 3px 0 rgba(10, 19, 48, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
