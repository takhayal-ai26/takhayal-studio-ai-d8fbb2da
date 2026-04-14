import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowRight } from 'lucide-react';

/* ─── Static badge data (text-only, no icons) ─── */
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

function TickerRow({ items, reverse }: { items: typeof ROW_1; reverse?: boolean }) {
  const navigate = useNavigate();
  // 3× duplication for seamless loop
  const tripled = [...items, ...items, ...items];

  return (
    <div
      className="relative overflow-hidden"
      style={{ maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
    >
      <div className={`flex gap-3 w-max ${reverse ? 'animate-ticker-reverse' : 'animate-ticker'}`}>
        {tripled.map((m, i) => (
          <button
            key={`${m.slug}-${i}`}
            onClick={() => navigate(`/models/${m.slug}`)}
            className="flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer hover:scale-[1.03] bg-zinc-800/80 border border-zinc-700/40 text-zinc-200 hover:border-[rgba(240,62,27,0.5)] hover:text-white dark:bg-zinc-800/80 dark:border-zinc-700/40 dark:text-zinc-200 dark:hover:border-[rgba(240,62,27,0.5)] dark:hover:text-white light-badge"
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
    <section className="my-12 -mx-5 md:-mx-8 px-0">
      <div
        className="rounded-3xl py-16 relative overflow-hidden bg-zinc-950 dark:bg-zinc-950 explore-models-light"
      >
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(240,62,27,0.06) 0%, transparent 60%)' }} />

        <div className="relative max-w-7xl mx-auto text-center px-5 md:px-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            {isAr ? 'استكشف نماذجنا' : 'Explore Our Models'}
          </h2>
          <p className="text-[14px] text-zinc-400 mb-10">
            {isAr ? 'محركات الذكاء الاصطناعي التي تشغّل إبداعاتك' : 'Powerful AI engines behind your creations'}
          </p>
        </div>

        {/* Ticker rows — no horizontal padding so they bleed edge to edge */}
        <div className="space-y-3 mb-10">
          <TickerRow items={ROW_1} />
          <TickerRow items={ROW_2} reverse />
        </div>

        {/* CTA */}
        <div className="text-center px-5 md:px-8">
          <button
            onClick={() => navigate('/models')}
            className="inline-flex items-center gap-2.5 h-12 px-8 rounded-full text-[15px] font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #F03E1B 0%, #d4341a 50%, #c42d15 100%)' }}
          >
            {isAr ? 'تصفح جميع النماذج' : 'Browse All Models'}
            <ArrowRight size={16} className={isRTL ? 'rotate-180' : ''} />
          </button>
        </div>
      </div>
    </section>
  );
}
