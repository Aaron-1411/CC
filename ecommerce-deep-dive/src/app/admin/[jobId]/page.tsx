export const runtime = 'edge';

import { NextRequest } from 'next/server';
import { listPersistedJobs } from '@/lib/store';
import { AnalysisClient } from '@/app/analysis/[jobId]/client';

interface Props {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ password?: string }>;
}

// Retrieve a single job from KV via listPersistedJobs (simple approach for edge)
async function getPersistedJob(jobId: string) {
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext();
    const kv = (env as Record<string, unknown>).AUDITS_KV as KVNamespace | undefined;
    if (!kv) return null;
    const raw = await kv.get(`audit:${jobId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function AdminJobPage({ params, searchParams }: Props) {
  const { jobId } = await params;
  const { password } = await searchParams;

  // Auth check
  let adminPassword: string | undefined;
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext();
    adminPassword = (env as Record<string, unknown>).ADMIN_PASSWORD as string | undefined;
  } catch {}

  if (adminPassword && password !== adminPassword) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#080c14' }}
      >
        <p className="text-red-400 font-mono text-sm">
          Unauthorized. Append <code className="text-zinc-400">?password=xxx</code> to this URL.
        </p>
      </div>
    );
  }

  const job = await getPersistedJob(jobId);

  if (!job) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#080c14' }}
      >
        <div className="text-center">
          <p className="text-zinc-500 font-mono text-sm mb-3">Audit not found in archive.</p>
          <a href="/admin" className="text-cyan-500/70 font-mono text-xs hover:text-cyan-400 transition-colors">
            ← Back to archive
          </a>
        </div>
      </div>
    );
  }

  return <AnalysisClient jobId={jobId} initialJob={job} />;
}
