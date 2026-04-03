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
    <section className="my-16 md:my-24 relative" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/[0.04] blur-[100px]" />
      </div>

      {/* Header */}
      <div className="text-center mb-10 md:mb-14">
        <span className="inline-block text-[11px] uppercase tracking-[0.2em] text-primary font-semibold mb-3">
          {isAr ? 'المميزات' : 'Why us'}
        </span>
        <h2 className="text-2xl md:text-4xl font-bold text-foreground">
          {isAr ? 'لماذا ' : 'Why '}
          <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
            {isAr ? 'تخيّل' : 'Takhayal'}
          </span>
          {isAr ? '؟' : '?'}
        </h2>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {features.map((f, i) => (
          <div
            key={i}
            className="group relative flex flex-col items-center text-center gap-4 p-6 md:p-8 rounded-[20px] overflow-hidden transition-all duration-500 hover:-translate-y-1"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-[1]"
              style={{ background: 'radial-gradient(circle at 50% 30%, rgba(240,62,27,0.08), transparent 70%)' }}
            />

            {/* Icon */}
            <div
              className="relative w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500"
              style={{
                background: 'linear-gradient(135deg, rgba(240,62,27,0.15), rgba(240,62,27,0.05))',
                border: '1px solid rgba(240,62,27,0.15)',
                boxShadow: '0 4px 20px rgba(240,62,27,0.1)',
              }}
            >
              <f.icon size={24} className="text-primary" />
              {/* Icon glow pulse */}
              <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse opacity-0 group-hover:opacity-50" style={{ animationDuration: '2s' }} />
            </div>

            {/* Text */}
            <p className="text-[14px] md:text-[15px] font-medium text-foreground/85 leading-relaxed">
              {isAr ? f.ar : f.en}
            </p>

            {/* Bottom accent line */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent group-hover:w-3/4 transition-all duration-500" />
          </div>
        ))}
      </div>
    </section>
  );
}
