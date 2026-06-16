import type { Product } from "@/lib/types";
import { COLORS, accent } from "@/lib/brand";
import { Wordmark } from "@/components/brand/Wordmark";
import { Gummy, type GummyShape } from "@/components/brand/Gummy";

interface PackFrontProps {
  /** The SKU to render — supplies line, flavour, colour and stats. */
  product: Product;
  /** "full" product card vs compact "tile" for Build Your Box. */
  variant?: "full" | "tile";
  className?: string;
}

const SHAPE_BY_COLOR: Record<Product["color"], GummyShape> = {
  raspberry: "bear",
  sun: "bottle",
  pine: "bottle",
  mint: "worm",
};

export function PackFront({ product, variant = "full", className }: PackFrontProps) {
  const { line, name, color, active, bigStat } = product;
  const theme = accent(color);
  const isFuel = line === "FUEL";
  const isTile = variant === "tile";

  const surface = isFuel
    ? `linear-gradient(160deg, #214A3B 0%, ${COLORS.pine} 58%, #112019 100%)`
    : `linear-gradient(160deg, ${theme.soft} 0%, ${COLORS.mintLight} 72%)`;

  const textColor = isFuel ? COLORS.white : COLORS.ink;
  const nameColor = isFuel ? COLORS.white : COLORS.pine;

  const shape = SHAPE_BY_COLOR[color];

  return (
    <figure
      aria-label={`${name}. ${line} line. ${bigStat}.`}
      className={[
        "relative flex aspect-[3/4] w-full flex-col overflow-hidden rounded-[1.75rem] border border-black/5 shadow-gummy",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ background: surface }}
    >
      {/* dotted candy texture */}
      <div
        className="pointer-events-none absolute inset-0 candy-dots"
        style={{ color: isFuel ? "#ffffff" : COLORS.pine, opacity: isFuel ? 0.07 : 0.06 }}
        aria-hidden="true"
      />

      {/* top seal strip with hang-hole + wordmark */}
      <div
        className="relative flex items-center justify-center border-b border-dashed px-3 py-2"
        style={{
          borderColor: isFuel ? "rgba(255,255,255,0.25)" : "rgba(27,58,47,0.18)",
          background: isFuel ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.45)",
        }}
      >
        <span
          className="absolute left-1/2 top-1 h-1.5 w-7 -translate-x-1/2 rounded-full"
          style={{ background: isFuel ? "rgba(255,255,255,0.3)" : "rgba(27,58,47,0.2)" }}
          aria-hidden="true"
        />
        <Wordmark
          variant="horizontal"
          height={isTile ? 14 : 18}
          color={isFuel ? COLORS.white : COLORS.pine}
          accent={isFuel ? COLORS.sun : COLORS.raspberry}
        />
      </div>

      {/* body */}
      <div className="relative flex flex-1 flex-col px-3.5 pb-3 pt-3" style={{ color: textColor }}>
        {/* line badge + age mark */}
        <div className="flex items-start justify-between">
          <span
            className="rounded-pill px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.14em]"
            style={{
              background: COLORS.pine,
              color: isFuel ? COLORS.sun : COLORS.mintLight,
            }}
          >
            {line}
          </span>
          {isFuel && (
            <span
              className="grid h-7 w-7 place-items-center rounded-full border-2 text-[0.62rem] font-extrabold"
              style={{ borderColor: COLORS.sun, color: COLORS.sun }}
              aria-label="Sixteen plus only"
            >
              16+
            </span>
          )}
        </div>

        {/* flavour name */}
        <h3
          className="mt-2 font-display font-extrabold leading-[0.95]"
          style={{
            color: nameColor,
            fontSize: isTile ? "1.05rem" : "1.5rem",
          }}
        >
          {name}
        </h3>
        {!isTile && (
          <p className="mt-1 text-xs font-medium opacity-80">{active}</p>
        )}

        {/* honest stat badge — tilted gummy pill */}
        <div
          className="mt-2 inline-flex w-fit -rotate-3 items-center rounded-pill px-3 py-1.5 shadow-soft"
          style={{
            background: isFuel ? COLORS.sun : COLORS.raspberry,
            color: isFuel ? COLORS.ink : COLORS.white,
          }}
        >
          <span className="text-[0.78rem] font-extrabold uppercase tracking-tight">
            {bigStat}
          </span>
        </div>

        {/* gummy window */}
        <div className="relative mt-auto h-[38%] w-full">
          <div
            className="absolute inset-0 rounded-2xl"
            style={{ background: isFuel ? "rgba(255,255,255,0.07)" : "rgba(27,58,47,0.06)" }}
            aria-hidden="true"
          />
          <Gummy shape={shape} color={color} size={isTile ? 34 : 48} className="absolute bottom-2 left-3 drop-shadow" />
          <Gummy shape="bean" color={isFuel ? "sun" : "raspberry"} size={isTile ? 26 : 36} className="absolute bottom-5 right-4 rotate-12 drop-shadow" />
          {!isTile && (
            <Gummy shape="worm" color={color} size={42} className="absolute bottom-1 left-1/2 -translate-x-1/2 -rotate-6 opacity-95 drop-shadow" />
          )}
        </div>

        {/* tagline */}
        {!isTile && (
          <p
            className="dose-tagline mt-2 text-center text-[0.7rem]"
            style={{ color: isFuel ? "rgba(255,255,255,0.85)" : COLORS.pine }}
          >
            Kick the sugar, keep the sweet.
          </p>
        )}
      </div>
    </figure>
  );
}
