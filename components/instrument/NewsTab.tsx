'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import type { NewsItem } from '@/types/market';
import { fetchJson } from '@/lib/fetchJson';

interface Props { ticker: string }

function timeAgo(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function dayLabel(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const SENT_STYLE: Record<string, string> = {
  bullish: 'bg-[var(--positive)]/10 text-[var(--positive)] border-[var(--positive)]/30',
  bearish: 'bg-[var(--negative)]/10 text-[var(--negative)] border-[var(--negative)]/30',
  neutral: 'bg-[var(--bg-overlay)] text-[var(--text-tertiary)] border-[var(--border-subtle)]',
};

export function NewsTab({ ticker }: Props) {
  const [sourceFilter, setSourceFilter] = useState<string>('All');

  const { data, isLoading } = useQuery({
    queryKey: ['news', ticker],
    queryFn: () => fetchJson(`/api/news/${encodeURIComponent(ticker)}`),
    staleTime: 300_000,
  });

  if (isLoading) return <SkeletonCard className="h-96" />;

  const allNews: NewsItem[] = Array.isArray(data?.news) ? data.news : [];
  const sentiment = data?.sentiment ?? null;

  if (allNews.length === 0) {
    return (
      <div className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 text-center">
        <div className="text-2xl mb-2">📰</div>
        <div className="text-[12px] font-mono text-[var(--text-secondary)]">No news available</div>
        <div className="text-[11px] font-mono text-[var(--text-tertiary)] mt-1">
          Add a <code className="bg-[var(--bg-overlay)] px-1 rounded">FINNHUB_API_KEY</code> to{' '}
          <code className="bg-[var(--bg-overlay)] px-1 rounded">.env.local</code> to enable company news.
        </div>
      </div>
    );
  }

  // Build source list for filter chips
  const sources = ['All', ...Array.from(new Set(allNews.map(n => n.source))).sort()];
  const filtered = sourceFilter === 'All' ? allNews : allNews.filter(n => n.source === sourceFilter);

  // Group by calendar day
  const groups: { day: string; items: NewsItem[] }[] = [];
  for (const item of filtered) {
    const label = dayLabel(item.publishedAt);
    const last = groups[groups.length - 1];
    if (last?.day === label) last.items.push(item);
    else groups.push({ day: label, items: [item] });
  }

  return (
    <div className="space-y-4">
      {/* Sentiment overview */}
      {sentiment && (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">
              Market Sentiment · Last 30 days
            </span>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${SENT_STYLE[sentiment.overallSentiment]}`}>
                {sentiment.overallSentiment.toUpperCase()}
              </span>
              <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
                Not investment advice
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full overflow-hidden bg-[var(--bg-overlay)] flex">
              <div className="h-full bg-[var(--positive)] rounded-l-full transition-all"
                   style={{ width: `${(sentiment.bullishPercent * 100).toFixed(0)}%` }} />
              <div className="h-full bg-[var(--negative)] rounded-r-full transition-all"
                   style={{ width: `${(sentiment.bearishPercent * 100).toFixed(0)}%` }} />
            </div>
            <span className="text-[10px] font-mono text-[var(--positive)] tabular-nums whitespace-nowrap">
              {(sentiment.bullishPercent * 100).toFixed(0)}% bull
            </span>
            <span className="text-[10px] font-mono text-[var(--negative)] tabular-nums whitespace-nowrap">
              {(sentiment.bearishPercent * 100).toFixed(0)}% bear
            </span>
          </div>
        </div>
      )}

      {/* Source filter chips */}
      {sources.length > 2 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {sources.map(src => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`px-2.5 py-1 text-[10px] font-mono rounded-full border flex-shrink-0 transition-colors ${
                sourceFilter === src
                  ? 'bg-[var(--accent-soft)] border-[var(--accent)] text-[var(--accent)]'
                  : 'bg-transparent border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-normal)]'
              }`}
            >
              {src}
            </button>
          ))}
        </div>
      )}

      {/* News grouped by day */}
      {groups.map(({ day, items }) => (
        <div key={day}>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] pb-1 mb-2">
            {day}
          </div>
          <div className="space-y-2">
            {items.map(item => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3
                           hover:border-[var(--border-normal)] hover:bg-[var(--bg-raised)] transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-[9px] font-mono bg-[var(--bg-overlay)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded text-[var(--text-tertiary)]">
                        {item.source}
                      </span>
                      {item.sentiment && (
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${SENT_STYLE[item.sentiment]}`}>
                          {item.sentiment}
                        </span>
                      )}
                      <span className="text-[9px] font-mono text-[var(--text-tertiary)]">
                        {timeAgo(item.publishedAt)}
                      </span>
                    </div>
                    <div className="text-[13px] font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                      {item.headline}
                    </div>
                    {item.summary && (
                      <div className="text-[11px] font-mono text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </div>
                    )}
                  </div>
                  <span className="flex-shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--accent)] text-sm mt-0.5 transition-colors">
                    ↗
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
