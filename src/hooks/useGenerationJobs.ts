import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  IN_PROGRESS_STATUSES,
  buildOptimisticJob,
  createGenerationLog,
  fetchGenerationJobs,
  getFunctionErrorMessage,
  markGenerationJobFailed,
  mapGenerationLogToJob,
} from './generationJobs';

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

export function useGenerationJobs() {
  const { user, refreshProfile } = useAuth();
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [loading, setLoading] = useState(true);

  const markJobFailed = useCallback(async (jobId: string, errorMessage?: string | null) => {
    setJobs(prev => prev.map(job => job.id === jobId ? { ...job, status: 'failed' as JobStatus, error_message: errorMessage ?? job.error_message ?? null } : job));

    const error = await markGenerationJobFailed(supabase, jobId, errorMessage);
    if (error) {
      console.error('Failed to mark generation job as failed:', error);
    }
  }, []);

  // Fetch existing jobs for the user from the database
  const fetchJobs = useCallback(async () => {
    if (!user) { setJobs([]); setLoading(false); return; }
    try {
      const { jobs: fetchedJobs, error } = await fetchGenerationJobs(supabase, user.id);
      if (error) {
        console.error('Failed to fetch gallery jobs:', error);
      }

      if (fetchedJobs) {
        setJobs(fetchedJobs);
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
                  ? mapGenerationLogToJob({ ...j, ...updated })
                  : j
              );
            }

            // Edge case: record was inserted from another device/session
            return [mapGenerationLogToJob(updated), ...prev];
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

            return [mapGenerationLogToJob(inserted), ...prev];
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

    const { id, modelId, error } = await createGenerationLog(supabase, {
      userId: user.id,
      prompt: params.prompt,
      ratio: params.ratio,
      qualityTier: params.qualityTier,
      modelId: params.modelId,
      creditCost: params.creditCost,
      sourceTag: params.sourceTag,
    });

    if (error || !id) {
      console.error('Failed to create generation job:', error);
      return null;
    }

    setJobs(prev => [buildOptimisticJob({
      kind: 'image',
      id,
      prompt: params.prompt,
      ratio: params.ratio,
      qualityTier: params.qualityTier,
      modelId,
      creditCost: params.creditCost,
      sourceTag: params.sourceTag,
    }), ...prev]);

    return id;
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
        await markJobFailed(jobId, await getFunctionErrorMessage(error));
        await refreshProfile();
        return;
      }
      await refreshProfile();
    } catch (err) {
      console.error('Generation call failed:', err);
      await markJobFailed(jobId, await getFunctionErrorMessage(err));
      await refreshProfile();
    }
  }, [markJobFailed, refreshProfile]);

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
    referenceImageUrls?: string[];
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
        source_mode: params.imageUrl || (params.referenceImageUrls?.length ?? 0) > 0 ? 'image-to-video' : 'text-to-video',
        input_image_urls: params.referenceImageUrls || [],
      })
      .select('id')
      .single();

    if (error || !data) {
      console.error('Failed to create video job:', error);
      return null;
    }

    const jobId = data.id;

    setJobs(prev => [buildOptimisticJob({
      kind: 'video',
      id: jobId,
      prompt: params.prompt,
      ratio: params.ratio,
      qualityTier: params.quality,
      modelId: params.modelId,
      creditCost: params.creditCost,
      duration: params.duration,
      sourceMode: params.imageUrl || (params.referenceImageUrls?.length ?? 0) > 0 ? 'image-to-video' : 'text-to-video',
      inputImageUrls: params.referenceImageUrls || [],
    }), ...prev]);

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
          reference_image_urls: params.referenceImageUrls || [],
          generate_audio: params.generateAudio ?? false,
        },
      });
      if (invokeError) {
        console.error('Video generation invoke error:', invokeError);
        await markJobFailed(jobId);
      }
      await refreshProfile();
    } catch (err) {
      console.error('Video generation call failed:', err);
      await markJobFailed(jobId);
      await refreshProfile();
    }

    return jobId;
  }, [user, markJobFailed, refreshProfile]);

  return { jobs, loading, createJob, startGeneration, submitJob, submitVideoJob, retryJob, refetch: fetchJobs };
}
