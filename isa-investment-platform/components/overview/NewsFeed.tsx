'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { SentimentBadge } from '@/components/shared/SentimentBadge';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { HOLDINGS_DEFINITION } from '@/lib/constants';

interface NewsItem {
  id: string;
  ticker: string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

export function NewsFeed() {
  const [activeTicker, setActiveTicker] = useState<string | null>(null);

  const { data, isLoading } = useQuery<NewsItem[]>({
    queryKey: ['news', 'all'],
    queryFn: () => fetch('/api/news').then((r) => r.json()).then((d) => d.news ?? []),
    staleTime: 5 * 60_000,
  });

  const items = (data ?? []).filter((n) => !activeTicker || n.ticker === activeTicker);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    if (h > 48) return `${Math.floor(h / 24)}d ago`;
    if (h > 0) return `${h}h ago`;
    return `${m}m ago`;
  };

  return (
    <div>
      {/* Ticker filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-3">
        <button
          onClick={() => setActiveTicker(null)}
          className={`px-2.5 py-1 text-[11px] font-mono rounded-full border flex-shrink-0 transition-colors ${
            !activeTicker
              ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
              : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-normal)]'
          }`}
        >
          ALL
        </button>
        {HOLDINGS_DEFINITION.map((h) => (
          <button
            key={h.ticker}
            onClick={() => setActiveTicker(activeTicker === h.ticker ? null : h.ticker)}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-full border flex-shrink-0 transition-colors ${
              activeTicker === h.ticker
                ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-normal)]'
            }`}
          >
            {h.ticker}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-[var(--text-tertiary)] text-sm text-center py-6">
          {data === undefined ? 'Failed to load news' : 'No news found'}
        </p>
      ) : (
        <div className="space-y-0">
          {items.slice(0, 20).map((item) => (
            <a
              key={item.id}
              href={item.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 py-3 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-raised)] transition-colors rounded px-1 -mx-1"
            >
              <span className="mt-0.5 font-mono text-[10px] bg-[var(--bg-overlay)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded text-[var(--text-secondary)] flex-shrink-0">{item.ticker}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--text-primary)] leading-snug">{item.headline}</div>
                {item.summary && (
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed line-clamp-2">{item.summary}</div>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{item.source}</span>
                  <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{timeAgo(item.publishedAt)}</span>
                </div>
              </div>
              <SentimentBadge sentiment={item.sentiment} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
