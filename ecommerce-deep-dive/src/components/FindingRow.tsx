import { Finding } from '@/types/analysis';

const typeConfig = {
  CONFIRMED: {
    badge: 'CONFIRMED',
    bg: 'rgba(16,185,129,0.1)',
    text: '#34d399',
    border: 'rgba(16,185,129,0.25)',
  },
  INFERRED: {
    badge: 'INFERRED',
    bg: 'rgba(245,158,11,0.1)',
    text: '#fbbf24',
    border: 'rgba(245,158,11,0.25)',
  },
  UNKNOWN: {
    badge: 'UNKNOWN',
    bg: 'rgba(99,102,241,0.1)',
    text: '#818cf8',
    border: 'rgba(99,102,241,0.25)',
  },
};

const confidenceColor: Record<string, string> = {
  HIGH:   '#52525b',
  MEDIUM: '#3f3f46',
  LOW:    '#27272a',
};

export function FindingRow({ finding }: { finding: Finding }) {
  const cfg = typeConfig[finding.type];
  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      {/* Type badge */}
      <span
        className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider"
        style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
      >
        {cfg.badge}
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 leading-relaxed">{finding.text}</p>
        {finding.dataGapFlag && (
          <p className="text-xs text-indigo-400/70 font-mono italic mt-0.5">{finding.dataGapFlag}</p>
        )}
      </div>

      {/* Confidence */}
      <span
        className="shrink-0 mt-0.5 text-[10px] font-mono font-bold tracking-widest"
        style={{ color: confidenceColor[finding.confidence] }}
      >
        {finding.confidence}
      </span>
    </div>
  );
}
