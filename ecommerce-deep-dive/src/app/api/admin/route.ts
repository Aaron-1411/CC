export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { listPersistedJobs } from '@/lib/store';

export async function GET(req: NextRequest) {
  // Password check
  const password = req.nextUrl.searchParams.get('password');

  let adminPassword: string | undefined;
  try {
    const { getRequestContext } = await import('@cloudflare/next-on-pages');
    const { env } = getRequestContext();
    adminPassword = (env as Record<string, unknown>).ADMIN_PASSWORD as string | undefined;
  } catch {
    // local dev: fall through, allow if no password set
  }

  if (adminPassword && password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobs = await listPersistedJobs();

  // Sort by startedAt desc
  jobs.sort((a, b) => {
    const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
    const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
    return bTime - aTime;
  });

  // Return summary rows
  const rows = jobs.map(job => ({
    id: job.id,
    brandName: job.brandName,
    url: job.url,
    status: job.status,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    pillarSummary: {
      green: (job.pillars || []).filter(p => p.status === 'GREEN').length,
      amber: (job.pillars || []).filter(p => p.status === 'AMBER').length,
      red: (job.pillars || []).filter(p => p.status === 'RED').length,
      total: (job.pillars || []).length,
    },
    topAction: job.opportunityMatrix?.highImpactEasy?.[0] ?? null,
  }));

  return NextResponse.json({ jobs: rows });
}
