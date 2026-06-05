import { OpportunityMatrix as MatrixType } from '@/types/analysis';

interface Props { matrix: MatrixType }

const quadrants = [
  {
    key: 'highImpactEasy'       as const,
    label: 'HIGH IMPACT / QUICK WIN',
    accentColor: '#34d399',
    borderColor: 'rgba(52,211,153,0.2)',
    bg: 'rgba(16,185,129,0.04)',
    textColor: '#34d399',
  },
  {
    key: 'highImpactInvestment' as const,
    label: 'HIGH IMPACT / INVESTMENT',
    accentColor: '#fbbf24',
    borderColor: 'rgba(245,158,11,0.2)',
    bg: 'rgba(245,158,11,0.04)',
    textColor: '#fbbf24',
  },
  {
    key: 'lowerImpactEasy'      as const,
    label: 'LOWER IMPACT / QUICK WIN',
    accentColor: '#a1a1aa',
    borderColor: 'rgba(161,161,170,0.15)',
    bg: 'rgba(255,255,255,0.02)',
    textColor: '#a1a1aa',
  },
  {
    key: 'longerTerm'           as const,
    label: 'LONGER TERM / STRATEGIC',
    accentColor: '#f87171',
    borderColor: 'rgba(239,68,68,0.2)',
    bg: 'rgba(239,68,68,0.04)',
    textColor: '#f87171',
  },
];

export function OpportunityMatrix({ matrix }: Props) {
  return (
    <div className="mt-8 animate-fadeSlideUp">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-zinc-200 font-mono font-bold text-sm tracking-widest uppercase">
          Opportunity Matrix
        </h2>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {quadrants.map(q => (
          <div
            key={q.key}
            className="rounded-xl p-4"
            style={{ background: q.bg, border: `1px solid ${q.borderColor}` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: q.accentColor }}
              />
              <p
                className="text-[10px] font-mono font-bold tracking-widest uppercase"
                style={{ color: q.textColor }}
              >
                {q.label}
              </p>
            </div>
            <ul className="space-y-2">
              {(matrix[q.key] || []).map((item, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-zinc-700 shrink-0 mt-0.5 font-mono">·</span>
                  <span className="text-zinc-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
