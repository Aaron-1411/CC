import { AnalysisJob } from '@/types/analysis';

// In-memory job store
const jobs = new Map<string, AnalysisJob>();

export function setJob(job: AnalysisJob) {
  jobs.set(job.id, job);
}

export function getJob(id: string): AnalysisJob | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, updates: Partial<AnalysisJob>) {
  const job = jobs.get(id);
  if (!job) return;
  jobs.set(id, { ...job, ...updates });
}

export function getAllJobs(): AnalysisJob[] {
  return Array.from(jobs.values());
}

// ── Cloudflare KV persistence ────────────────────────────────────────────────
// TTL: 90 days
const KV_TTL_SECONDS = 60 * 60 * 24 * 90;

function getKV(): KVNamespace | undefined {
  try {
    // @cloudflare/next-on-pages only available in edge runtime at request time
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getRequestContext } = require('@cloudflare/next-on-pages');
    const { env } = getRequestContext();
    return (env as Record<string, unknown>).AUDITS_KV as KVNamespace | undefined;
  } catch {
    return undefined;
  }
}

export async function persistJob(job: AnalysisJob): Promise<void> {
  try {
    const kv = getKV();
    if (!kv) return;
    await kv.put(`audit:${job.id}`, JSON.stringify(job), {
      expirationTtl: KV_TTL_SECONDS,
    });
  } catch {
    // gracefully skip if KV unavailable (local dev)
  }
}

export async function listPersistedJobs(): Promise<AnalysisJob[]> {
  try {
    const kv = getKV();
    if (!kv) return [];

    const list = await kv.list({ prefix: 'audit:' });
    const jobs = await Promise.all(
      list.keys.map(async ({ name }) => {
        const raw = await kv.get(name);
        if (!raw) return null;
        try { return JSON.parse(raw) as AnalysisJob; } catch { return null; }
      })
    );
    return jobs.filter((j): j is AnalysisJob => j !== null);
  } catch {
    return [];
  }
}
