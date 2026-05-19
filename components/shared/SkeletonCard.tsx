export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-4 animate-pulse ${className}`}>
      <div className="h-3 w-24 bg-[var(--bg-raised)] rounded mb-3" />
      <div className="h-6 w-32 bg-[var(--bg-raised)] rounded mb-2" />
      <div className="h-3 w-20 bg-[var(--bg-raised)] rounded" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex gap-4 py-3 border-b border-[var(--border-subtle)] animate-pulse">
      <div className="h-4 flex-1 bg-[var(--bg-raised)] rounded" />
      <div className="h-4 w-20 bg-[var(--bg-raised)] rounded" />
      <div className="h-4 w-16 bg-[var(--bg-raised)] rounded" />
      <div className="h-4 w-16 bg-[var(--bg-raised)] rounded" />
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-3 bg-[var(--bg-raised)] rounded ${i === lines - 1 ? 'w-3/4' : 'w-full'}`} />
      ))}
    </div>
  );
}
