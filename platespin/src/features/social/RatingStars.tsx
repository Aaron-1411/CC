// Half-star rating, both display and interactive. Uses text glyphs (no icon dep):
// a grey base ★ with an amber ★ clipped to the fill %. In interactive mode each
// star has two touch targets (left = .5, right = full) for 0.5 granularity.

interface Props {
  value: number; // 0–5 (halves)
  onChange?: (v: number) => void;
  size?: number; // px
}

export function RatingStars({ value, onChange, size = 20 }: Props) {
  const interactive = Boolean(onChange);
  return (
    <div
      className="inline-flex select-none items-center gap-0.5"
      role={interactive ? "slider" : "img"}
      aria-label={`${value} out of 5 stars`}
      aria-valuenow={interactive ? value : undefined}
      aria-valuemin={interactive ? 0.5 : undefined}
      aria-valuemax={interactive ? 5 : undefined}
    >
      {[1, 2, 3, 4, 5].map((s) => {
        const fill = Math.max(0, Math.min(1, value - (s - 1)));
        return (
          <span
            key={s}
            className="relative inline-block leading-none"
            style={{ fontSize: size, width: size, height: size }}
          >
            <span className="absolute inset-0 text-slate-600">★</span>
            <span
              className="absolute inset-0 overflow-hidden whitespace-nowrap text-amber-300"
              style={{ width: `${fill * 100}%` }}
            >
              ★
            </span>
            {interactive && (
              <>
                <button
                  type="button"
                  aria-label={`${s - 0.5} stars`}
                  onClick={() => onChange?.(s - 0.5)}
                  className="absolute inset-y-0 left-0 z-10 w-1/2 cursor-pointer"
                />
                <button
                  type="button"
                  aria-label={`${s} stars`}
                  onClick={() => onChange?.(s)}
                  className="absolute inset-y-0 right-0 z-10 w-1/2 cursor-pointer"
                />
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}
