import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { StudioGenerationFeed } from './StudioGenerationFeed';
import { supabase } from '@/integrations/supabase/client';

interface StudioTemplate {
  id: string;
  title_en: string;
  title_ar: string;
  prompt: string;
  prompt_ar: string;
  cover_image_url: string;
  ratio: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function InspirationFeed() {
  const { setPrompt, setSelectedTemplate } = useApp();
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const [templates, setTemplates] = useState<StudioTemplate[]>([]);

  useEffect(() => {
    supabase
      .from('templates')
      .select('id, title_en, title_ar, prompt, prompt_ar, cover_image_url, ratio')
      .eq('active', true)
      .eq('show_on_studio', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTemplates(shuffle(data).slice(0, 3));
        }
      });
  }, []);

  const handleUse = (tpl: StudioTemplate) => {
    const promptText = isAr && tpl.prompt_ar ? tpl.prompt_ar : tpl.prompt;
    setPrompt(promptText);
    setSelectedTemplate(null);
  };

  return (
    <div className="w-full md:flex-1 flex flex-col overflow-visible md:overflow-hidden">
      <div className="flex-shrink-0 px-5 pt-5 pb-3">
        <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.15em]">
          {t.studio.exploreIdeas}
        </p>
      </div>

      <StudioGenerationFeed />

      {templates.length > 0 && (
        <div className="flex-shrink-0 flex items-stretch gap-3 px-5 pb-5 min-h-[220px] max-h-[320px]">
          {templates.map((tpl) => {
            const title = isAr ? (tpl.title_ar || tpl.title_en) : tpl.title_en;
            return (
              <div
                key={tpl.id}
                className="group relative flex-1 rounded-xl overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
                onClick={() => handleUse(tpl)}
              >
                <div className="relative w-full h-full" style={{ aspectRatio: '9/16' }}>
                  <img
                    src={tpl.cover_image_url}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:brightness-110"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col gap-3">
                    <h3 className="text-white text-lg font-semibold leading-snug drop-shadow-lg">
                      {title}
                    </h3>
                    <button
                      className="self-start px-4 py-2 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20 text-white text-sm font-medium transition-all duration-300 hover:bg-white/25"
                    >
                      {isAr ? 'استخدم هذا' : 'Use This Prompt'}
                    </button>
                  </div>
                </div>

                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/[0.06] group-hover:ring-white/15 transition-all duration-300 pointer-events-none" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
