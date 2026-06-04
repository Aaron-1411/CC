/*
  Turns a clinic's brand colours (plain hex strings in clinicConfig) into the
  app's CSS-variable palette at runtime. This is the white-label engine: set two
  hex values in the config and the entire app re-skins, with foreground colours
  chosen automatically for contrast so a clinic's brand colour never makes text
  unreadable.
*/

type Hsl = { h: number; s: number; l: number };

function hexToHsl(hex: string): Hsl | null {
  const clean = hex.trim().replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (full.length !== 6 || /[^0-9a-fA-F]/.test(full)) return null;

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const triple = ({ h, s, l }: Hsl) => `${h} ${s}% ${l}%`;

// Relative luminance check to pick a readable foreground over a brand colour.
function readableForeground({ h, s, l }: Hsl): string {
  return l > 62 ? "170 22% 15%" : "44 40% 97%";
}

export function applyClinicTheme(brand: { primary?: string; accent?: string }) {
  const root = document.documentElement;

  const primary = brand.primary ? hexToHsl(brand.primary) : null;
  if (primary) {
    root.style.setProperty("--primary", triple(primary));
    root.style.setProperty("--primary-foreground", readableForeground(primary));
    root.style.setProperty("--primary-soft", `${primary.h} ${Math.min(primary.s, 40)}% 92%`);
    root.style.setProperty("--ring", `${primary.h} ${Math.max(primary.s, 30)}% ${Math.min(primary.l + 8, 40)}%`);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", brand.primary!);
  }

  const accent = brand.accent ? hexToHsl(brand.accent) : null;
  if (accent) {
    root.style.setProperty("--accent", triple(accent));
    root.style.setProperty("--accent-foreground", readableForeground(accent));
    root.style.setProperty("--accent-soft", `${accent.h} ${Math.min(accent.s, 60)}% 93%`);
  }
}
