import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const ROW_1 = [
  { name: 'Nano Banana Pro', slug: 'nano-banana-pro' },
  { name: 'Seedream 4.5', slug: 'seedream-4-5' },
  { name: 'Nano Banana 2', slug: 'nano-banana-2' },
  { name: 'Ideogram V3', slug: 'ideogram-v3' },
  { name: 'FLUX 1.1 Pro', slug: 'flux-1-1-pro' },
  { name: 'GPT Image 1.5', slug: 'gpt-image-1-5' },
  { name: 'Imagen 4', slug: 'imagen-4' },
  { name: 'Qwen Image', slug: 'qwen-image' },
];

const ROW_2 = [
  { name: 'Kling v2.6 Pro', slug: 'kling-v2-6-pro' },
  { name: 'Seedance 1.5 Pro', slug: 'seedance-1-5-pro' },
  { name: 'Wan 2.6', slug: 'wan-2-6' },
  { name: 'Hailuo 2.3', slug: 'hailuo-2-3' },
  { name: 'Veo 3.1', slug: 'veo-3-1' },
  { name: 'Grok Imagine', slug: 'grok-imagine' },
  { name: 'Seedream 5.0 Lite', slug: 'seedream-5-0-lite' },
  { name: 'Kling v3.0 Pro', slug: 'kling-v3-pro' },
];

function TickerRow({ items, reverse, isRTL }: { items: typeof ROW_1; reverse?: boolean; isRTL?: boolean }) {
  const navigate = useNavigate();
  const sextupled = [...items, ...items, ...items, ...items, ...items, ...items];

  const effectiveReverse = isRTL ? !reverse : reverse;

  return (
    <div className="marquee-row ticker-wrapper relative overflow-hidden">
      <div className={`ticker-track ${effectiveReverse ? 'ticker-right' : 'ticker-left'}`}>
        {sextupled.map((m, i) => (
          <button
            key={`${m.slug}-${i}`}
            onClick={() => navigate(`/models/${m.slug}`)}
            className="flex min-h-11 flex-shrink-0 items-center mx-1.5 px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer
              bg-card border border-border/60 text-muted-foreground
              hover:border-primary/60 hover:text-primary hover:bg-primary/5 hover:scale-[1.04]"
          >
            {m.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ExploreModels() {
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <section
      className="relative w-full pt-20 pb-16 explore-section-bg"
      style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)', width: '100vw' }}
    >
      {/* Subtle ember gradient at bottom */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 60%, hsl(var(--primary) / 0.04) 100%)' }} />

      <div className="relative text-center px-5 md:px-8 mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground">
          {isAr ? 'استكشف نماذجنا' : 'Explore Our Models'}
        </h2>
        {/* Ember underline accent */}
        <div className="mx-auto mt-2 w-10 h-0.5 rounded-full bg-primary" />
        <p className="mt-3 text-sm text-muted-foreground">
          {isAr ? 'محركات الذكاء الاصطناعي التي تشغّل إبداعاتك' : 'Powerful AI engines behind your creations'}
        </p>
      </div>

      {/* Ticker rows — zero gap */}
      <div className="flex flex-col gap-4 w-full">
        <TickerRow items={ROW_1} isRTL={isRTL} />
        <TickerRow items={ROW_2} reverse isRTL={isRTL} />
      </div>

      {/* CTA */}
      <div className="relative text-center mt-12 px-5 md:px-8">
        <button
          onClick={() => navigate('/models')}
          className="inline-flex min-h-11 items-center gap-2.5 px-8 py-3.5 rounded-full text-[15px] font-semibold bg-primary text-primary-foreground transition-all duration-200 hover:brightness-110 hover:shadow-[0_8px_24px_hsl(var(--primary)/0.35)] shadow-[0_4px_16px_hsl(var(--primary)/0.2)] active:scale-[0.98]"
        >
          {isAr ? 'تصفح جميع النماذج' : 'Browse All Models'}
          {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border/40" />
    </section>
  );
}
