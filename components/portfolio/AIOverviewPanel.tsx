'use client';
import { useState, useEffect, useRef } from 'react';

type Status = 'idle' | 'loading' | 'streaming' | 'done' | 'error' | 'no-key';

export function AIOverviewPanel() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const abortRef = useRef<AbortController | null>(null);

  function startStream() {
    if (status === 'loading' || status === 'streaming') return;
    setText('');
    setStatus('loading');

    const abort = new AbortController();
    abortRef.current = abort;

    fetch('/api/portfolio/ai-overview', { method: 'POST', signal: abort.signal })
      .then(async res => {
        if (res.status === 503) { setStatus('no-key'); return; }
        if (!res.ok) { setStatus('error'); return; }
        if (!res.body) { setStatus('error'); return; }

        setStatus('streaming');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6).trim();
            if (!payload) continue;
            try {
              const json = JSON.parse(payload);
              if (json.done) { setStatus('done'); return; }
              if (json.error) { setStatus('error'); return; }
              if (json.text) setText(t => t + json.text);
            } catch { /* skip */ }
          }
        }
        setStatus('done');
      })
      .catch(err => {
        if (err.name !== 'AbortError') setStatus('error');
      });
  }

  useEffect(() => {
    startStream();
    return () => abortRef.current?.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Minimal markdown renderer: headers, bullets, bold
  function renderMarkdown(md: string) {
    const lines = md.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('## ')) {
        elements.push(
          <h3 key={i} className="text-[13px] font-semibold text-[var(--text-primary)] mt-5 mb-2 border-b border-[var(--border-subtle)] pb-1">
            {line.slice(3)}
          </h3>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h2 key={i} className="text-[15px] font-semibold text-[var(--text-primary)] mt-4 mb-2">
            {line.slice(2)}
          </h2>
        );
      } else if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <div key={i} className="flex gap-2 text-[12px] text-[var(--text-secondary)] leading-relaxed">
            <span className="text-[var(--accent)] mt-1 flex-shrink-0">▸</span>
            <span dangerouslySetInnerHTML={{ __html: boldify(line.slice(2)) }} />
          </div>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={i} className="h-1" />);
      } else {
        elements.push(
          <p key={i} className="text-[12px] text-[var(--text-secondary)] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: boldify(line) }} />
        );
      }
      i++;
    }
    return elements;
  }

  function boldify(s: string): string {
    return s.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--text-primary)] font-semibold">$1</strong>');
  }

  if (status === 'no-key') {
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center">
        <div className="text-[var(--text-tertiary)] text-sm mb-2">AI Overview requires an Anthropic API key</div>
        <div className="text-[11px] font-mono text-[var(--text-tertiary)]">Set XAI_API_KEY in .env.local to enable</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent)] text-base">✦</span>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-tertiary)]">AI Analyst Overview</span>
          {status === 'streaming' && (
            <span className="inline-flex gap-0.5 ml-1">
              {[0,1,2].map(i => (
                <span key={i} className="w-1 h-1 rounded-full bg-[var(--accent)] animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
              ))}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-[var(--text-tertiary)] border border-[var(--border-subtle)] px-1.5 py-0.5 rounded">
            NOT INVESTMENT ADVICE
          </span>
          {(status === 'done' || status === 'error') && (
            <button
              onClick={startStream}
              className="text-[10px] font-mono text-[var(--accent)] hover:opacity-80 transition-opacity"
            >
              Regenerate
            </button>
          )}
        </div>
      </div>

      {status === 'loading' && (
        <div className="space-y-2 animate-pulse">
          {[80, 65, 90, 55, 70].map((w, i) => (
            <div key={i} className="h-3 rounded bg-[var(--bg-raised)]" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {(status === 'streaming' || status === 'done') && text && (
        <div className="space-y-0.5">
          {renderMarkdown(text)}
          {status === 'streaming' && (
            <span className="inline-block w-0.5 h-3.5 bg-[var(--accent)] animate-pulse ml-0.5" />
          )}
        </div>
      )}

      {status === 'error' && (
        <div className="text-[12px] text-rose-400">
          Failed to generate overview.{' '}
          <button onClick={startStream} className="underline hover:opacity-80">Try again</button>
        </div>
      )}
    </div>
  );
}
