import { RAGStatus } from '@/types/analysis';

const styles: Record<RAGStatus, string> = {
  GREEN:   'bg-emerald-700 text-white',
  AMBER:   'bg-amber-600 text-white',
  RED:     'bg-red-700 text-white',
  PENDING: 'bg-zinc-600 text-zinc-300',
  RUNNING: 'bg-blue-600 text-white animate-pulse',
};

export function RAGBadge({ status }: { status: RAGStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${styles[status]}`}>
      {status}
    </span>
  );
}
