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
  is_active: boolean;
  is_available: boolean;
  resolution_label: string | null;
  actual_pixels: number | null;
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
    await supabase.from('admin_audit_log').insert({
      action: 'pricing_tier_create',
      entity_type: 'model_pricing_tier',
      entity_id: tier.model_id,
      old_value: {},
      new_value: { tier_label: tier.tier_label, quality_level: tier.quality_level, cost_per_run: tier.cost_per_run, credits_charged: tier.credits_charged },
    } as any);
    await fetchTiers();
  }, [fetchTiers]);

  const updateTier = useCallback(async (id: string, updates: Partial<PricingTier>) => {
    const existing = tiers.find(t => t.id === id) || Object.values(allTiers).flat().find(t => t.id === id);
    const { error } = await supabase.from('model_pricing_tiers').update({ ...updates, updated_at: new Date().toISOString() } as any).eq('id', id);
    if (error) throw error;
    await supabase.from('admin_audit_log').insert({
      action: 'pricing_tier_update',
      entity_type: 'model_pricing_tier',
      entity_id: id,
      old_value: existing ? { tier_label: existing.tier_label, cost_per_run: existing.cost_per_run, credits_charged: existing.credits_charged, is_active: existing.is_active } : {},
      new_value: updates,
    } as any);
    await fetchTiers();
  }, [fetchTiers, tiers, allTiers]);

  const deleteTier = useCallback(async (id: string) => {
    const existing = tiers.find(t => t.id === id) || Object.values(allTiers).flat().find(t => t.id === id);
    const { error } = await supabase.from('model_pricing_tiers').delete().eq('id', id);
    if (error) throw error;
    await supabase.from('admin_audit_log').insert({
      action: 'pricing_tier_delete',
      entity_type: 'model_pricing_tier',
      entity_id: id,
      old_value: existing ? { tier_label: existing.tier_label, quality_level: existing.quality_level, cost_per_run: existing.cost_per_run, credits_charged: existing.credits_charged } : {},
      new_value: {},
    } as any);
    await fetchTiers();
  }, [fetchTiers, tiers, allTiers]);

  const getCreditsForModelQuality = useCallback((mId: string, quality: string): number | null => {
    const modelTiers = (allTiers[mId] || tiers.filter(t => t.model_id === mId)).filter(t => t.is_active !== false && t.is_available !== false);
    const match = modelTiers.find(t => t.quality_level === quality);
    if (match) return match.credits_charged;
    const def = modelTiers.find(t => t.is_default);
    return def?.credits_charged ?? null;
  }, [allTiers, tiers]);

  const getCostForModelQuality = useCallback((mId: string, quality: string): number | null => {
    const modelTiers = (allTiers[mId] || tiers.filter(t => t.model_id === mId)).filter(t => t.is_active !== false);
    const match = modelTiers.find(t => t.quality_level === quality);
    if (match) return match.cost_per_run;
    const def = modelTiers.find(t => t.is_default);
    return def?.cost_per_run ?? null;
  }, [allTiers, tiers]);

  return { tiers, allTiers, syncLogs, loading, addTier, updateTier, deleteTier, getCreditsForModelQuality, getCostForModelQuality, reload: fetchTiers, reloadLogs: fetchSyncLogs };
}
