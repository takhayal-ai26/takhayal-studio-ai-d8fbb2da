import { useLanguage } from '@/i18n/LanguageContext';
import { Layers, Globe, Zap, Clock } from 'lucide-react';

const features = [
  {
    icon: Layers,
    en: 'All top AI models in one place',
    ar: 'جميع أفضل نماذج الذكاء الاصطناعي في مكان واحد',
  },
  {
    icon: Globe,
    en: 'Built for Arabic & GCC creators',
    ar: 'مصمم للمبدعين في الخليج والعالم العربي',
  },
  {
    icon: Zap,
    en: 'Faster workflow, no complexity',
    ar: 'تجربة أسرع بدون تعقيد',
  },
  {
    icon: Clock,
    en: 'Create content in seconds',
    ar: 'أنشئ المحتوى خلال ثوانٍ',
  },
];

export function WhyTakhayal() {
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="my-12 md:my-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 className="text-xl md:text-2xl font-semibold text-foreground text-center mb-8">
        {isAr ? 'لماذا تخيّل' : 'Why Takhayal'}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {features.map((f, i) => (
          <div
            key={i}
            className="group flex flex-col items-center text-center gap-3 p-5 md:p-6 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/10 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
              <f.icon size={20} />
            </div>
            <p className="text-[13px] md:text-sm font-medium text-foreground/80 leading-snug">
              {isAr ? f.ar : f.en}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
