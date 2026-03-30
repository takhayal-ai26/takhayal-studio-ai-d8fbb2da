import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface HeroConfig {
  hero_enabled: boolean;
  hero_title_en: string;
  hero_title_ar: string;
  hero_subtitle_en: string;
  hero_subtitle_ar: string;
  hero_placeholder_en: string;
  hero_placeholder_ar: string;
  hero_overlay_opacity: number;
  hero_text_align: 'center' | 'left' | 'right';
  hero_background_image: string;
}

const HERO_KEYS = [
  'hero_enabled', 'hero_title_en', 'hero_title_ar',
  'hero_subtitle_en', 'hero_subtitle_ar',
  'hero_placeholder_en', 'hero_placeholder_ar',
  'hero_overlay_opacity', 'hero_text_align', 'hero_background_image',
];

const defaults: HeroConfig = {
  hero_enabled: true,
  hero_title_en: 'Turn your ideas into professional visuals',
  hero_title_ar: 'حوّل أفكارك إلى صور احترافية',
  hero_subtitle_en: 'Create ads, content, and visuals in seconds using AI',
  hero_subtitle_ar: 'أنشئ إعلانات ومحتوى ومرئيات في ثوانٍ باستخدام الذكاء الاصطناعي',
  hero_placeholder_en: 'Describe what you want to create...',
  hero_placeholder_ar: 'صِف ما تريد إنشاءه...',
  hero_overlay_opacity: 0.55,
  hero_text_align: 'center',
  hero_background_image: '',
};

export function useHeroConfig() {
  const [config, setConfig] = useState<HeroConfig>(defaults);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    const { data } = await supabase
      .from('platform_config')
      .select('config_key, config_value')
      .in('config_key', HERO_KEYS);

    if (data) {
      const map: Record<string, string> = {};
      data.forEach((r: any) => { map[r.config_key] = r.config_value; });
      setConfig({
        hero_enabled: map.hero_enabled !== 'false',
        hero_title_en: map.hero_title_en || defaults.hero_title_en,
        hero_title_ar: map.hero_title_ar || defaults.hero_title_ar,
        hero_subtitle_en: map.hero_subtitle_en || defaults.hero_subtitle_en,
        hero_subtitle_ar: map.hero_subtitle_ar || defaults.hero_subtitle_ar,
        hero_placeholder_en: map.hero_placeholder_en || defaults.hero_placeholder_en,
        hero_placeholder_ar: map.hero_placeholder_ar || defaults.hero_placeholder_ar,
        hero_overlay_opacity: parseFloat(map.hero_overlay_opacity) || defaults.hero_overlay_opacity,
        hero_text_align: (map.hero_text_align as HeroConfig['hero_text_align']) || defaults.hero_text_align,
        hero_background_image: map.hero_background_image || '',
      });
    }
    setLoading(false);
  }, []);

  const updateConfig = useCallback(async (key: string, value: string) => {
    await supabase.from('platform_config').upsert(
      { config_key: key, config_value: value, updated_at: new Date().toISOString() } as any,
      { onConflict: 'config_key' }
    );
    await fetchConfig();
  }, [fetchConfig]);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  return { config, loading, updateConfig, refetch: fetchConfig };
}
