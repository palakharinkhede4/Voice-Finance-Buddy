import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#08090D",
        surface: {
          DEFAULT: "#0E1017",
          hover: "#151822",
          card: "#12141C",
          cardHover: "#171A24",
          border: "rgba(255, 255, 255, 0.07)",
          subtle: "rgba(255, 255, 255, 0.02)",
        },
        zinc: {
          850: "#1A1D27",
          900: "#11131A",
          950: "#090A0F",
        },
        primary: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        emerald: {
          500: "#10B981",
          muted: "rgba(16, 185, 129, 0.12)",
        },
        rose: {
          500: "#F43F5E",
          muted: "rgba(244, 63, 94, 0.12)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 0 30px -5px rgba(99, 102, 241, 0.22)",
        glowEmerald: "0 0 30px -5px rgba(16, 185, 129, 0.22)",
        glowRose: "0 0 30px -5px rgba(244, 63, 94, 0.22)",
        card: "0 8px 24px -4px rgba(0, 0, 0, 0.45)",
        insetBorder: "inset 0 1px 0 0 rgba(255, 255, 255, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
