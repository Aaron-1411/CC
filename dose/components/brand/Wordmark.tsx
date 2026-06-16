import { COLORS } from "@/lib/brand";

type Variant = "horizontal" | "stacked" | "mark";

interface WordmarkProps {
  variant?: Variant;
  /** Letter colour. */
  color?: string;
  /** The gummy "O" / mark colour. */
  accent?: string;
  /** Rendered height in px; width follows the lockup aspect. */
  height?: number;
  className?: string;
  title?: string;
}

// The gummy "O" — a glossy ring. This is DOSE's core glyph and the standalone mark.
function GummyRing({
  cx,
  cy,
  r,
  fill,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
}) {
  const inner = r * 0.48;
  return (
    <g>
      <path
        d={`M ${cx} ${cy - r}
            a ${r} ${r} 0 1 0 0.01 0 Z
            M ${cx} ${cy - inner}
            a ${inner} ${inner} 0 1 1 -0.01 0 Z`}
        fill={fill}
        fillRule="evenodd"
      />
      {/* gloss */}
      <path
        d={`M ${cx - r * 0.62} ${cy - r * 0.2}
            a ${r} ${r} 0 0 1 ${r * 0.5} ${-r * 0.62}`}
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth={r * 0.12}
        strokeLinecap="round"
      />
    </g>
  );
}

export function Wordmark({
  variant = "horizontal",
  color = COLORS.pine,
  accent = COLORS.raspberry,
  height = 48,
  className,
  title = "DOSE",
}: WordmarkProps) {
  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 100 100"
        height={height}
        width={height}
        className={className}
        role="img"
        aria-label={title}
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>{title}</title>
        <GummyRing cx={50} cy={50} r={42} fill={accent} />
      </svg>
    );
  }

  const letterStyle = {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "112px",
    letterSpacing: "-2px",
  } as const;

  const Letters = (
    <svg
      viewBox="0 0 380 140"
      height={variant === "horizontal" ? height : height * 0.62}
      width={(variant === "horizontal" ? height : height * 0.62) * (380 / 140)}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <text x="52" y="104" textAnchor="middle" fill={color} style={letterStyle}>
        D
      </text>
      <GummyRing cx={140} cy={66} r={40} fill={accent} />
      <text x="232" y="104" textAnchor="middle" fill={color} style={letterStyle}>
        S
      </text>
      <text x="320" y="104" textAnchor="middle" fill={color} style={letterStyle}>
        E
      </text>
    </svg>
  );

  if (variant === "stacked") {
    return (
      <div
        className={["inline-flex flex-col items-center gap-2", className]
          .filter(Boolean)
          .join(" ")}
      >
        <svg
          viewBox="0 0 100 100"
          height={height * 0.7}
          width={height * 0.7}
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <GummyRing cx={50} cy={50} r={42} fill={accent} />
        </svg>
        {Letters}
      </div>
    );
  }

  return <span className={className}>{Letters}</span>;
}
