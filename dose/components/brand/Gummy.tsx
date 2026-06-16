import type { AccentColor } from "@/lib/types";
import { accent } from "@/lib/brand";

export type GummyShape = "bear" | "bottle" | "worm" | "bean";

interface GummyProps {
  shape?: GummyShape;
  color?: AccentColor;
  /** Width in px; height follows each shape's aspect ratio. */
  size?: number;
  className?: string;
  /** Show the glossy highlight. */
  glossy?: boolean;
  /** If set, the gummy is meaningful and gets an accessible label; otherwise decorative. */
  title?: string;
}

const VIEWBOX: Record<GummyShape, string> = {
  bear: "0 0 100 100",
  bottle: "0 0 64 100",
  worm: "0 0 110 64",
  bean: "0 0 100 70",
};

const ASPECT: Record<GummyShape, number> = {
  bear: 1,
  bottle: 100 / 64,
  worm: 64 / 110,
  bean: 70 / 100,
};

export function Gummy({
  shape = "bean",
  color = "raspberry",
  size = 64,
  className,
  glossy = true,
  title,
}: GummyProps) {
  const theme = accent(color);
  const fill = theme.hex;
  const a11y = title
    ? { role: "img" as const, "aria-label": title }
    : { "aria-hidden": true as const, focusable: false as const };

  return (
    <svg
      viewBox={VIEWBOX[shape]}
      width={size}
      height={size * ASPECT[shape]}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...a11y}
    >
      {title ? <title>{title}</title> : null}
      {shape === "bear" && <BearShape fill={fill} glossy={glossy} />}
      {shape === "bottle" && <BottleShape fill={fill} glossy={glossy} />}
      {shape === "worm" && <WormShape fill={fill} glossy={glossy} />}
      {shape === "bean" && <BeanShape fill={fill} glossy={glossy} />}
    </svg>
  );
}

const GLOSS = "rgba(255,255,255,0.4)";
const INNER = "rgba(0,0,0,0.06)";

function BearShape({ fill, glossy }: { fill: string; glossy: boolean }) {
  return (
    <g fill={fill}>
      {/* ears */}
      <circle cx="31" cy="21" r="9" />
      <circle cx="69" cy="21" r="9" />
      {/* head */}
      <ellipse cx="50" cy="32" rx="21" ry="17" />
      {/* body */}
      <ellipse cx="50" cy="68" rx="23" ry="27" />
      {/* arms */}
      <ellipse cx="24" cy="58" rx="10" ry="14" />
      <ellipse cx="76" cy="58" rx="10" ry="14" />
      {/* legs */}
      <ellipse cx="35" cy="91" rx="11" ry="9" />
      <ellipse cx="65" cy="91" rx="11" ry="9" />
      {/* tummy */}
      <ellipse cx="50" cy="70" rx="12" ry="16" fill={INNER} />
      {/* face */}
      <circle cx="42" cy="31" r="2.4" fill={INNER} />
      <circle cx="58" cy="31" r="2.4" fill={INNER} />
      <ellipse cx="50" cy="38" rx="3.2" ry="2.4" fill={INNER} />
      {glossy && <ellipse cx="40" cy="24" rx="6" ry="4" fill={GLOSS} />}
    </g>
  );
}

function BottleShape({ fill, glossy }: { fill: string; glossy: boolean }) {
  return (
    <g fill={fill}>
      <path
        d="M24 4h16c0 6 1 8 5 11l3 2c6 4 8 9 8 17v40c0 11-5 18-16 18H16C5 92 0 85 0 74V34c0-8 2-13 8-17l3-2c4-3 5-5 5-11z"
        transform="translate(4 2)"
      />
      {/* cap band */}
      <rect x="26" y="2" width="16" height="6" rx="2" fill={INNER} />
      {glossy && (
        <path
          d="M18 30c0-6 2-10 6-13"
          stroke={GLOSS}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </g>
  );
}

function WormShape({ fill, glossy }: { fill: string; glossy: boolean }) {
  return (
    <g fill="none">
      <path
        d="M14 40c8-26 24-26 32-6s24 22 32 2"
        stroke={fill}
        strokeWidth="20"
        strokeLinecap="round"
      />
      <path
        d="M78 36c4-10 12-12 18-4"
        stroke={fill}
        strokeWidth="20"
        strokeLinecap="round"
      />
      {glossy && (
        <path
          d="M16 34c6-16 18-18 26-6"
          stroke={GLOSS}
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}
    </g>
  );
}

function BeanShape({ fill, glossy }: { fill: string; glossy: boolean }) {
  return (
    <g fill={fill}>
      <rect x="4" y="6" width="92" height="58" rx="29" transform="rotate(-8 50 35)" />
      {glossy && (
        <ellipse cx="34" cy="24" rx="14" ry="7" fill={GLOSS} transform="rotate(-12 34 24)" />
      )}
    </g>
  );
}
