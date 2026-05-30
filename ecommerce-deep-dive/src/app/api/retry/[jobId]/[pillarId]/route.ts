export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getJob, updateJob } from '@/lib/store';
import { runPillarAnalysis } from '@/lib/claude';
import { PILLARS } from '@/lib/pillars';
import { PillarResult } from '@/types/analysis';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string; pillarId: string }> }
) {
  const { jobId, pillarId: pillarIdStr } = await params;
  const pillarId = parseInt(pillarIdStr, 10);

  const job = getJob(jobId);
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const pillar = PILLARS.find(p => p.id === pillarId);
  if (!pillar) return NextResponse.json({ error: 'Pillar not found' }, { status: 404 });

  // Mark as running
  const runningPillar: PillarResult = {
    id: pillarId,
    name: pillar.name,
    status: 'RUNNING',
    findings: [],
    opportunity: '',
  };
  updateJob(jobId, {
    pillars: [...job.pillars.filter(p => p.id !== pillarId), runningPillar],
  });

  // Fire-and-forget retry
  runPillarAnalysis(pillarId, pillar.name, job.url, job.supplementaryData)
    .then(result => {
      const updated = getJob(jobId)!;
      updateJob(jobId, {
        pillars: [...updated.pillars.filter(p => p.id !== pillarId), result],
      });
    })
    .catch(err => {
      const errorResult: PillarResult = {
        id: pillarId,
        name: pillar.name,
        status: 'AMBER',
        findings: [],
        opportunity: '',
        error: err instanceof Error ? err.message : 'Retry failed',
        completedAt: new Date(),
      };
      const updated = getJob(jobId)!;
      updateJob(jobId, {
        pillars: [...updated.pillars.filter(p => p.id !== pillarId), errorResult],
      });
    });

  return NextResponse.json({ ok: true });
}
