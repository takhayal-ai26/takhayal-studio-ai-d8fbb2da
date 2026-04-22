import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export type JobStatus = 'queued' | 'generating' | 'processing' | 'completed' | 'failed';

export interface GenerationJob {
  id: string;
  status: JobStatus;
  prompt: string;
  image_url: string | null;
  error_message?: string | null;
  ratio: string | null;
  resolution: string | null;
  quality_tier: string | null;
  model_id: string | null;
  credits_used: number;
  created_at: string;
  tool_id: string | null;
  media_type?: string;
  video_url?: string | null;
  thumbnail_url?: string | null;
  duration?: string | null;
  source_mode?: string | null;
  used_image_input?: boolean;
  input_image_urls?: string[];
}

const JOB_COLUMNS = 'id, status, prompt, image_url, error_message, ratio, resolution, quality_tier, model_id, credits_used, created_at, tool_id, media_type, video_url, thumbnail_url, duration, source_mode, used_image_input, input_image_urls';
const IN_PROGRESS_STATUSES: JobStatus[] = ['queued', 'generating', 'processing'];

function normalizeStatus(status: string | null | undefined): JobStatus {
  if (status === 'queued' || status === 'generating' || status === 'processing' || status === 'failed') {
    return status;
  }

  return 'completed';
}

