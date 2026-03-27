import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ModelRecord {
  id: string;
  provider_id: string | null;
  model_name: string;
  endpoint_id: string;
  provider_name: string;
  speed: string | null;
  cost_per_run: number | null;
  best_for: string | null;
  best_for_ar: string | null;
  input_type: 'image_size' | 'aspect_ratio';
  supported_ratios: string[];
  supported_sizes: string[];
  supported_quality_tiers: string[];
  default_ratio: string | null;
  default_resolution: string | null;
  max_resolution: string | null;
  is_active: boolean;
  is_default: boolean;
  notes: string | null;
  admin_overrides: Record<string, unknown>;
  last_sync_at: string | null;
  pricing_mode: string;
  credits_per_generation: number | null;
  upscale_strategy: string;
  supports_native_high_res: boolean;
  created_at: string;
  updated_at: string;
}

function parseModel(row: any): ModelRecord {
  return {
    ...row,
    cost_per_run: row.cost_per_run ? Number(row.cost_per_run) : null,
    supported_ratios: Array.isArray(row.supported_ratios) ? row.supported_ratios : [],
    supported_sizes: Array.isArray(row.supported_sizes) ? row.supported_sizes : [],
    supported_quality_tiers: Array.isArray(row.supported_quality_tiers) ? row.supported_quality_tiers : ['1K'],
    best_for_ar: row.best_for_ar ?? null,
    admin_overrides: row.admin_overrides || {},
    pricing_mode: row.pricing_mode || 'fixed_per_image',
    credits_per_generation: row.credits_per_generation ?? null,
    upscale_strategy: row.upscale_strategy || 'esrgan',
    supports_native_high_res: row.supports_native_high_res ?? false,
  };
}

export function useModels() {
  const [models, setModels] = useState<ModelRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchModels = useCallback(async () => {
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .order('is_active', { ascending: false })
      .order('is_default', { ascending: false })
      .order('model_name');

    if (error) {
      console.error('Failed to fetch models:', error);
      return;
    }
    setModels((data || []).map(parseModel));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchModels();
    const channel = supabase
      .channel('models-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'models' }, () => {
        fetchModels();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchModels]);

  const updateModel = useCallback(async (id: string, updates: Partial<ModelRecord>) => {
    const { error } = await supabase
      .from('models')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id);
    if (error) throw error;
    await fetchModels();
  }, [fetchModels]);

  const activeModels = models.filter(m => m.is_active);
  const defaultModel = models.find(m => m.is_default) || activeModels[0] || null;

  return { models, activeModels, defaultModel, loading, fetchModels, updateModel };
}
