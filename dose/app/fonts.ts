import { Bricolage_Grotesque, Fraunces, Inter } from "next/font/google";

// Bold display sans for headlines + the wordmark.
export const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

// Warm serif italic for taglines.
export const serif = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["italic", "normal"],
  variable: "--font-serif",
  display: "swap",
});

// Clean sans for body copy.
export const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
