type Sentiment = 'bullish' | 'bearish' | 'neutral' | 'positive' | 'negative';

interface Props {
  sentiment: Sentiment;
  size?: 'sm' | 'md';
}

export function SentimentBadge({ sentiment, size = 'sm' }: Props) {
  const norm = sentiment === 'positive' ? 'bullish' : sentiment === 'negative' ? 'bearish' : sentiment;

  const styles = {
    bullish: 'bg-[var(--positive-bg)] text-[var(--positive)] border-[var(--positive-bg)]',
    bearish: 'bg-[var(--negative-bg)] text-[var(--negative)] border-[var(--negative-bg)]',
    neutral: 'bg-[var(--bg-raised)] text-[var(--text-secondary)] border-[var(--border-normal)]',
  };

  const label = norm.charAt(0).toUpperCase() + norm.slice(1);
  const px = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded border font-semibold font-mono ${px} ${styles[norm]}`}>
      {label}
    </span>
  );
}
