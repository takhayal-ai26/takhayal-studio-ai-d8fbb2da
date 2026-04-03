import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';

export interface FrontendTemplate {
  id: string;
  name: string;
  prompt: string;
  prompt_en: string;
  image: string;
  category: string;
  ratio: string;
  featured: boolean;
  default_model_id: string | null;
}

export interface TemplateCategory {
  id: string;
  name: string;
  name_en: string;
  sort_order: number;
}

export function useTemplates() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [templates, setTemplates] = useState<FrontendTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [tplRes, catRes] = await Promise.all([
        supabase.from('templates').select('*').eq('active', true).order('sort_order'),
        supabase.from('template_categories').select('*').eq('active', true).order('sort_order'),
      ]);

      if (tplRes.data) {
        setTemplates((tplRes.data as any[]).map(t => ({
          id: t.id,
          name: isAr && t.title_ar ? t.title_ar : t.title_en,
          prompt: isAr && t.prompt_ar ? t.prompt_ar : (t.prompt || ''),
          prompt_en: t.prompt || '',
          image: t.cover_image_url || `https://picsum.photos/seed/tpl-${t.id}/600/400`,
          category: t.category,
          ratio: t.ratio || '1:1',
          featured: t.featured,
          default_model_id: t.default_model_id || null,
        })));
      }

      if (catRes.data) {
        setCategories((catRes.data as any[]).map(c => ({
          id: c.id,
          name: isAr && c.name_ar ? c.name_ar : c.name_en,
          name_en: c.name_en,
          sort_order: c.sort_order,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [lang, isAr]);

  const categoryNames = ['All', ...categories.map(c => c.name)];

  return { templates, categories, categoryNames, loading };
}
