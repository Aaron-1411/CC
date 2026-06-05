'use client';
import { useEffect, useState, useRef } from 'react';
import { AnalysisJob, PillarResult } from '@/types/analysis';
import { PillarCard } from '@/components/PillarCard';
import { PillarSidebar } from '@/components/PillarSidebar';
import { OpportunityMatrix } from '@/components/OpportunityMatrix';

interface Props { jobId: string; initialJob?: Partial<AnalysisJob> }

export function AnalysisClient({ jobId, initialJob }: Props) {
  const [job, setJob] = useState<Partial<AnalysisJob>>(
    initialJob ?? { pillars: [], status: 'PENDING' }
  );
  const [currentlyRunning, setCurrentlyRunning] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const isReadOnly = !!initialJob && initialJob.status === 'COMPLETE';

  const subscribe = (jId: string) => {
    const es = new EventSource(`/api/status/${jId}`);
    esRef.current = es;

    es.onmessage = (e) => {
      const { type, data } = JSON.parse(e.data);

      if (type === 'pillar_running') {
        setCurrentlyRunning(data.name);
        setJob(prev => {
          if (prev.pillars?.find(p => p.id === data.id)) return prev;
          const placeholder: PillarResult = {
            id: data.id, name: data.name, status: 'RUNNING', findings: [], opportunity: '',
          };
          return { ...prev, pillars: [...(prev.pillars || []), placeholder] };
        });
      }

      if (type === 'pillar_complete') {
        setCurrentlyRunning('');
        setJob(prev => ({
          ...prev,
          pillars: [...(prev.pillars || []).filter(p => p.id !== data.id), data],
        }));
      }

      if (type === 'job_complete') {
        setJob(data);
        setCurrentlyRunning('');
        es.close();
      }
    };

    es.onerror = () => es.close();
    return es;
  };

  useEffect(() => {
    if (isReadOnly) return;
    const es = subscribe(jobId);
    return () => es.close();
  }, [jobId]);

  const handleRetry = async (pillarId: number) => {
    if (isReadOnly) return;
    esRef.current?.close();
    await fetch(`/api/retry/${jobId}/${pillarId}`, { method: 'POST' });
    subscribe(jobId);
  };

  const download = async (format: 'docx' | 'pptx' | 'json') => {
    setDownloading(format);
    try {
      const res = await fetch(`/api/download/${jobId}?format=${format}`);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${job.brandName || 'audit'}-deep-dive.${format}`;
      a.click();
    } finally {
      setDownloading(null);
    }
  };

  const totalPillars    = 13;
  const completedCount  = (job.pillars || []).filter(p => p.status !== 'PENDING' && p.status !== 'RUNNING').length;
  const isComplete      = job.status === 'COMPLETE';
  const progressPct     = Math.round((completedCount / totalPillars) * 100);
  const greenCount      = (job.pillars || []).filter(p => p.status === 'GREEN').length;
  const amberCount      = (job.pillars || []).filter(p => p.status === 'AMBER').length;
  const redCount        = (job.pillars || []).filter(p => p.status === 'RED').length;
  const sortedPillars   = [...(job.pillars || [])].sort((a, b) => a.id - b.id);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080c14' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-6 py-0"
        style={{
          background: 'rgba(8,12,20,0.92)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Progress bar */}
        <div className="h-0.5 w-full absolute top-0 left-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background: isComplete
                ? 'linear-gradient(90deg, #06b6d4, #34d399)'
                : 'linear-gradient(90deg, #06b6d4, #22d3ee)',
              boxShadow: '0 0 8px rgba(6,182,212,0.5)',
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto flex items-center gap-4 py-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-mono font-bold text-sm tracking-wider truncate">
              {job.brandName || '…'}
            </h1>
            <p className="text-zinc-600 text-xs font-mono truncate">{job.url}</p>
          </div>

          {/* Status */}
          <div className="shrink-0 hidden sm:block">
            {isComplete ? (
              <span className="text-emerald-400 font-mono text-xs tracking-widest uppercase font-bold">
                ✓ COMPLETE
              </span>
            ) : (
              <span className="text-cyan-500/80 font-mono text-xs tracking-wider">
                SCANNING {completedCount}/{totalPillars}
                {currentlyRunning ? ` · ANALYSING: ${currentlyRunning}…` : ''}
              </span>
            )}
          </div>

          {/* Download buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => download('docx')}
              disabled={completedCount === 0 || downloading === 'docx'}
              className="px-3 py-1.5 rounded text-xs font-mono font-bold transition-all"
              style={
                completedCount > 0
                  ? { background: 'rgba(255,255,255,0.9)', color: '#080c14', border: '1px solid rgba(255,255,255,0.9)' }
                  : { background: 'transparent', color: '#3f3f46', border: '1px solid rgba(255,255,255,0.06)', cursor: 'not-allowed' }
              }
            >
              {downloading === 'docx' ? '…' : 'WORD'}
            </button>
            <button
              onClick={() => download('pptx')}
              disabled={!isComplete || downloading === 'pptx'}
              className="px-3 py-1.5 rounded text-xs font-mono font-bold transition-all"
              style={
                isComplete
                  ? { background: 'transparent', color: '#e4e4e7', border: '1px solid rgba(255,255,255,0.2)' }
                  : { background: 'transparent', color: '#3f3f46', border: '1px solid rgba(255,255,255,0.06)', cursor: 'not-allowed' }
              }
            >
              {downloading === 'pptx' ? '…' : 'DECK'}
            </button>
            <button
              onClick={() => download('json')}
              className="px-3 py-1.5 rounded text-xs font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              JSON
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex gap-6 px-6 py-6">
        <PillarSidebar pillars={job.pillars || []} />

        <main className="flex-1 min-w-0 space-y-3">
          {/* Completion banner */}
          {isComplete && (
            <div
              className="rounded-xl p-4 flex flex-wrap items-center gap-5 animate-fadeSlideUp"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* RAG counts */}
              <div className="flex gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#34d399' }} />
                  <span className="text-emerald-400 font-mono font-bold text-sm">{greenCount}</span>
                  <span className="text-zinc-600 font-mono text-xs">GREEN</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#fbbf24' }} />
                  <span className="text-amber-400 font-mono font-bold text-sm">{amberCount}</span>
                  <span className="text-zinc-600 font-mono text-xs">AMBER</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#f87171' }} />
                  <span className="text-red-400 font-mono font-bold text-sm">{redCount}</span>
                  <span className="text-zinc-600 font-mono text-xs">RED</span>
                </div>
              </div>

              {/* Top action */}
              {job.opportunityMatrix?.highImpactEasy?.[0] && (
                <div className="flex-1 min-w-0 pl-5" style={{ borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-zinc-600 text-[10px] font-mono tracking-widest uppercase mb-0.5">
                    Top Priority
                  </p>
                  <p className="text-zinc-200 text-sm truncate">{job.opportunityMatrix.highImpactEasy[0]}</p>
                </div>
              )}
            </div>
          )}

          {/* Pillar cards */}
          {sortedPillars.map(pillar => (
            <PillarCard
              key={pillar.id}
              pillar={pillar}
              jobId={jobId}
              onRetry={handleRetry}
            />
          ))}

          {/* Opportunity matrix */}
          {isComplete && job.opportunityMatrix && (
            <OpportunityMatrix matrix={job.opportunityMatrix} />
          )}

          {/* Starting state */}
          {sortedPillars.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-zinc-700">
              <div
                className="relative w-10 h-10 mb-6"
              >
                <div
                  className="absolute inset-0 rounded-full border-2 border-t-cyan-500/60 border-transparent animate-spin"
                  style={{ borderTopColor: 'rgba(6,182,212,0.6)' }}
                />
              </div>
              <p className="text-xs font-mono tracking-widest uppercase text-zinc-600">
                Initialising audit…
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
