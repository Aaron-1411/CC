export const runtime = 'edge';
import { AnalysisClient } from './client';

interface Props {
  params: Promise<{ jobId: string }>;
}

export default async function Page({ params }: Props) {
  const { jobId } = await params;
  return <AnalysisClient jobId={jobId} />;
}
