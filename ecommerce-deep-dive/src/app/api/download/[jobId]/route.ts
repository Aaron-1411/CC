export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/store';
import { generateReport } from '@/lib/report';
import { generateDeck } from '@/lib/deck';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const format = req.nextUrl.searchParams.get('format') || 'docx';
  const job = getJob(jobId);

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  try {
    if (format === 'docx') {
      const buffer = await generateReport(job);
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${job.brandName.toLowerCase()}-audit.docx"`,
        },
      });
    }

    if (format === 'pptx') {
      const buffer = await generateDeck(job);
      return new NextResponse(buffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'Content-Disposition': `attachment; filename="${job.brandName.toLowerCase()}-deck.pptx"`,
        },
      });
    }

    if (format === 'json') {
      return NextResponse.json(job);
    }

    return NextResponse.json({ error: 'Invalid format. Use docx, pptx, or json.' }, { status: 400 });
  } catch (err) {
    console.error('Download error:', err);
    return NextResponse.json({ error: 'File generation failed' }, { status: 500 });
  }
}
