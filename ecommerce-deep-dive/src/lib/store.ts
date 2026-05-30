import { AnalysisJob } from '@/types/analysis';

// In-memory job store (replace with Redis/DB for production)
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
