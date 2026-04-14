import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const ROW_1 = [
  { name: 'Nano Banana 2', slug: 'nano-banana-2' },
  { name: 'Seedream 4.5', slug: 'seedream-4-5' },
  { name: 'Nano Banana Pro', slug: 'nano-banana-pro' },
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
  // 4× duplication for seamless -25% loop
  const quadrupled = [...items, ...items, ...items, ...items];

  // In RTL, flip directions
  const effectiveReverse = isRTL ? !reverse : reverse;

  return (
    <div
      className="marquee-row relative overflow-hidden"
      style={{
        maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
      }}
    >
      <div
        className={`flex w-max ${effectiveReverse ? 'animate-marquee-right' : 'animate-marquee-left'}`}
        style={{ gap: 0 }}
      >
        {quadrupled.map((m, i) => (
          <button
            key={`${m.slug}-${i}`}
            onClick={() => navigate(`/models/${m.slug}`)}
            className="flex-shrink-0 mx-1.5 px-6 py-3 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer
              bg-zinc-900 border border-zinc-800 text-zinc-300
              hover:border-[rgba(240,62,27,0.6)] hover:text-[#F03E1B] hover:bg-[rgba(240,62,27,0.05)] hover:scale-[1.04]
              dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300
              dark:hover:border-[rgba(240,62,27,0.6)] dark:hover:text-[#F03E1B] dark:hover:bg-[rgba(240,62,27,0.05)]
              explore-badge-light"
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
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 60%, rgba(240,62,27,0.04) 100%)' }} />

      <div className="relative text-center px-5 md:px-8 mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground">
          {isAr ? 'استكشف نماذجنا' : 'Explore Our Models'}
        </h2>
        {/* Ember underline accent */}
        <div className="mx-auto mt-2 w-10 h-0.5 rounded-full" style={{ background: '#F03E1B' }} />
        <p className="mt-3 text-sm text-zinc-400 dark:text-zinc-400 explore-subtitle-light">
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
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-[15px] font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #F03E1B 0%, #d4341a 50%, #c42d15 100%)', boxShadow: '0 4px 16px rgba(240,62,27,0.2)' }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 24px rgba(240,62,27,0.35)')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(240,62,27,0.2)')}
        >
          {isAr ? 'تصفح جميع النماذج' : 'Browse All Models'}
          {isRTL ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800/50 dark:border-zinc-800/50 explore-divider-light" />
    </section>
  );
}
