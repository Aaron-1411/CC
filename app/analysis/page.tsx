'use client';
import { useState, useRef, useEffect } from 'react';
import { useAnalysis } from '@/hooks/useAnalysis';
import { usePortfolioStore } from '@/store/portfolioStore';
import { usePriceStore } from '@/store/priceStore';
import { SkeletonText } from '@/components/shared/SkeletonCard';

const SUGGESTED = [
  'Summarise my portfolio performance this month',
  'Which positions are dragging my Sharpe ratio down?',
  'Am I too concentrated in US tech?',
  'Should I rebalance and what trades would you suggest?',
  'What\'s the macro risk to my ISA right now?',
  'Generate a morning brief for today',
  'Which holding has the best risk-adjusted return?',
  'How does my portfolio compare to just holding VWRP?',
];

export default function AnalysisPage() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, streaming, error, sendMessage, clearMessages } = useAnalysis();

  const positions = usePortfolioStore((s) => s.positions);
  const totalValueGBP = usePortfolioStore((s) => s.totalValueGBP);
  const totalDailyChangeGBP = usePortfolioStore((s) => s.totalDailyChangeGBP);
  const gbpUsd = usePriceStore((s) => s.gbpUsd);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildSystemContext = () => {
    const posStr = positions.map((p) =>
      `${p.ticker}: £${p.currentValueGBP.toFixed(2)} (${(p.weight * 100).toFixed(2)}%), ${p.dailyPct >= 0 ? '+' : ''}${p.dailyPct.toFixed(2)}% today`
    ).join('; ');
    return `UK ISA Portfolio Assistant. Today: ${new Date().toDateString()}. GBP/USD: ${gbpUsd.toFixed(4)}. Portfolio total: £${totalValueGBP.toFixed(2)}, daily: ${totalDailyChangeGBP >= 0 ? '+' : ''}£${totalDailyChangeGBP.toFixed(2)}. Positions: ${posStr}. Provide institutional-grade analysis.`;
  };

  const send = () => {
    if (!input.trim() || streaming) return;
    sendMessage(input.trim(), buildSystemContext());
    setInput('');
  };

  const runMorningBrief = () => {
    sendMessage(
      `Generate a comprehensive morning brief for my UK ISA portfolio. Include: (1) overnight/pre-market moves on my holdings, (2) economic releases affecting my positions today, (3) key news per holding, (4) today's risk outlook, (5) suggested action items. Use web search for current data.`,
      buildSystemContext()
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen px-4 lg:px-6 py-5 max-w-[900px]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-[var(--text-primary)]">AI Analysis</h1>
        <div className="flex gap-2">
          <button
            onClick={runMorningBrief}
            disabled={streaming}
            className="px-3 py-1.5 text-xs font-mono rounded-lg bg-[var(--neutral-bg)] border border-[var(--neutral)] text-[var(--neutral)] hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            Morning Brief
          </button>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="px-3 py-1.5 text-xs font-mono rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--border-normal)] transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Suggested prompts */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {SUGGESTED.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s, buildSystemContext())}
              disabled={streaming}
              className="px-3 py-1.5 text-xs font-mono rounded-full border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50 text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]'
              }`}
            >
              {m.content || (streaming && i === messages.length - 1 ? <SkeletonText lines={3} /> : <span className="text-[var(--text-tertiary)]">…</span>)}
            </div>
          </div>
        ))}
        {error && (
          <div className="p-3 rounded-lg bg-[var(--negative-bg)] border border-[var(--negative-bg)] text-[var(--negative)] text-sm">{error}</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-[var(--border-subtle)]">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask about your portfolio…"
          disabled={streaming}
          className="flex-1 bg-[var(--bg-overlay)] border border-[var(--border-normal)] rounded-lg px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={streaming || !input.trim()}
          className="px-5 py-2.5 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent)] hover:text-white transition-colors disabled:opacity-50"
        >
          {streaming ? '…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
