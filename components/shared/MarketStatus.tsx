'use client';
import { useEffect, useState } from 'react';

interface MarketInfo {
  label: string;
  color: string;
  dot: string;
  countdown?: string;
}

function getMarketStatus(now: Date): MarketInfo {
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const t = utcH * 60 + utcM;
  const day = now.getUTCDay();

  if (day === 0 || day === 6) {
    return { label: 'Weekend', color: 'text-[var(--text-tertiary)]', dot: 'bg-[var(--text-tertiary)]' };
  }

  // LSE: 08:00–16:30 UTC
  if (t >= 480 && t < 990) {
    const minsLeft = 990 - t;
    const h = Math.floor(minsLeft / 60), m = minsLeft % 60;
    return { label: 'LSE Open', color: 'text-[var(--positive)]', dot: 'bg-[var(--positive)]', countdown: `closes ${h}h ${m}m` };
  }
  // NYSE: 14:30–21:00 UTC
  if (t >= 870 && t < 1260) {
    const minsLeft = 1260 - t;
    const h = Math.floor(minsLeft / 60), m = minsLeft % 60;
    return { label: 'NYSE Open', color: 'text-[var(--positive)]', dot: 'bg-[var(--positive)]', countdown: `closes ${h}h ${m}m` };
  }
  // Pre-market 13:00–14:30 UTC
  if (t >= 780 && t < 870) {
    return { label: 'Pre-market', color: 'text-[var(--neutral)]', dot: 'bg-[var(--neutral)]' };
  }

  return { label: 'Markets Closed', color: 'text-[var(--text-secondary)]', dot: 'bg-[var(--text-tertiary)]' };
}

export function MarketStatus() {
  const [info, setInfo] = useState<MarketInfo>(() => getMarketStatus(new Date()));

  useEffect(() => {
    const id = setInterval(() => setInfo(getMarketStatus(new Date())), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-mono ${info.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${info.dot}`} />
      {info.label}
      {info.countdown && <span className="text-[var(--text-tertiary)] ml-1">{info.countdown}</span>}
    </span>
  );
}
