'use client';

interface Props {
  state: 'live' | 'stale' | 'off';
  size?: number;
}

export function LiveDot({ state, size = 7 }: Props) {
  const colorMap = {
    live: 'bg-[var(--positive)] shadow-[0_0_6px_var(--positive)]',
    stale: 'bg-[var(--neutral)] shadow-[0_0_6px_var(--neutral)]',
    off: 'bg-[var(--text-tertiary)] shadow-none',
  };
  return (
    <span
      className={`inline-block rounded-full flex-shrink-0 ${colorMap[state]}`}
      style={{ width: size, height: size }}
      aria-label={`Connection: ${state}`}
    />
  );
}
