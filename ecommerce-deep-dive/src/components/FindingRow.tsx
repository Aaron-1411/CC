import { Finding } from '@/types/analysis';

const typeStyles = {
  CONFIRMED: { symbol: '✓', color: 'text-emerald-400' },
  INFERRED:  { symbol: '~', color: 'text-amber-400'   },
  UNKNOWN:   { symbol: '✗', color: 'text-red-400'     },
};

export function FindingRow({ finding }: { finding: Finding }) {
  const { symbol, color } = typeStyles[finding.type];
  return (
    <div className="flex items-start gap-2 py-2 border-b border-zinc-800/60 last:border-0">
      <span className={`font-bold text-sm mt-0.5 shrink-0 w-4 ${color}`}>{symbol}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-200 leading-relaxed">{finding.text}</p>
        {finding.dataGapFlag && (
          <p className="text-xs text-blue-400 italic mt-0.5">{finding.dataGapFlag}</p>
        )}
      </div>
      <span className={`text-xs shrink-0 mt-0.5 ${
        finding.confidence === 'HIGH'   ? 'text-zinc-500' :
        finding.confidence === 'MEDIUM' ? 'text-zinc-600' : 'text-zinc-700'
      }`}>
        {finding.confidence}
      </span>
    </div>
  );
}
