'use client';
import { useEffect, useState, useRef, use } from 'react';
import { AnalysisJob, PillarResult } from '@/types/analysis';
import { PillarCard } from '@/components/PillarCard';
import { PillarSidebar } from '@/components/PillarSidebar';
import { OpportunityMatrix } from '@/components/OpportunityMatrix';

interface Props { params: Promise<{ jobId: string }> }

export default function AnalysisPage({ params }: Props) {
  const { jobId } = use(params);
  const [job, setJob] = useState<Partial<AnalysisJob>>({ pillars: [], status: 'PENDING' });
  const [currentlyRunning, setCurrentlyRunning] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

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
    const es = subscribe(jobId);
    return () => es.close();
  }, [jobId]);

  const handleRetry = async (pillarId: number) => {
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

  const completedCount  = (job.pillars || []).filter(p => p.status !== 'PENDING' && p.status !== 'RUNNING').length;
  const isComplete      = job.status === 'COMPLETE';
  const greenCount      = (job.pillars || []).filter(p => p.status === 'GREEN').length;
  const amberCount      = (job.pillars || []).filter(p => p.status === 'AMBER').length;
  const redCount        = (job.pillars || []).filter(p => p.status === 'RED').length;
  const sortedPillars   = [...(job.pillars || [])].sort((a, b) => a.id - b.id);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base truncate">{job.brandName || '…'}</h1>
            <p className="text-zinc-500 text-xs truncate">{job.url}</p>
          </div>
          <div className="text-zinc-500 text-sm shrink-0 hidden sm:block">
            {isComplete
              ? <span className="text-emerald-400 font-semibold">Analysis complete</span>
              : <span>{completedCount} of 13 pillars{currentlyRunning ? ` · Analysing ${currentlyRunning}…` : ''}</span>
            }
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => download('docx')}
              disabled={completedCount === 0 || downloading === 'docx'}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors border ${
                completedCount > 0
                  ? 'bg-white text-zinc-900 border-white hover:bg-zinc-100'
                  : 'bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed'
              }`}
            >
              {downloading === 'docx' ? '…' : 'Word Report'}
            </button>
            <button
              onClick={() => download('pptx')}
              disabled={!isComplete || downloading === 'pptx'}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors border ${
                isComplete
                  ? 'bg-zinc-800 text-zinc-200 border-zinc-600 hover:bg-zinc-700'
                  : 'bg-zinc-900 text-zinc-700 border-zinc-800 cursor-not-allowed'
              }`}
            >
              {downloading === 'pptx' ? '…' : 'Deck'}
            </button>
            <button
              onClick={() => download('json')}
              className="px-3 py-1.5 rounded text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              JSON
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex gap-6 px-6 py-6">
        <PillarSidebar pillars={job.pillars || []} />

        <main className="flex-1 min-w-0 space-y-4">
          {/* Completion summary */}
          {isComplete && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-wrap items-center gap-4 animate-fadeSlideUp">
              <div className="flex gap-4">
                <span className="text-emerald-400 font-bold text-sm">{greenCount} Green</span>
                <span className="text-amber-400 font-bold text-sm">{amberCount} Amber</span>
                <span className="text-red-400 font-bold text-sm">{redCount} Red</span>
              </div>
              {job.opportunityMatrix?.highImpactEasy?.[0] && (
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-500 text-xs">Top priority →</p>
                  <p className="text-zinc-200 text-sm truncate">{job.opportunityMatrix.highImpactEasy[0]}</p>
                </div>
              )}
            </div>
          )}

          {/* Pillar cards */}
          {sortedPillars.map(pillar => (
            <PillarCard key={pillar.id} pillar={pillar} jobId={jobId} onRetry={handleRetry} />
          ))}

          {/* Opportunity matrix */}
          {isComplete && job.opportunityMatrix && (
            <OpportunityMatrix matrix={job.opportunityMatrix} />
          )}

          {/* Empty / starting state */}
          {sortedPillars.length === 0 && (
            <div className="flex flex-col items-center justify-center py-32 text-zinc-600">
              <div className="text-4xl mb-4 animate-spin">⟳</div>
              <p className="text-sm">Starting analysis…</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
