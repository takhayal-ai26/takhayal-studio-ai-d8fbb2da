import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PricingTier {
  id: string;
  model_id: string;
  tier_label: string;
  quality_level: string | null;
  resolution_key: string | null;
  aspect_ratio: string | null;
  width: number | null;
  height: number | null;
  megapixels: number | null;
  cost_per_run: number;
  credits_charged: number;
  pricing_mode: string;
  is_default: boolean;
  notes: string | null;
}

export interface SyncLog {
  id: string;
  provider_name: string;
  sync_status: string;
  synced_models_count: number;
  error_message: string | null;
  created_at: string;
}

export function usePricingTiers(modelId?: string) {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [allTiers, setAllTiers] = useState<Record<string, PricingTier[]>>({});
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTiers = useCallback(async () => {
    const query = supabase.from('model_pricing_tiers').select('*').order('is_default', { ascending: false }).order('tier_label');
    
    if (modelId) {
      const { data } = await query.eq('model_id', modelId);
      setTiers((data as unknown as PricingTier[]) || []);
    } else {
      const { data } = await query;
      const grouped: Record<string, PricingTier[]> = {};
      for (const t of (data as unknown as PricingTier[]) || []) {
        if (!grouped[t.model_id]) grouped[t.model_id] = [];
        grouped[t.model_id].push(t);
      }
      setAllTiers(grouped);
    }
    setLoading(false);
  }, [modelId]);

  const fetchSyncLogs = useCallback(async () => {
    const { data } = await supabase
      .from('pricing_sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setSyncLogs((data as unknown as SyncLog[]) || []);
  }, []);

  useEffect(() => { fetchTiers(); fetchSyncLogs(); }, [fetchTiers, fetchSyncLogs]);

  const addTier = useCallback(async (tier: Omit<PricingTier, 'id'>) => {
    const { error } = await supabase.from('model_pricing_tiers').insert(tier as any);
    if (error) throw error;
    await fetchTiers();
  }, [fetchTiers]);

  const updateTier = useCallback(async (id: string, updates: Partial<PricingTier>) => {
    const { error } = await supabase.from('model_pricing_tiers').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
    if (error) throw error;
    await fetchTiers();
  }, [fetchTiers]);

  const deleteTier = useCallback(async (id: string) => {
    const { error } = await supabase.from('model_pricing_tiers').delete().eq('id', id);
    if (error) throw error;
    await fetchTiers();
  }, [fetchTiers]);

  const getCreditsForModelQuality = useCallback((mId: string, quality: string): number | null => {
    const modelTiers = allTiers[mId] || tiers.filter(t => t.model_id === mId);
    const match = modelTiers.find(t => t.quality_level === quality);
    if (match) return match.credits_charged;
    const def = modelTiers.find(t => t.is_default);
    return def?.credits_charged ?? null;
  }, [allTiers, tiers]);

  const getCostForModelQuality = useCallback((mId: string, quality: string): number | null => {
    const modelTiers = allTiers[mId] || tiers.filter(t => t.model_id === mId);
    const match = modelTiers.find(t => t.quality_level === quality);
    if (match) return match.cost_per_run;
    const def = modelTiers.find(t => t.is_default);
    return def?.cost_per_run ?? null;
  }, [allTiers, tiers]);

  return { tiers, allTiers, syncLogs, loading, addTier, updateTier, deleteTier, getCreditsForModelQuality, getCostForModelQuality, reload: fetchTiers, reloadLogs: fetchSyncLogs };
}
