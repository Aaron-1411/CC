'use client';
import { useState, useEffect } from 'react';

interface Status {
  ready: number;
  total: number;
  bootstrapped: boolean;
  totalBars: number;
}

export function BootstrapBanner() {
  const [status, setStatus] = useState<Status | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/bootstrap/status')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => null);
  }, []);

  if (!status || status.bootstrapped || dismissed) return null;

  async function runBootstrap() {
    setRunning(true);
    setProgress('Seeding price history for all holdings… (~30–60s)');
    try {
      const res = await fetch('/api/bootstrap');
      const data = await res.json();
      if (data.ok) {
        setProgress(`Done — ${data.totalAdded} new bars added across ${status?.total} tickers.`);
        setTimeout(() => setDismissed(true), 3000);
        // Refresh status
        fetch('/api/bootstrap/status').then(r => r.json()).then(setStatus).catch(() => null);
      } else {
        setProgress('Error: ' + (data.error ?? 'unknown'));
      }
    } catch {
      setProgress('Network error — check server logs.');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/8 px-4 py-2 flex items-center justify-between gap-4 text-[11px] font-mono flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-amber-400 font-semibold">⚡ Local price history not seeded</span>
        <span className="text-[var(--text-tertiary)]">
          {status.ready}/{status.total} tickers ready · {status.totalBars.toLocaleString()} bars stored
        </span>
        {progress && <span className="text-[var(--text-secondary)]">{progress}</span>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[var(--text-tertiary)]">Seed once → all analytics run from SQLite, no more API rate limits</span>
        <button
          onClick={runBootstrap}
          disabled={running}
          className="px-3 py-1 rounded border border-amber-500/50 text-amber-400 hover:bg-amber-500/15 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {running ? 'Seeding…' : 'Seed now'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] px-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
