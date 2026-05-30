import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F5F1E8",
        surface: "#FAF7F0",
        coral: "#D97757",
        "coral-dark": "#B0411E",
        charcoal: "#1F1F1E",
        warmgray: "#6B6862",
        line: "#E8E2D5",
        sage: "#7C9A6A",
        amber: "#C89B3C",
      },
      fontFamily: {
        sans: ["Inter", "Pretendard", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
