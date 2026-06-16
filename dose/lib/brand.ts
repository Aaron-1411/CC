import type { AccentColor } from "@/lib/types";

// Brand palette as raw hex — mirrors tailwind.config.ts so SVG fills (which
// can't use Tailwind classes) stay in sync with the design system.
export const COLORS = {
  pine: "#1B3A2F",
  raspberry: "#E5446D",
  sun: "#F2C14E",
  mint: "#EAF2EC",
  mintLight: "#F4F9F5",
  ink: "#1F2A24",
  white: "#FFFFFF",
} as const;

export interface AccentTheme {
  /** Main accent hex. */
  hex: string;
  /** A softer tint of the accent, for surfaces. */
  soft: string;
  /** Readable text colour on top of the accent. */
  on: string;
}

// Accent themes used by gummies + pack-fronts.
export const ACCENTS: Record<AccentColor, AccentTheme> = {
  raspberry: { hex: COLORS.raspberry, soft: "#F7C0D1", on: COLORS.white },
  sun: { hex: COLORS.sun, soft: "#F9E2A8", on: COLORS.ink },
  pine: { hex: COLORS.pine, soft: "#A7C3B5", on: COLORS.white },
  mint: { hex: "#7FB89A", soft: COLORS.mint, on: COLORS.pine },
};

export function accent(color: AccentColor): AccentTheme {
  return ACCENTS[color];
}
