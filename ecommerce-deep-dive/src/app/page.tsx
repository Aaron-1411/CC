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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        {/* Wordmark */}
        <div className="mb-12 text-center">
          <span className="text-xs font-bold tracking-[0.3em] text-zinc-500 uppercase block mb-1">
            E-Commerce
          </span>
          <h1 className="text-3xl font-black text-white tracking-tight">Deep Dive</h1>
          <p className="text-zinc-500 text-sm mt-2">13-pillar brand audit powered by Claude</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL */}
          <input
            type="text"
            value={url}
            onChange={e => handleUrlChange(e.target.value)}
            placeholder="https://example.com"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-4 text-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
            required
            autoFocus
          />

          {/* Brand name */}
          <input
            type="text"
            value={brandName}
            onChange={e => setBrandName(e.target.value)}
            placeholder="Brand name (auto-detected)"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
          />

          {/* Supplementary data */}
          <div>
            <button
              type="button"
              onClick={() => setShowSupp(s => !s)}
              className="text-zinc-500 hover:text-zinc-300 text-xs flex items-center gap-1.5 transition-colors"
            >
              <span className={`transition-transform inline-block ${showSupp ? 'rotate-90' : ''}`}>▶</span>
              Add supplementary data (optional)
            </button>
            {showSupp && (
              <textarea
                value={supplementary}
                onChange={e => setSupplementary(e.target.value)}
                placeholder="Paste in SEMrush exports, Similarweb screenshot descriptions, email sequence notes, ad library data, or any other context that will improve the analysis..."
                rows={6}
                className="mt-2 w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors resize-none"
              />
            )}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-100 disabled:bg-zinc-700 text-zinc-950 disabled:text-zinc-500 font-bold py-4 rounded-lg text-base transition-colors"
          >
            {loading ? 'Starting analysis…' : 'Start Deep Dive →'}
          </button>
        </form>

        <p className="mt-8 text-center text-zinc-700 text-xs">
          ~8 min total · 13 pillars · Sequential analysis with live results
        </p>
      </div>
    </main>
  );
}
