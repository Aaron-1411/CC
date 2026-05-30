export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { setJob, updateJob, getJob } from '@/lib/store';
import { runPillarAnalysis, buildOpportunityMatrix } from '@/lib/claude';
import { PILLARS, PILLAR_ORDER } from '@/lib/pillars';
import { AnalysisJob, PillarResult } from '@/types/analysis';

export async function POST(req: NextRequest) {
  const { url, brandName, supplementaryData } = await req.json();

  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  const jobId = uuidv4();
  const resolvedBrand = brandName || parsedUrl.hostname.replace('www.', '').split('.')[0];
  const job: AnalysisJob = {
    id: jobId,
    url,
    brandName: resolvedBrand.charAt(0).toUpperCase() + resolvedBrand.slice(1),
    supplementaryData,
    status: 'PENDING',
    pillars: [],
    startedAt: new Date(),
  };

  setJob(job);

  // Fire-and-forget background analysis
  runAnalysis(jobId, url, job.brandName, supplementaryData).catch(console.error);

  return NextResponse.json({ jobId });
}

async function runAnalysis(
  jobId: string,
  url: string,
  brandName: string,
  supplementaryData?: string
) {
  updateJob(jobId, { status: 'RUNNING' });

  const completedPillars: PillarResult[] = [];

  for (const pillarId of PILLAR_ORDER) {
    const pillar = PILLARS.find(p => p.id === pillarId)!;

    // Mark this pillar as running
    const snapshot = getJob(jobId)!;
    const runningPillar: PillarResult = {
      id: pillarId,
      name: pillar.name,
      status: 'RUNNING',
      findings: [],
      opportunity: '',
    };
    updateJob(jobId, {
      pillars: [...snapshot.pillars.filter(p => p.id !== pillarId), runningPillar],
    });

    try {
      const result = await runPillarAnalysis(pillarId, pillar.name, url, supplementaryData);
      completedPillars.push(result);
      const updated = getJob(jobId)!;
      updateJob(jobId, {
        pillars: [...updated.pillars.filter(p => p.id !== pillarId), result],
      });
    } catch (err) {
      const errorResult: PillarResult = {
        id: pillarId,
        name: pillar.name,
        status: 'AMBER',
        findings: [],
        opportunity: '',
        error: err instanceof Error ? err.message : 'Analysis failed',
        completedAt: new Date(),
      };
      completedPillars.push(errorResult);
      const updated = getJob(jobId)!;
      updateJob(jobId, {
        pillars: [...updated.pillars.filter(p => p.id !== pillarId), errorResult],
      });
    }
  }

  // Opportunity matrix from successful pillars
  const successPillars = completedPillars.filter(p => !p.error && p.opportunity);
  try {
    const matrix = await buildOpportunityMatrix(successPillars, url);
    updateJob(jobId, {
      status: 'COMPLETE',
      completedAt: new Date(),
      opportunityMatrix: matrix,
      pillars: completedPillars,
    });
  } catch {
    updateJob(jobId, {
      status: 'COMPLETE',
      completedAt: new Date(),
      pillars: completedPillars,
    });
  }
}
