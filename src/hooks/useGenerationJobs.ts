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

const JOB_COLUMNS = 'id, status, prompt, image_url, ratio, quality_tier, model_id, credits_used, created_at';

export function useGenerationJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch existing jobs for the user from the database
  const fetchJobs = useCallback(async () => {
    if (!user) { setJobs([]); setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('generation_logs')
        .select(JOB_COLUMNS)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) {
        console.error('Failed to fetch gallery jobs:', error);
      }

      if (data) {
        setJobs(data.map(d => ({
          ...d,
          status: (d.status || 'completed') as JobStatus,
        })));
      }
    } catch (err) {
      console.error('Gallery fetch error:', err);
    }
    setLoading(false);
  }, [user]);

  // Refetch when user changes (login/logout)
  useEffect(() => {
    setLoading(true);
    fetchJobs();
  }, [fetchJobs]);

  // Realtime subscription for INSERT and UPDATE events
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('generation-jobs')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'generation_logs', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as any;
          setJobs(prev => {
            const exists = prev.some(j => j.id === updated.id);
            if (exists) {
              return prev.map(j =>
                j.id === updated.id
                  ? { ...j, status: updated.status as JobStatus, image_url: updated.image_url, credits_used: updated.credits_used }
                  : j
              );
            }
            // Edge case: record was inserted from another device/session
            return [{
              id: updated.id,
              status: (updated.status || 'completed') as JobStatus,
              prompt: updated.prompt || '',
              image_url: updated.image_url,
              ratio: updated.ratio,
              quality_tier: updated.quality_tier,
              model_id: updated.model_id,
              credits_used: updated.credits_used || 0,
              created_at: updated.created_at,
            }, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'generation_logs', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const inserted = payload.new as any;
          setJobs(prev => {
            // Don't duplicate if we already have it (optimistic insert)
            if (prev.some(j => j.id === inserted.id)) return prev;
            return [{
              id: inserted.id,
              status: (inserted.status || 'completed') as JobStatus,
              prompt: inserted.prompt || '',
              image_url: inserted.image_url,
              ratio: inserted.ratio,
              quality_tier: inserted.quality_tier,
              model_id: inserted.model_id,
              credits_used: inserted.credits_used || 0,
              created_at: inserted.created_at,
            }, ...prev];
          });
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

    // Don't pass model_id in the initial insert to avoid FK constraint failures
    // The edge function will resolve and set the correct model_id with service role
    const { data, error } = await supabase
      .from('generation_logs')
      .insert({
        user_id: user.id,
        status: 'processing' as string,
        prompt: params.prompt.slice(0, 500),
        ratio: params.ratio,
        requested_ratio: params.ratio,
        quality_tier: params.qualityTier,
        requested_quality_tier: params.qualityTier,
        model_id: params.modelId || null,
        credits_used: params.creditCost,
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Failed to create generation job:', error);
      // If FK constraint on model_id, retry without it
      if (error?.code === '23503' && params.modelId) {
        const { data: retryData, error: retryError } = await supabase
          .from('generation_logs')
          .insert({
            user_id: user.id,
            status: 'processing' as string,
            prompt: params.prompt.slice(0, 500),
            ratio: params.ratio,
            requested_ratio: params.ratio,
            quality_tier: params.qualityTier,
            requested_quality_tier: params.qualityTier,
            model_id: null,
            credits_used: params.creditCost,
          })
          .select('id')
          .single();

        if (retryError || !retryData) {
          console.error('Retry also failed:', retryError);
          return null;
        }

        setJobs(prev => [{
          id: retryData.id,
          status: 'processing' as JobStatus,
          prompt: params.prompt,
          image_url: null,
          ratio: params.ratio,
          quality_tier: params.qualityTier,
          model_id: null,
          credits_used: params.creditCost,
          created_at: new Date().toISOString(),
        }, ...prev]);
        return retryData.id;
      }
      return null;
    }

    // Add optimistically to local state
    setJobs(prev => [{
      id: data.id,
      status: 'processing' as JobStatus,
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
      const { error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio,
          quality_tier: params.qualityTier,
          model_id: params.modelId,
          num_images: 1,
          job_id: jobId,
        },
      });
      if (error) {
        console.error('Generation invoke error:', error);
        setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'failed' as JobStatus } : j));
      }
    } catch (err) {
      console.error('Generation call failed:', err);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'failed' as JobStatus } : j));
    }
  }, []);

  // Retry a failed job
  const retryJob = useCallback(async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
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
