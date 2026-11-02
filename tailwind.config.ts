import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="midnight"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--t1)",
        card: { DEFAULT: "var(--card)", foreground: "var(--t1)" },
        primary: { DEFAULT: "var(--p)", foreground: "#fff" },
        secondary: { DEFAULT: "var(--plt)", foreground: "var(--p)" },
        muted: { DEFAULT: "var(--ppl)", foreground: "var(--t3)" },
        border: "var(--bdr)",
        input: "var(--bdr2)",
        ring: "var(--p)",
        sidebar: "var(--sb)",
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "var(--sh)",
      },
    },
  },
  plugins: [],
};
export default config;
