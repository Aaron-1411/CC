'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [supplementary, setSupplementary] = useState('');
  const [showSupp, setShowSupp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deriveBrand = (u: string) => {
    try {
      const host = new URL(u).hostname.replace('www.', '');
      const slug = host.split('.')[0];
      return slug.charAt(0).toUpperCase() + slug.slice(1);
    } catch { return ''; }
  };

  const handleUrlChange = (v: string) => {
    setUrl(v);
    if (!brandName) setBrandName(deriveBrand(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http')) targetUrl = `https://${targetUrl}`;
    try { new URL(targetUrl); } catch { setError('Please enter a valid URL'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          brandName: brandName || deriveBrand(targetUrl),
          supplementaryData: supplementary || undefined,
        }),
      });
      if (!res.ok) throw new Error('Server error');
      const { jobId } = await res.json();
      router.push(`/analysis/${jobId}`);
    } catch {
      setError('Failed to start analysis. Check your API key and try again.');
      setLoading(false);
    }
  };

  return (
    <main
      className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16 overflow-hidden bg-grid scan-lines"
      style={{ backgroundColor: '#080c14' }}
    >
      {/* Radial glow behind the form */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div
          className="w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Wordmark */}
        <div className="mb-12 text-center">
          <p className="text-xs font-mono tracking-[0.4em] text-cyan-500/70 uppercase mb-3">
            Ecommerce Intelligence
          </p>
          <h1
            className="text-5xl font-bold tracking-tight text-white font-mono text-glow-cyan"
            style={{ letterSpacing: '-0.02em' }}
          >
            DEEP DIVE
          </h1>
          <p className="text-zinc-500 text-sm font-mono mt-3 tracking-widest uppercase">
            13-Pillar Ecommerce Audit
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
          <span className="text-cyan-500/40 font-mono text-xs">◈</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* URL field */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500/60 font-mono text-sm pointer-events-none select-none">
              ⌖
            </span>
            <input
              type="text"
              value={url}
              onChange={e => handleUrlChange(e.target.value)}
              placeholder="https://target-brand.com"
              className="w-full glass rounded-lg pl-10 pr-4 py-4 text-base font-mono text-white placeholder-zinc-600 focus:outline-none focus:glow-cyan transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={e => e.currentTarget.style.border = '1px solid rgba(6,182,212,0.5)'}
              onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'}
              required
              autoFocus
            />
          </div>

          {/* Brand name */}
          <input
            type="text"
            value={brandName}
            onChange={e => setBrandName(e.target.value)}
            placeholder="Brand name (auto-detected)"
            className="w-full rounded-lg px-4 py-3 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
            onFocus={e => e.currentTarget.style.border = '1px solid rgba(6,182,212,0.4)'}
            onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'}
          />

          {/* Supplementary data */}
          <div>
            <button
              type="button"
              onClick={() => setShowSupp(s => !s)}
              className="flex items-center gap-2 text-zinc-500 hover:text-cyan-400 text-xs font-mono tracking-wider transition-colors py-1"
            >
              <span
                className="inline-block transition-transform duration-200"
                style={{ transform: showSupp ? 'rotate(90deg)' : 'rotate(0deg)' }}
              >
                ▶
              </span>
              SUPPLEMENTARY DATA
            </button>
            {showSupp && (
              <textarea
                value={supplementary}
                onChange={e => setSupplementary(e.target.value)}
                placeholder="Paste SEMrush exports, Similarweb data, email notes, ad library screenshots, or any other context to improve analysis accuracy..."
                rows={5}
                className="mt-2 w-full rounded-lg px-4 py-3 text-sm font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none resize-none transition-all animate-fadeSlideUp"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                onFocus={e => e.currentTarget.style.border = '1px solid rgba(6,182,212,0.3)'}
                onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'}
              />
            )}
          </div>

          {error && (
            <p className="text-red-400 text-xs font-mono tracking-wide py-1">
              ✗ {error}
            </p>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full py-4 rounded-lg font-mono font-bold text-sm tracking-widest uppercase transition-all duration-200 overflow-hidden"
            style={{
              background: loading ? 'rgba(255,255,255,0.04)' : 'rgba(6,182,212,0.08)',
              border: loading ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(6,182,212,0.5)',
              color: loading ? '#4b5563' : '#06b6d4',
              boxShadow: loading ? 'none' : '0 0 20px rgba(6,182,212,0.15)',
            }}
            onMouseEnter={e => {
              if (!loading) {
                const el = e.currentTarget;
                el.style.background = 'rgba(6,182,212,0.14)';
                el.style.boxShadow = '0 0 32px rgba(6,182,212,0.25)';
              }
            }}
            onMouseLeave={e => {
              if (!loading) {
                const el = e.currentTarget;
                el.style.background = 'rgba(6,182,212,0.08)';
                el.style.boxShadow = '0 0 20px rgba(6,182,212,0.15)';
              }
            }}
          >
            {loading ? 'INITIALISING…' : 'INITIATE AUDIT →'}
          </button>
        </form>

        {/* Status bar */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-zinc-600 text-xs font-mono">
              Powered by Gemini 2.0 · Live web data · ~8 min
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
