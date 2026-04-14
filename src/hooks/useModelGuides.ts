import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ModelGuide {
  id: string;
  slug: string;
  type: string;
  active: boolean;
  featured: boolean;
  name_en: string;
  name_ar: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  short_description_en: string;
  short_description_ar: string;
  tags_en: string[];
  tags_ar: string[];
  main_image_url: string;
  icon_url: string;
  video_preview_url: string;
  comparison_enabled: boolean;
  comparison_images: { url: string; model_name: string; tag: string }[];
  comparison_model_ids: string[];
  best_for_items: { title_en: string; title_ar: string; description_en: string; description_ar: string }[];
  speed: string;
  quality: string;
  best_for_line_en: string;
  best_for_line_ar: string;
  linked_model_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function parse(row: any): ModelGuide {
  return {
    ...row,
    type: row.type || 'image',
    icon_url: row.icon_url || '',
    video_preview_url: row.video_preview_url || '',
    tags_en: Array.isArray(row.tags_en) ? row.tags_en : [],
    tags_ar: Array.isArray(row.tags_ar) ? row.tags_ar : [],
    comparison_images: Array.isArray(row.comparison_images) ? row.comparison_images : [],
    comparison_model_ids: Array.isArray(row.comparison_model_ids) ? row.comparison_model_ids : [],
    best_for_items: Array.isArray(row.best_for_items) ? row.best_for_items : [],
  };
}

export function useModelGuides() {
  const [guides, setGuides] = useState<ModelGuide[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('model_guides' as any)
      .select('*')
      .order('sort_order')
      .order('created_at', { ascending: false });
    if (error) { console.error('model_guides fetch:', error); return; }
    setGuides((data || []).map(parse));
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const activeGuides = guides.filter(g => g.active);
  const featuredGuides = guides.filter(g => g.active && g.featured);
  const imageGuides = activeGuides.filter(g => g.type === 'image');
  const videoGuides = activeGuides.filter(g => g.type === 'video');

  const upsert = useCallback(async (guide: Partial<ModelGuide> & { id?: string }) => {
    if (guide.id) {
      const { error } = await supabase.from('model_guides' as any).update(guide as any).eq('id', guide.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('model_guides' as any).insert(guide as any);
      if (error) throw error;
    }
    await fetch();
  }, [fetch]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase.from('model_guides' as any).delete().eq('id', id);
    if (error) throw error;
    await fetch();
  }, [fetch]);

  return { guides, activeGuides, featuredGuides, imageGuides, videoGuides, loading, refetch: fetch, upsert, remove };
}