export function useGenerationJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);

  const markJobFailed = useCallback(async (jobId: string, errorMessage?: string | null) => {
    setJobs(prev => prev.map(job => job.id === jobId ? { ...job, status: 'failed' as JobStatus, error_message: errorMessage ?? job.error_message ?? null } : job));

    const { error } = await supabase
      .from('generation_logs')
      .update({ status: 'failed' as string, error_message: errorMessage ?? null })
      .eq('id', jobId);

    if (error) {
      console.error('Failed to mark generation job as failed:', error);
    }
  }, []);

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
          status: normalizeStatus(d.status),
          resolution: d.resolution || d.quality_tier || null,
          tool_id: d.tool_id || null,
          input_image_urls: Array.isArray(d.input_image_urls) ? (d.input_image_urls as string[]) : [],
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
          const updated = payload.new as Record<string, any>;

          setJobs(prev => {
            const exists = prev.some(j => j.id === updated.id);

            if (exists) {
              return prev.map(j =>
                j.id === updated.id
          ? {
              ...j,
              status: normalizeStatus(updated.status),
              prompt: updated.prompt ?? j.prompt,
              image_url: updated.image_url ?? j.image_url,
              error_message: updated.error_message ?? j.error_message ?? null,
              ratio: updated.ratio ?? j.ratio,
                      resolution: updated.resolution ?? updated.quality_tier ?? j.resolution,
                      quality_tier: updated.quality_tier ?? j.quality_tier,
                      model_id: updated.model_id ?? j.model_id,
                      credits_used: updated.credits_used ?? j.credits_used,
                      created_at: updated.created_at ?? j.created_at,
                      tool_id: updated.tool_id ?? j.tool_id,
                    }
                  : j
              );
            }

            // Edge case: record was inserted from another device/session
            return [{
              id: String(updated.id),
              status: normalizeStatus(updated.status),
              prompt: updated.prompt || '',
              image_url: updated.image_url ?? null,
              error_message: updated.error_message ?? null,
              ratio: updated.ratio ?? null,
              resolution: updated.resolution ?? updated.quality_tier ?? null,
              quality_tier: updated.quality_tier ?? null,
              model_id: updated.model_id ?? null,
              credits_used: updated.credits_used || 0,
              created_at: updated.created_at || new Date().toISOString(),
              tool_id: updated.tool_id ?? null,
            }, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'generation_logs', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const inserted = payload.new as Record<string, any>;

          setJobs(prev => {
            // Don't duplicate if we already have it (optimistic insert)
            if (prev.some(j => j.id === inserted.id)) return prev;

            return [{
              id: String(inserted.id),
              status: normalizeStatus(inserted.status),
              prompt: inserted.prompt || '',
              image_url: inserted.image_url ?? null,
              error_message: inserted.error_message ?? null,
              ratio: inserted.ratio ?? null,
              resolution: inserted.resolution ?? inserted.quality_tier ?? null,
              quality_tier: inserted.quality_tier ?? null,
              model_id: inserted.model_id ?? null,
              credits_used: inserted.credits_used || 0,
              created_at: inserted.created_at || new Date().toISOString(),
              tool_id: inserted.tool_id ?? null,
            }, ...prev];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Poll as a reliability fallback while jobs are still in progress.
  useEffect(() => {
    if (!user) return;
    if (!jobs.some(job => IN_PROGRESS_STATUSES.includes(job.status))) return;

    const intervalId = window.setInterval(() => {
      fetchJobs();
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [user, jobs, fetchJobs]);

  // Create a processing job optimistically and return its ID
  const createJob = useCallback(async (params: {
    prompt: string;
    ratio: string;
    qualityTier: string;
    modelId: string | null;
    creditCost: number;
    sourceTag?: string;
  }): Promise<string | null> => {
    if (!user) return null;

    const baseInsert = {
      user_id: user.id,
      status: 'queued' as string,
      prompt: params.prompt.slice(0, 500),
      ratio: params.ratio,
      resolution: params.qualityTier,
      requested_ratio: params.ratio,
      quality_tier: params.qualityTier,
      requested_quality_tier: params.qualityTier,
      credits_used: params.creditCost,
      tool_id: params.sourceTag || null,
    };

    let insertedModelId = params.modelId || null;

    let { data, error } = await supabase
      .from('generation_logs')
      .insert({
        ...baseInsert,
        model_id: insertedModelId,
      })
      .select('id')
      .single();

    if ((error || !data) && error?.code === '23503' && params.modelId) {
      insertedModelId = null;

      const retryResult = await supabase
        .from('generation_logs')
        .insert({
          ...baseInsert,
          model_id: null,
        })
        .select('id')
        .single();

      data = retryResult.data;
      error = retryResult.error;
    }

    if (error || !data) {
      console.error('Failed to create generation job:', error);
      return null;
    }

    setJobs(prev => [{
      id: data.id,
      status: 'queued' as JobStatus,
      prompt: params.prompt,
      image_url: null,
      error_message: null,
      ratio: params.ratio,
      resolution: params.qualityTier,
      quality_tier: params.qualityTier,
      model_id: insertedModelId,
      credits_used: params.creditCost,
      created_at: new Date().toISOString(),
      tool_id: params.sourceTag || null,
    }, ...prev]);

    return data.id;
  }, [user]);

  // Fire-and-forget generation call
  const startGeneration = useCallback(async (jobId: string, params: {
    prompt: string;
    aspectRatio: string;
    qualityTier: string;
    modelId: string | null;
    imageUrl?: string;
    imageUrls?: string[];
  }) => {
    try {
      setJobs(prev => prev.map(job =>
        job.id === jobId
          ? {
              ...job,
              status: 'generating' as JobStatus,
              ratio: params.aspectRatio,
              resolution: params.qualityTier,
              quality_tier: params.qualityTier,
              model_id: params.modelId ?? job.model_id,
            }
          : job
      ));

      const { error: statusError } = await supabase
        .from('generation_logs')
        .update({
          status: 'generating' as string,
          ratio: params.aspectRatio,
          resolution: params.qualityTier,
          quality_tier: params.qualityTier,
          model_id: params.modelId || null,
        })
        .eq('id', jobId);

      if (statusError) {
        console.error('Failed to update generation status to generating:', statusError);
      }

      const { error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: params.prompt,
          aspect_ratio: params.aspectRatio,
          quality_tier: params.qualityTier,
          model_id: params.modelId,
          num_images: 1,
          job_id: jobId,
          image_url: params.imageUrl || undefined,
          image_urls: params.imageUrls || undefined,
        },
      });

      if (error) {
        console.error('Generation invoke error:', error);
        await markJobFailed(jobId, error.message);
      }
    } catch (err) {
      console.error('Generation call failed:', err);
      const message = err instanceof Error ? err.message : 'Unknown generation error';
      await markJobFailed(jobId, message);
    }
  }, [markJobFailed]);

  const submitJob = useCallback(async (params: {
    prompt: string;
    ratio: string;
    qualityTier: string;
    modelId: string | null;
    creditCost: number;
    sourceTag?: string;
    imageUrl?: string;
    imageUrls?: string[];
  }) => {
    const jobId = await createJob({
      prompt: params.prompt,
      ratio: params.ratio,
      qualityTier: params.qualityTier,
      modelId: params.modelId,
      creditCost: params.creditCost,
      sourceTag: params.sourceTag,
    });

    if (!jobId) {
      return null;
    }

    void startGeneration(jobId, {
      prompt: params.prompt,
      aspectRatio: params.ratio,
      qualityTier: params.qualityTier,
      modelId: params.modelId,
      imageUrl: params.imageUrl,
      imageUrls: params.imageUrls,
    });

    return jobId;
  }, [createJob, startGeneration]);

  // Retry a failed job
  const retryJob = useCallback(async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;

    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'generating' as JobStatus } : j));
    await supabase.from('generation_logs').update({ status: 'generating' as string }).eq('id', jobId);

    void startGeneration(jobId, {
      prompt: job.prompt,
      aspectRatio: job.ratio || '1:1',
      qualityTier: job.resolution || job.quality_tier || '1K',
      modelId: job.model_id,
    });
  }, [jobs, startGeneration]);

  // Submit a video generation job
  const submitVideoJob = useCallback(async (params: {
    prompt: string;
    ratio: string;
    quality: string;
    duration: string;
    modelId: string;
    creditCost: number;
    imageUrl?: string;
    endFrameUrl?: string;
    generateAudio?: boolean;
  }) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('generation_logs')
      .insert({
        user_id: user.id,
        status: 'queued' as string,
        prompt: params.prompt.slice(0, 500),
        ratio: params.ratio,
        resolution: params.quality,
        quality_tier: params.quality,
        credits_used: params.creditCost,
        model_id: params.modelId,
        media_type: 'video',
        duration: params.duration,
        source_mode: params.imageUrl ? 'image-to-video' : 'text-to-video',
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Failed to create video job:', error);
      return null;
    }

    const jobId = data.id;

    setJobs(prev => [{
      id: jobId,
      status: 'queued' as JobStatus,
      prompt: params.prompt,
      image_url: null,
      ratio: params.ratio,
      resolution: params.quality,
      quality_tier: params.quality,
      model_id: params.modelId,
      credits_used: params.creditCost,
      created_at: new Date().toISOString(),
      tool_id: null,
      media_type: 'video',
      video_url: null,
      thumbnail_url: null,
      duration: params.duration,
      source_mode: params.imageUrl ? 'image-to-video' : 'text-to-video',
    }, ...prev]);

    // Fire generation
    try {
      const { error: invokeError } = await supabase.functions.invoke('generate-video', {
        body: {
          prompt: params.prompt,
          aspect_ratio: params.ratio,
          quality: params.quality,
          duration: params.duration,
          model_id: params.modelId,
          job_id: jobId,
          image_url: params.imageUrl,
          end_frame_url: params.endFrameUrl,
          generate_audio: params.generateAudio ?? false,
        },
      });
      if (invokeError) {
        console.error('Video generation invoke error:', invokeError);
        await markJobFailed(jobId);
      }
    } catch (err) {
      console.error('Video generation call failed:', err);
      await markJobFailed(jobId);
    }

    return jobId;
  }, [user, markJobFailed]);

  return { jobs, loading, createJob, startGeneration, submitJob, submitVideoJob, retryJob, refetch: fetchJobs };
}
