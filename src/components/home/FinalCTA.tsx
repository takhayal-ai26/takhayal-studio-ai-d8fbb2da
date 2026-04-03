import { useLanguage } from '@/i18n/LanguageContext';
import { useApp } from '@/context/AppContext';
import { Sparkles } from 'lucide-react';

export function FinalCTA() {
  const { lang, isRTL } = useLanguage();
  const { openAuthModal } = useApp();
  const isAr = lang === 'ar';

  return (
    <section className="my-16 md:my-24 text-center px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="relative max-w-xl mx-auto">
        {/* Subtle glow */}
        <div className="absolute inset-0 rounded-3xl bg-primary/5 blur-3xl -z-10" />

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          {isAr ? 'ابدأ الإنشاء خلال ثوانٍ' : 'Start creating in seconds'}
        </h2>
        <p className="text-[14px] text-muted-foreground mb-8">
          {isAr ? 'جرّب مجانًا بدون تعقيد' : 'Try it free — no setup needed'}
        </p>
        <button
          onClick={() => openAuthModal('signup')}
          className="inline-flex items-center gap-2 h-12 px-8 rounded-full bg-primary text-primary-foreground text-[15px] font-semibold hover:brightness-110 hover:scale-[1.02] transition-all duration-200 shadow-lg shadow-primary/20"
        >
          <Sparkles size={16} />
          {isAr ? 'جرّب مجانًا' : 'Try Free'}
        </button>
      </div>
    </section>
  );
}
