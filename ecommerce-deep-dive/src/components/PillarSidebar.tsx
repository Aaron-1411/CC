'use client';
import { PillarResult, RAGStatus } from '@/types/analysis';
import { PILLARS } from '@/lib/pillars';

interface Props {
  pillars: PillarResult[];
}

const dotStyles: Record<RAGStatus, string> = {
  GREEN:   'bg-emerald-500',
  AMBER:   'bg-amber-500',
  RED:     'bg-red-500',
  PENDING: 'bg-zinc-600',
  RUNNING: 'bg-blue-500 animate-pulse',
};

export function PillarSidebar({ pillars }: Props) {
  const scrollTo = (id: number) => {
    document.getElementById(`pillar-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="w-52 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-4 pr-2">
      <p className="text-zinc-500 text-xs font-semibold tracking-widest uppercase mb-3 px-2">
        Pillars
      </p>
      {PILLARS.map(p => {
        const result = pillars.find(r => r.id === p.id);
        const status: RAGStatus = result?.status ?? 'PENDING';
        const isClickable = !!result && status !== 'PENDING' && status !== 'RUNNING';

        return (
          <button
            key={p.id}
            onClick={() => isClickable && scrollTo(p.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-colors ${
              isClickable
                ? 'hover:bg-zinc-800 cursor-pointer text-zinc-300'
                : 'cursor-default text-zinc-600'
            }`}
          >
            <span className="font-mono w-5 shrink-0 text-zinc-600">
              {String(p.id).padStart(2, '0')}
            </span>
            <span className="flex-1 truncate">{p.name}</span>
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotStyles[status]}`} />
          </button>
        );
      })}
    </nav>
  );
}
