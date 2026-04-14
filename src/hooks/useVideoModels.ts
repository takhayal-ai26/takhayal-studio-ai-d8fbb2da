import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VideoModel {
  id: string;
  name: string;
  display_name: string;
  fal_endpoint: string;
  provider: string;
  preview_image_url: string;
  supports_audio: boolean;
  supports_start_frame: boolean;
  start_frame_required: boolean;
  supports_end_frame: boolean;
  supports_reference_images: boolean;
  aspect_ratios: string[];
  resolutions: string[];
  durations: number[];
  credit_cost_per_second_no_audio: number;
  credit_cost_per_second_with_audio: number;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
}

export function useVideoModels(activeOnly = true) {
  const [models, setModels] = useState<VideoModel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('video_models' as any)
      .select('*')
      .order('sort_order', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Failed to fetch video_models:', error);
      setLoading(false);
      return;
    }

    setModels(
      (data || []).map((d: any): VideoModel => ({
        id: d.id,
        name: d.name,
        display_name: d.display_name,
        fal_endpoint: d.fal_endpoint,
        provider: d.provider || '',
        preview_image_url: d.preview_image_url || '',
        supports_audio: d.supports_audio ?? false,
        supports_start_frame: d.supports_start_frame ?? false,
        start_frame_required: d.start_frame_required ?? false,
        supports_end_frame: d.supports_end_frame ?? false,
        supports_reference_images: d.supports_reference_images ?? false,
        aspect_ratios: Array.isArray(d.aspect_ratios) ? d.aspect_ratios : [],
        resolutions: Array.isArray(d.resolutions) ? d.resolutions : [],
        durations: Array.isArray(d.durations) ? d.durations : [],
        credit_cost_per_second_no_audio: d.credit_cost_per_second_no_audio ?? 5,
        credit_cost_per_second_with_audio: d.credit_cost_per_second_with_audio ?? 0,
        badge: d.badge || null,
        is_active: d.is_active ?? true,
        sort_order: d.sort_order ?? 0,
      }))
    );
    setLoading(false);
  }, [activeOnly]);

  useEffect(() => { fetch(); }, [fetch]);

  return { models, loading, refetch: fetch };
}
