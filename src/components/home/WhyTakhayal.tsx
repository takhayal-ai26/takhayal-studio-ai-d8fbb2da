import { useLanguage } from '@/i18n/LanguageContext';
import { Layers, Globe, Zap, Clock } from 'lucide-react';

const features = [
  {
    icon: Layers,
    en: 'All top AI models in one place',
    ar: 'جميع أفضل نماذج الذكاء الاصطناعي في مكان واحد',
    descEn: 'Access FLUX, GPT Image, and more — no switching between tools.',
    descAr: 'استخدم FLUX و GPT Image وغيرها بدون التنقل بين الأدوات.',
  },
  {
    icon: Globe,
    en: 'Built for Arabic & GCC creators',
    ar: 'مصمم للمبدعين في الخليج والعالم العربي',
    descEn: 'Native Arabic UI, RTL-first design, localized for the region.',
    descAr: 'واجهة عربية أصلية، تصميم من اليمين لليسار، مخصص للمنطقة.',
  },
  {
    icon: Zap,
    en: 'Faster workflow, no complexity',
    ar: 'تجربة أسرع بدون تعقيد',
    descEn: 'One prompt, one click. No complicated settings or setups.',
    descAr: 'أمر واحد، نقرة واحدة. بدون إعدادات معقدة.',
  },
  {
    icon: Clock,
    en: 'Create content in seconds',
    ar: 'أنشئ المحتوى خلال ثوانٍ',
    descEn: 'Generate stunning visuals in under 10 seconds.',
    descAr: 'أنشئ صورًا مذهلة في أقل من 10 ثوانٍ.',
  },
];

export function WhyTakhayal() {
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section className="my-16 md:my-24 relative" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">
          {isAr ? 'لماذا ' : 'Why '}
          <span className="text-primary">{isAr ? 'تخيّل' : 'Takhayal'}</span>
          {isAr ? '؟' : '?'}
        </h2>
      </div>

      {/* Stacked feature rows */}
      <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 max-w-3xl mx-auto">
        {features.map((f, i) => (
          <div
            key={i}
            className="group flex items-start gap-4 p-5 rounded-2xl transition-all duration-300 hover:bg-card/60"
            style={{ border: '1px solid transparent' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
          >
            {/* Icon */}
            <div
              className="flex-shrink-0 w-12 h-12 rounded-[14px] flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(145deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.05))',
                boxShadow: '0 0 0 1px hsl(var(--primary) / 0.1), 0 4px 12px hsl(var(--primary) / 0.08)',
              }}
            >
              <f.icon size={22} className="text-primary" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h3 className="text-[15px] font-semibold text-foreground leading-snug mb-1">
                {isAr ? f.ar : f.en}
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {isAr ? f.descAr : f.descEn}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
