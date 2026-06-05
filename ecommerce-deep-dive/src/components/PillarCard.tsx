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
      className="rounded-xl overflow-hidden animate-fadeSlideUp"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-cyan-500/60 text-xs font-mono w-6 shrink-0 font-bold">
          {String(pillar.id).padStart(2, '0')}
        </span>
        <h3 className="text-zinc-200 font-semibold flex-1 text-sm tracking-wide">{pillar.name}</h3>
        <RAGBadge status={pillar.status} />
      </div>

      {/* Running state: animated scan bar */}
      {isRunning && (
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shrink-0" />
            <span className="text-cyan-400 text-xs font-mono tracking-wider">ANALYSING…</span>
          </div>
          <div
            className="relative h-0.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(6,182,212,0.12)' }}
          >
            <div
              className="absolute top-0 h-full w-3/5 rounded-full animate-scan-bar"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.8), transparent)' }}
            />
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="px-4 py-3">
          <p className="text-red-400 text-sm font-mono mb-3">{pillar.error}</p>
          <button
            onClick={() => onRetry(pillar.id)}
            className="text-xs font-mono text-zinc-400 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            RE-ANALYSE ↺
          </button>
        </div>
      )}

      {/* Findings */}
      {!isRunning && !hasError && pillar.findings.length > 0 && (
        <div className="px-4 pt-1 pb-2">
          {pillar.findings.map((f, i) => <FindingRow key={i} finding={f} />)}
        </div>
      )}

      {/* Opportunity strip */}
      {pillar.opportunity && (
        <div className="mx-4 mb-3 mt-1 flex rounded-r overflow-hidden">
          <div className="w-0.5 shrink-0" style={{ background: '#f59e0b' }} />
          <div
            className="flex-1 px-3 py-2"
            style={{ background: 'rgba(245,158,11,0.06)', borderLeft: 'none' }}
          >
            <span className="text-amber-500/80 text-[10px] font-mono font-bold tracking-widest">OPPORTUNITY  </span>
            <span className="text-amber-100/90 text-sm">{pillar.opportunity}</span>
          </div>
        </div>
      )}

      {/* Data gap */}
      {pillar.dataGap && (
        <div className="mx-4 mb-3 flex rounded-r overflow-hidden">
          <div className="w-0.5 shrink-0" style={{ background: '#818cf8' }} />
          <div
            className="flex-1 px-3 py-2"
            style={{ background: 'rgba(99,102,241,0.06)' }}
          >
            <span className="text-indigo-400/80 text-[10px] font-mono font-bold tracking-widest">DATA GAP  </span>
            <span className="text-indigo-200/80 text-sm italic">{pillar.dataGap}</span>
          </div>
        </div>
      )}

      {/* Re-analyse */}
      {!isRunning && !hasError && pillar.completedAt && (
        <div className="px-4 pb-3 flex justify-end">
          <button
            onClick={() => onRetry(pillar.id)}
            className="text-xs font-mono text-zinc-700 hover:text-zinc-400 transition-colors"
          >
            Re-analyse ↺
          </button>
        </div>
      )}
    </div>
  );
}
