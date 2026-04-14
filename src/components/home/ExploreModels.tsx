import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModelGuides } from '@/hooks/useModelGuides';
import { ArrowRight, Cpu } from 'lucide-react';
import { useRef, useEffect } from 'react';

/* ─── Marquee Row ─── */
function TickerRow({ guides, isAr, reverse }: { guides: any[]; isAr: boolean; reverse?: boolean }) {
  const navigate = useNavigate();
  // Double the items for seamless loop
  const items = [...guides, ...guides];

  return (
    <div className="relative overflow-hidden" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
      <div
        className={`flex gap-3 w-max ${reverse ? 'animate-ticker-reverse' : 'animate-ticker'}`}
      >
        {items.map((guide, i) => {
          const name = isAr ? guide.name_ar || guide.name_en : guide.name_en;
          return (
            <button
              key={`${guide.id}-${i}`}
              onClick={() => navigate(`/models/${guide.slug}`)}
              className="flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-zinc-800/80 border border-zinc-700/40 hover:border-primary/40 hover:scale-105 transition-all duration-200 group"
            >
              {guide.icon_url ? (
                <img src={guide.icon_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center">
                  <Cpu size={14} className="text-zinc-400" />
                </div>
              )}
              <span className="text-[13px] font-semibold text-zinc-200 group-hover:text-white whitespace-nowrap">{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ExploreModels() {
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';
  const { activeGuides, loading } = useModelGuides();

  if (!loading && activeGuides.length === 0) return null;

  if (loading) {
    return (
      <section className="my-12 -mx-5 md:-mx-8 px-0">
        <div className="bg-zinc-950 rounded-3xl py-14 px-5 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="h-9 w-56 bg-zinc-800 animate-pulse rounded-lg mb-2 mx-auto" />
            <div className="h-4 w-72 bg-zinc-800 animate-pulse rounded mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  // Split guides into two rows
  const mid = Math.ceil(activeGuides.length / 2);
  const row1 = activeGuides.slice(0, mid);
  const row2 = activeGuides.slice(mid);

  return (
    <section className="my-12 -mx-5 md:-mx-8 px-0">
      <div
        className="rounded-3xl py-14 px-5 md:px-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #09090b 0%, #0c0c0e 100%)',
        }}
      >
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(240,62,27,0.03), transparent 70%)' }} />

        <div className="relative max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            {isAr ? 'استكشف نماذجنا' : 'Explore Our Models'}
          </h2>
          <p className="text-[14px] text-zinc-400 mb-10">
            {isAr ? 'محركات الذكاء الاصطناعي التي تشغّل إبداعاتك' : 'Powerful AI engines behind your creations'}
          </p>

          {/* Ticker rows */}
          <div className="space-y-3 mb-10">
            <TickerRow guides={row1} isAr={isAr} />
            {row2.length > 0 && <TickerRow guides={row2} isAr={isAr} reverse />}
          </div>

          {/* CTA */}
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
