import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // DOSE brand palette
        pine: "#1B3A2F", // dark sections / base
        raspberry: "#E5446D", // primary CTA / accent
        sun: "#F2C14E", // energy / FUEL accent
        mint: {
          DEFAULT: "#EAF2EC",
          light: "#F4F9F5",
        },
        ink: "#1F2A24", // body text
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        gummy: "2.5rem",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 18px 40px -16px rgba(27, 58, 47, 0.28)",
        gummy: "0 10px 24px -8px rgba(27, 58, 47, 0.35)",
        lift: "0 28px 60px -20px rgba(27, 58, 47, 0.45)",
      },
      keyframes: {
        "gummy-float": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(6deg)" },
        },
        wobble: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
      animation: {
        "gummy-float": "gummy-float 6s ease-in-out infinite",
        wobble: "wobble 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
