import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type JobStatus = 'processing' | 'completed' | 'failed';

export interface GenerationJob {
  id: string;
  status: JobStatus;
  prompt: string;
  image_url: string | null;
  ratio: string | null;
  quality_tier: string | null;
  model_id: string | null;
  credits_used: number;
  created_at: string;
}

export function useGenerationJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch existing jobs for the user
  const fetchJobs = useCallback(async () => {
    if (!user) { setJobs([]); setLoading(false); return; }
    const { data } = await supabase
      .from('generation_logs')
      .select('id, status, prompt, image_url, ratio, quality_tier, model_id, credits_used, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (data) {
      setJobs(data.map(d => ({
        ...d,
        status: (d.status || 'completed') as JobStatus,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Realtime subscription for updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('generation-jobs')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'generation_logs', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as any;
          setJobs(prev => prev.map(j =>
            j.id === updated.id
              ? { ...j, status: updated.status, image_url: updated.image_url, credits_used: updated.credits_used }
              : j
          ));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Create a processing job optimistically and return its ID
  const createJob = useCallback(async (params: {
    prompt: string;
    ratio: string;
    qualityTier: string;
    modelId: string | null;
    creditCost: number;
  }): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('generation_logs')
      .insert({
        user_id: user.id,
        status: 'processing',
        prompt: params.prompt.slice(0, 500),
        ratio: params.ratio,
        requested_ratio: params.ratio,
        quality_tier: params.qualityTier,
        requested_quality_tier: params.qualityTier,
        model_id: params.modelId,
        credits_used: params.creditCost,
      })
      .select('id')
      .single();
    if (error || !data) {
      console.error('Failed to create generation job:', error);
      return null;
    }
    // Add optimistically to local state
    setJobs(prev => [{
      id: data.id,
      status: 'processing',
      prompt: params.prompt,
      image_url: null,
      ratio: params.ratio,
      quality_tier: params.qualityTier,
      model_id: params.modelId,
      credits_used: params.creditCost,
      created_at: new Date().toISOString(),
    }, ...prev]);
    return data.id;
  }, [user]);

  // Fire-and-forget generation call
  const startGeneration = useCallback(async (jobId: string, params: {
    prompt: string;
    aspectRatio: string;
    qualityTier: string;
    modelId: string | null;
  }) => {
    try {
      await supabase.functions.invoke('generate-image', {
        body: {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio,
          quality_tier: params.qualityTier,
          model_id: params.modelId,
          num_images: 1,
          job_id: jobId,
        },
      });
    } catch (err) {
      console.error('Generation call failed:', err);
      // Mark as failed locally
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'failed' as JobStatus } : j));
    }
  }, []);

  // Retry a failed job
  const retryJob = useCallback(async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    // Reset status
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'processing' as JobStatus } : j));
    await supabase.from('generation_logs').update({ status: 'processing' }).eq('id', jobId);
    startGeneration(jobId, {
      prompt: job.prompt,
      aspectRatio: job.ratio || '1:1',
      qualityTier: job.quality_tier || '1K',
      modelId: job.model_id,
    });
  }, [jobs, startGeneration]);

  return { jobs, loading, createJob, startGeneration, retryJob, refetch: fetchJobs };
}
