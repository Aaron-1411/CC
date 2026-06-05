'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PillarSummary {
  green: number;
  amber: number;
  red: number;
  total: number;
}

interface AuditRow {
  id: string;
  brandName: string;
  url: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  pillarSummary: PillarSummary;
  topAction: string | null;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return '—'; }
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [inputPw, setInputPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [jobs, setJobs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Restore saved password
  useEffect(() => {
    const saved = localStorage.getItem('admin_pw');
    if (saved) {
      setPassword(saved);
      setAuthed(true);
    }
  }, []);

  // Fetch when authed
  useEffect(() => {
    if (!authed || !password) return;
    setLoading(true);
    setError('');
    fetch(`/api/admin?password=${encodeURIComponent(password)}`)
      .then(async res => {
        if (res.status === 401) throw new Error('Wrong password');
        const data = await res.json();
        setJobs(data.jobs ?? []);
      })
      .catch(err => {
        setError(err.message);
        setAuthed(false);
        localStorage.removeItem('admin_pw');
      })
      .finally(() => setLoading(false));
  }, [authed, password]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('admin_pw', inputPw);
    setPassword(inputPw);
    setAuthed(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_pw');
    setAuthed(false);
    setPassword('');
    setJobs([]);
  };

  const downloadJob = async (jobId: string, brandName: string, format: 'docx' | 'pptx') => {
    const res = await fetch(`/api/download/${jobId}?format=${format}`);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${brandName.toLowerCase()}-audit.${format}`;
    a.click();
  };

  // ── Password gate ──────────────────────────────────────────────
  if (!authed) {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: '#080c14' }}
      >
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <p className="text-cyan-500/60 text-[10px] font-mono tracking-[0.4em] uppercase mb-3">
              Admin Access
            </p>
            <h1 className="text-3xl font-mono font-bold text-white tracking-tight">
              AUDIT ARCHIVE
            </h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={inputPw}
              onChange={e => setInputPw(e.target.value)}
              placeholder="Enter password"
              autoFocus
              className="w-full rounded-lg px-4 py-3 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={e => e.currentTarget.style.border = '1px solid rgba(6,182,212,0.5)'}
              onBlur={e => e.currentTarget.style.border = '1px solid rgba(255,255,255,0.08)'}
            />
            {error && <p className="text-red-400 text-xs font-mono">✗ {error}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-mono font-bold text-sm tracking-widest uppercase transition-all"
              style={{
                background: 'rgba(6,182,212,0.08)',
                border: '1px solid rgba(6,182,212,0.5)',
                color: '#06b6d4',
              }}
            >
              AUTHENTICATE →
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ── Main admin view ────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080c14' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-6 py-4"
        style={{
          background: 'rgba(8,12,20,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white font-mono font-bold text-base tracking-widest">
              AUDIT ARCHIVE
            </h1>
            <p className="text-zinc-600 text-xs font-mono">
              {jobs.length} audits stored
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-mono text-zinc-500 hover:text-cyan-400 transition-colors tracking-wider"
            >
              ← NEW AUDIT
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors tracking-wider"
            >
              LOGOUT
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading && (
          <div className="flex items-center gap-3 text-zinc-600 font-mono text-sm py-16 justify-center">
            <div
              className="w-4 h-4 rounded-full border-t-cyan-500 border-2 border-transparent animate-spin"
              style={{ borderTopColor: 'rgba(6,182,212,0.6)' }}
            />
            Loading archive…
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-zinc-600 font-mono text-sm tracking-wider">NO AUDITS STORED YET</p>
            <Link
              href="/"
              className="mt-4 inline-block text-xs font-mono text-cyan-500/70 hover:text-cyan-400 transition-colors"
            >
              Run your first audit →
            </Link>
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {/* Table header */}
            <div
              className="grid px-4 py-2.5"
              style={{
                gridTemplateColumns: '1fr 1.5fr 120px 100px 1fr 140px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {['BRAND', 'URL', 'DATE', 'PILLARS', 'TOP ACTION', 'DOWNLOADS'].map(h => (
                <span key={h} className="text-[10px] font-mono font-bold tracking-widest text-zinc-600 uppercase">
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {jobs.map((job, idx) => (
              <div
                key={job.id}
                className="grid px-4 py-3 items-center hover:bg-white/[0.02] transition-colors group"
                style={{
                  gridTemplateColumns: '1fr 1.5fr 120px 100px 1fr 140px',
                  borderBottom: idx < jobs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                {/* Brand */}
                <div>
                  <Link
                    href={`/admin/${job.id}`}
                    className="text-sm font-mono font-bold text-zinc-200 hover:text-cyan-400 transition-colors"
                  >
                    {job.brandName}
                  </Link>
                </div>

                {/* URL */}
                <a
                  href={job.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-zinc-600 hover:text-zinc-400 truncate transition-colors"
                >
                  {job.url.replace(/^https?:\/\/(www\.)?/, '')}
                </a>

                {/* Date */}
                <span className="text-xs font-mono text-zinc-500">
                  {formatDate(job.startedAt)}
                </span>

                {/* Pillar RAG counts */}
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-mono font-bold text-xs">{job.pillarSummary.green}</span>
                  <span className="text-zinc-700 font-mono text-xs">/</span>
                  <span className="text-amber-400 font-mono font-bold text-xs">{job.pillarSummary.amber}</span>
                  <span className="text-zinc-700 font-mono text-xs">/</span>
                  <span className="text-red-400 font-mono font-bold text-xs">{job.pillarSummary.red}</span>
                </div>

                {/* Top action */}
                <span className="text-xs text-zinc-600 truncate pr-4">
                  {job.topAction ?? '—'}
                </span>

                {/* Downloads */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadJob(job.id, job.brandName, 'docx')}
                    className="px-2 py-1 rounded text-[10px] font-mono font-bold transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      color: '#e4e4e7',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    WORD
                  </button>
                  <button
                    onClick={() => downloadJob(job.id, job.brandName, 'pptx')}
                    className="px-2 py-1 rounded text-[10px] font-mono font-bold transition-all"
                    style={{
                      background: 'transparent',
                      color: '#71717a',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    DECK
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
