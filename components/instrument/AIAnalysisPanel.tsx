'use client';
import { useState } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { usePortfolioStore } from '@/store/portfolioStore';
import { SkeletonText } from '@/components/shared/SkeletonCard';

interface Props { ticker: string; name: string; type: string; }

export function AIAnalysisPanel({ ticker, name, type }: Props) {
  const [followUp, setFollowUp] = useState('');
  const { messages, streaming, error, sendMessage } = useAnalysis();
  const positions = usePortfolioStore((s) => s.positions);
  const pos = positions.find((p) => p.ticker === ticker);

  const buildContext = () => {
    const posStr = pos
      ? `Current position: £${pos.currentValueGBP.toFixed(2)} value, ${(pos.weight * 100).toFixed(2)}% weight, daily P&L: ${pos.dailyPct >= 0 ? '+' : ''}£${pos.dailyChangeGBP.toFixed(2)} (${pos.dailyPct.toFixed(2)}%)`
      : '';
    return `Analyst context for ${ticker} (${name}, ${type}) in a UK ISA portfolio. ${posStr}. Today: ${new Date().toDateString()}. Provide professional investment analysis with current market context.`;
  };

  const runAnalysis = () => {
    sendMessage(`Provide a complete professional analysis of ${ticker} (${name}). Include: investment thesis, today's price move explanation, key risks, technical levels, and upcoming catalysts. Use web search for latest data.`, buildContext());
  };

  const sendFollowUp = () => {
    if (!followUp.trim()) return;
    sendMessage(followUp, buildContext());
    setFollowUp('');
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div>
      {messages.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-4">
          <p className="text-[var(--text-secondary)] text-sm text-center max-w-sm">
            Get a real-time AI analysis of {ticker} with live web data from Claude.
          </p>
          <button
            onClick={runAnalysis}
            disabled={streaming}
            className="px-5 py-2.5 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50"
          >
            {streaming ? 'Analysing…' : `Analyse ${ticker}`}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`text-sm leading-relaxed ${m.role === 'user' ? 'text-[var(--text-secondary)] italic border-l-2 border-[var(--border-normal)] pl-3' : 'text-[var(--text-primary)]'}`}>
              {m.content || (streaming && i === messages.length - 1 ? <SkeletonText lines={4} /> : null)}
            </div>
          ))}
          {error && <div className="text-[var(--negative)] text-sm p-3 rounded bg-[var(--negative-bg)] border border-[var(--negative-bg)]">{error}</div>}
        </div>
      )}

      {/* Follow-up input */}
      {messages.length > 0 && (
        <div className="flex gap-2 mt-4">
          <input
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !streaming) sendFollowUp(); }}
            placeholder="Ask a follow-up question…"
            disabled={streaming}
            className="flex-1 bg-[var(--bg-overlay)] border border-[var(--border-normal)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
          />
          <button
            onClick={sendFollowUp}
            disabled={streaming || !followUp.trim()}
            className="px-4 py-2 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}
