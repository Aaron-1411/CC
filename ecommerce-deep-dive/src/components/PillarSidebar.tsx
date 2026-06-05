'use client';
import { PillarResult, RAGStatus } from '@/types/analysis';
import { PILLARS } from '@/lib/pillars';

interface Props {
  pillars: PillarResult[];
}

const dotConfig: Record<RAGStatus, { color: string; pulse?: boolean }> = {
  GREEN:   { color: '#34d399' },
  AMBER:   { color: '#fbbf24' },
  RED:     { color: '#f87171' },
  PENDING: { color: '#3f3f46' },
  RUNNING: { color: '#22d3ee', pulse: true },
};

export function PillarSidebar({ pillars }: Props) {
  const scrollTo = (id: number) => {
    document.getElementById(`pillar-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="w-48 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-4 pr-2">
      <p className="text-zinc-600 text-[10px] font-mono font-bold tracking-[0.25em] uppercase mb-3 px-2">
        Pillars
      </p>
      <div className="space-y-0.5">
        {PILLARS.map(p => {
          const result = pillars.find(r => r.id === p.id);
          const status: RAGStatus = result?.status ?? 'PENDING';
          const isClickable = !!result && status !== 'PENDING' && status !== 'RUNNING';
          const dot = dotConfig[status];

          return (
            <button
              key={p.id}
              onClick={() => isClickable && scrollTo(p.id)}
              className={`group w-full flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all ${
                isClickable
                  ? 'cursor-pointer hover:bg-white/5'
                  : 'cursor-default'
              }`}
            >
              {/* Number */}
              <span
                className="font-mono text-[10px] w-5 shrink-0 font-bold"
                style={{ color: status === 'RUNNING' ? '#22d3ee' : '#3f3f46' }}
              >
                {String(p.id).padStart(2, '0')}
              </span>

              {/* Name */}
              <span
                className="flex-1 text-[11px] font-mono truncate"
                style={{
                  color: status === 'RUNNING'
                    ? '#e2e8f0'
                    : isClickable
                    ? '#a1a1aa'
                    : '#52525b',
                }}
              >
                {p.name}
              </span>

              {/* Status dot */}
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot.pulse ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: dot.color }}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
