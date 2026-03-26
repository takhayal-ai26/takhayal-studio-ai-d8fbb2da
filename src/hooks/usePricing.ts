import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PricingConfig {
  creditValueUsd: number;
  defaultCredits: number;
}

interface ModelPricing {
  modelId: string;
  creditsPerGeneration: number;
  costPerRun: number;
}

export function usePricing() {
  const [config, setConfig] = useState<PricingConfig>({ creditValueUsd: 0.02, defaultCredits: 2 });
  const [modelPricingMap, setModelPricingMap] = useState<Record<string, ModelPricing>>({});

  const load = useCallback(async () => {
    const [csRes, mRes] = await Promise.all([
      supabase.from('credit_settings').select('credit_value_usd, default_credits_per_generation').limit(1).single(),
      supabase.from('models').select('id, credits_per_generation, cost_per_run').eq('is_active', true),
    ]);
    if (csRes.data) {
      const d = csRes.data as any;
      setConfig({ creditValueUsd: d.credit_value_usd, defaultCredits: d.default_credits_per_generation });
    }
    if (mRes.data) {
      const map: Record<string, ModelPricing> = {};
      for (const m of mRes.data as any[]) {
        map[m.id] = { modelId: m.id, creditsPerGeneration: m.credits_per_generation ?? 2, costPerRun: m.cost_per_run ?? 0 };
      }
      setModelPricingMap(map);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getCreditsForModel = useCallback((modelId: string) => {
    return modelPricingMap[modelId]?.creditsPerGeneration ?? config.defaultCredits;
  }, [modelPricingMap, config]);

  const logGeneration = useCallback(async (params: {
    modelId: string; prompt: string; imageUrl?: string; ratio?: string; resolution?: string;
  }) => {
    const mp = modelPricingMap[params.modelId];
    const credits = mp?.creditsPerGeneration ?? config.defaultCredits;
    const providerCost = mp?.costPerRun ?? 0;
    const revenue = credits * config.creditValueUsd;
    const margin = revenue - providerCost;

    await supabase.from('generation_logs').insert({
      model_id: params.modelId,
      prompt: params.prompt,
      image_url: params.imageUrl,
      credits_used: credits,
      provider_cost: providerCost,
      revenue,
      margin,
      ratio: params.ratio,
      resolution: params.resolution,
    });
  }, [modelPricingMap, config]);

  return { config, getCreditsForModel, logGeneration, reload: load };
}
