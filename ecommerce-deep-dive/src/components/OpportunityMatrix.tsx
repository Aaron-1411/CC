import { OpportunityMatrix as MatrixType } from '@/types/analysis';

interface Props { matrix: MatrixType }

const quadrants = [
  { key: 'highImpactEasy'       as const, label: 'HIGH IMPACT / QUICK WIN',    borderColor: 'border-emerald-700', textColor: 'text-emerald-400' },
  { key: 'highImpactInvestment' as const, label: 'HIGH IMPACT / INVESTMENT',   borderColor: 'border-amber-700',   textColor: 'text-amber-400'   },
  { key: 'lowerImpactEasy'      as const, label: 'LOWER IMPACT / QUICK WIN',   borderColor: 'border-zinc-600',    textColor: 'text-zinc-400'    },
  { key: 'longerTerm'           as const, label: 'LONGER TERM / STRATEGIC',    borderColor: 'border-red-900',     textColor: 'text-red-400'     },
];

export function OpportunityMatrix({ matrix }: Props) {
  return (
    <div className="mt-8 animate-fadeSlideUp">
      <h2 className="text-white font-bold text-lg mb-4">Opportunity Matrix</h2>
      <div className="grid grid-cols-2 gap-3">
        {quadrants.map(q => (
          <div
            key={q.key}
            className={`bg-zinc-900 border rounded-lg p-4 ${q.borderColor}`}
          >
            <p className={`text-xs font-bold tracking-widest mb-3 ${q.textColor}`}>
              {q.label}
            </p>
            <ul className="space-y-2">
              {(matrix[q.key] || []).map((item, i) => (
                <li key={i} className="text-zinc-300 text-sm flex gap-2">
                  <span className="text-zinc-600 shrink-0 mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
