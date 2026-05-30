'use client';
import { PillarResult } from '@/types/analysis';
import { RAGBadge } from './RAGBadge';
import { FindingRow } from './FindingRow';

interface Props {
  pillar: PillarResult;
  jobId: string;
  onRetry: (pillarId: number) => void;
}

export function PillarCard({ pillar, onRetry }: Props) {
  const isRunning = pillar.status === 'RUNNING';
  const hasError  = !!pillar.error;

  return (
    <div
      id={`pillar-${pillar.id}`}
      className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-fadeSlideUp"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800/60">
        <span className="text-zinc-500 text-sm font-mono w-6 shrink-0">
          {String(pillar.id).padStart(2, '0')}
        </span>
        <h3 className="text-white font-semibold flex-1 text-sm">{pillar.name}</h3>
        <RAGBadge status={pillar.status} />
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {isRunning && (
          <div className="flex items-center gap-2 py-4 text-blue-400 text-sm">
            <span className="inline-block animate-spin">⟳</span>
            <span>Analysing…</span>
          </div>
        )}

        {hasError && (
          <div className="py-3">
            <p className="text-red-400 text-sm mb-2">{pillar.error}</p>
            <button
              onClick={() => onRetry(pillar.id)}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded border border-zinc-700 transition-colors"
            >
              Re-analyse ↺
            </button>
          </div>
        )}

        {!isRunning && !hasError && pillar.findings.length > 0 && (
          <div>
            {pillar.findings.map((f, i) => <FindingRow key={i} finding={f} />)}
          </div>
        )}

        {/* Opportunity callout */}
        {pillar.opportunity && (
          <div className="mt-3 flex">
            <div className="w-1 shrink-0 bg-amber-600 rounded-l" />
            <div className="bg-amber-950/40 border border-amber-800/30 px-3 py-2 rounded-r flex-1">
              <span className="text-amber-500 text-xs font-bold tracking-wide">OPPORTUNITY  </span>
              <span className="text-amber-100 text-sm">{pillar.opportunity}</span>
            </div>
          </div>
        )}

        {/* Data gap callout */}
        {pillar.dataGap && (
          <div className="mt-2 flex">
            <div className="w-1 shrink-0 bg-blue-600 rounded-l" />
            <div className="bg-blue-950/40 border border-blue-800/30 px-3 py-2 rounded-r flex-1">
              <span className="text-blue-400 text-xs font-bold tracking-wide">DATA GAP  </span>
              <span className="text-blue-200 text-sm italic">{pillar.dataGap}</span>
            </div>
          </div>
        )}

        {/* Re-analyse button for completed pillars */}
        {!isRunning && !hasError && pillar.completedAt && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => onRetry(pillar.id)}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              Re-analyse ↺
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
