import { useStudioTemplates } from '@/hooks/useStudioTemplates';
import { useApp, AspectRatio } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export function StudioTemplates() {
  const { templates, loading } = useStudioTemplates();
  const { setPrompt, setSelectedTemplate, setAspectRatio } = useApp();
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';

  const handleUse = (tpl: typeof templates[0]) => {
    setPrompt(tpl.prompt);
    setSelectedTemplate(null);
    const validRatios: AspectRatio[] = ['1:1', '9:16', '16:9', '4:5'];
    if (validRatios.includes(tpl.ratio as AspectRatio)) {
      setAspectRatio(tpl.ratio as AspectRatio);
    }
    toast({ title: isAr ? 'تم تطبيق القالب' : 'Template applied' });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl bg-card/30 border border-border/8 animate-pulse" style={{ height: 180 }} />
        ))}
      </div>
    );
  }

  if (templates.length === 0) return null;

  const ratioToAspect = (r: string) => {
    const [w, h] = r.split(':').map(Number);
    return w && h ? w / h : 1;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 px-5 pt-5 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center">
            <Sparkles size={10} className="text-primary" />
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-[0.12em]">
            {isAr ? 'قوالب مميزة' : 'Featured Templates'}
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
        {templates.map(tpl => {
          const aspect = ratioToAspect(tpl.ratio);
          const cardHeight = aspect >= 1.3 ? 160 : aspect <= 0.7 ? 280 : 200;

          return (
            <button
              key={tpl.id}
              onClick={() => handleUse(tpl)}
              className="group relative w-full rounded-2xl overflow-hidden block transition-all duration-300 hover:shadow-[0_8px_32px_-8px] hover:shadow-primary/15"
            >
              <div style={{ height: cardHeight }} className="relative w-full">
                <img
                  src={tpl.image}
                  alt={tpl.title}
                  className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.05] group-hover:brightness-110"
                  loading="lazy"
                />
                {/* Permanent gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

                {/* Title - always visible */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className={`text-[14px] font-semibold text-foreground leading-snug ${isAr ? 'text-right' : 'text-left'}`}>
                    {tpl.title}
                  </p>
                </div>

                {/* CTA - visible on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-background/30 backdrop-blur-[2px]">
                  <span className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-[12px] font-semibold shadow-xl shadow-primary/25 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                    {isAr ? 'استخدم هذا القالب' : 'Use This Prompt'}
                  </span>
                </div>

                {/* Subtle border */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.06] group-hover:ring-primary/20 transition-all duration-300 pointer-events-none" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
