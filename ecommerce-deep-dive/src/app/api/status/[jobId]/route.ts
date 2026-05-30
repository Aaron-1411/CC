export const runtime = 'edge';

import { NextRequest } from 'next/server';
import { getJob } from '@/lib/store';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const encoder = new TextEncoder();
  let lastPillarCount = 0;
  let lastRunningName = '';

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller closed
        }
      };

      const poll = () => {
        const job = getJob(jobId);
        if (!job) {
          send({ type: 'error', data: { message: 'Job not found' } });
          controller.close();
          return;
        }

        const completedPillars = job.pillars.filter(
          p => p.status !== 'PENDING' && p.status !== 'RUNNING'
        );

        // Emit newly completed pillars
        if (completedPillars.length > lastPillarCount) {
          for (const pillar of completedPillars.slice(lastPillarCount)) {
            send({ type: 'pillar_complete', data: pillar });
          }
          lastPillarCount = completedPillars.length;
        }

        // Emit running pillar notification
        const runningPillar = job.pillars.find(p => p.status === 'RUNNING');
        if (runningPillar && runningPillar.name !== lastRunningName) {
          send({ type: 'pillar_running', data: { id: runningPillar.id, name: runningPillar.name } });
          lastRunningName = runningPillar.name;
        }

        if (job.status === 'COMPLETE' || job.status === 'FAILED') {
          send({ type: 'job_complete', data: job });
          controller.close();
          return;
        }

        setTimeout(poll, 1500);
      };

      poll();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
