import { RAGStatus } from '@/types/analysis';

const styles: Record<RAGStatus, { bg: string; text: string; border: string; label: string }> = {
  GREEN:   { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.3)',  label: 'GREEN'   },
  AMBER:   { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)',  label: 'AMBER'   },
  RED:     { bg: 'rgba(239,68,68,0.12)',  text: '#f87171', border: 'rgba(239,68,68,0.3)',   label: 'RED'     },
  PENDING: { bg: 'rgba(63,63,70,0.4)',    text: '#71717a', border: 'rgba(63,63,70,0.5)',    label: 'PENDING' },
  RUNNING: { bg: 'rgba(6,182,212,0.12)',  text: '#22d3ee', border: 'rgba(6,182,212,0.35)',  label: 'SCANNING' },
};

export function RAGBadge({ status }: { status: RAGStatus }) {
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-widest uppercase${status === 'RUNNING' ? ' animate-pillar-pulse' : ''}`}
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}
