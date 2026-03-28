import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';

export interface StudioTemplate {
  id: string;
  title: string;
  prompt: string;
  image: string;
  ratio: string;
}

export function useStudioTemplates() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [templates, setTemplates] = useState<StudioTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('templates')
        .select('*')
        .eq('active', true)
        .eq('show_on_studio' as any, true)
        .order('studio_sort_order' as any)
        .limit(3);

      if (data) {
        setTemplates((data as any[]).map(t => ({
          id: t.id,
          title: isAr && t.title_ar ? t.title_ar : t.title_en,
          prompt: t.prompt || '',
          image: t.cover_image_url || `https://picsum.photos/seed/tpl-${t.id}/600/400`,
          ratio: t.ratio || '1:1',
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [lang, isAr]);

  return { templates, loading };
}
