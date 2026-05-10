import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          dark: "#84B179",
          mid: "#A2CB8B",
          light: "#C7EABB",
          pale: "#E8F5BD",
        },
        pink: {
          warm: "#FFF7CD",
          peach: "#FDC3A1",
          salmon: "#FB9B8F",
          rose: "#F57799",
        },
        text: {
          dark: "#2d3a2e",
          mid: "#5a7060",
          light: "#8aaa90",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "sans-serif"],
        display: ["var(--font-playfair)", "serif"],
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
      },
    },
  },
  plugins: [],
};

export default config;
