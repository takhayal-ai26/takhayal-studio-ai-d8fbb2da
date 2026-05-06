type MinimalGenerationJob = { id: string; status?: string | null };

export function isGenerationJobInProgress(jobs: MinimalGenerationJob[], jobId: string | null) {
  if (!jobId) return false;
  const job = jobs.find(item => item.id === jobId);
  return job?.status === 'queued' || job?.status === 'generating' || job?.status === 'processing';
}
