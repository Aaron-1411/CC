import { useMemo } from "react";
import type { CuisineId } from "@/contract/types";
import { CUISINE_BY_ID } from "@/data/cuisines";
import type { WheelSlice } from "@/features/wheel/spin";

interface WheelProps {
  slices: WheelSlice[];
  rotation: number;
  spinning: boolean;
  durationMs: number;
  onTransitionEnd: () => void;
  onSpin?: () => void;
  canSpin?: boolean;
}

const SIZE = 320;
const R = SIZE / 2;
const LABEL_R = R * 0.66;

// angle measured clockwise from the top (12 o'clock)
function pointOnCircle(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
}

function slicePath(index: number, count: number): string {
  const sliceAngle = 360 / count;
  const start = index * sliceAngle;
  const end = start + sliceAngle;
  const [sx, sy] = pointOnCircle(R, R, R, start);
  const [ex, ey] = pointOnCircle(R, R, R, end);
  const largeArc = sliceAngle > 180 ? 1 : 0;
  return `M ${R} ${R} L ${sx} ${sy} A ${R} ${R} 0 ${largeArc} 1 ${ex} ${ey} Z`;
}

export function Wheel({
  slices,
  rotation,
  spinning,
  durationMs,
  onTransitionEnd,
  onSpin,
  canSpin = false,
}: WheelProps) {
  const count = Math.max(slices.length, 1);
  const tappable = Boolean(onSpin) && canSpin;
  const handleTap = () => {
    if (tappable) onSpin!();
  };
  const geometry = useMemo(
    () =>
      slices.map((s, i) => {
        const sliceAngle = 360 / count;
        const mid = i * sliceAngle + sliceAngle / 2;
        const [lx, ly] = pointOnCircle(R, R, LABEL_R, mid);
        const cuisine = CUISINE_BY_ID[s.id as CuisineId];
        return { slice: s, path: slicePath(i, count), lx, ly, cuisine, mid };
      }),
    [slices, count],
  );

  return (
    <div
      className={`relative mx-auto aspect-square w-full max-w-[340px] select-none transition-transform ${
        tappable ? "cursor-pointer active:scale-[0.98]" : ""
      }`}
      onClick={handleTap}
      onKeyDown={(e) => {
        if (!tappable) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleTap();
        }
      }}
      role={onSpin ? "button" : undefined}
      tabIndex={onSpin ? 0 : undefined}
      aria-label={onSpin ? "Spin the wheel" : undefined}
      aria-disabled={onSpin ? !canSpin : undefined}
    >
      {/* pointer */}
      <div
        className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2"
        aria-hidden
      >
        <div className="h-0 w-0 border-x-[12px] border-t-[20px] border-x-transparent border-t-amber-300 drop-shadow" />
      </div>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full rounded-full shadow-2xl ring-4 ring-white/10"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? `transform ${durationMs}ms cubic-bezier(0.33, 1, 0.68, 1)` : "none",
        }}
        onTransitionEnd={onTransitionEnd}
        role="img"
        aria-label="Cuisine wheel"
      >
        {geometry.map(({ slice, path, lx, ly, cuisine }) => (
          <g key={slice.id} opacity={slice.available ? 1 : 0.25}>
            <path d={path} fill={cuisine?.color ?? "#475569"} stroke="#0b0f17" strokeWidth={1.5} />
            <text
              x={lx}
              y={ly}
              fontSize={26}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ pointerEvents: "none" }}
            >
              {cuisine?.emoji ?? "🍽️"}
            </text>
          </g>
        ))}
        {/* hub */}
        <circle cx={R} cy={R} r={26} fill="#0b0f17" stroke="#fbbf24" strokeWidth={3} />
      </svg>
    </div>
  );
}
