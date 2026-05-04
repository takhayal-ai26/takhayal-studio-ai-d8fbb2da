import { useLanguage } from '@/i18n/LanguageContext';
import { Layers, Globe, Zap, Clock } from 'lucide-react';

const features = [
  { icon: Layers, key: 'whyArabicFirst' },
  { icon: Globe, key: 'whyMENA' },
  { icon: Zap, key: 'whyCommercial' },
  { icon: Clock, key: 'whyNoSkills' },
] as const;

export function WhyTakhayal() {
  const { isRTL, t } = useLanguage();

  return (
    <section className="my-16 md:my-24 relative" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="text-center mb-12 md:mb-16">
        <h2 className="typo-heading-section">
          {t.landing.whyTakhayalTitle}
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
              <h3 className="text-[15px] font-semibold text-foreground leading-snug">
                {t.landing[f.key]}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
