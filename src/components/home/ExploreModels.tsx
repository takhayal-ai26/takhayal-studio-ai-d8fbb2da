import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModelGuides } from '@/hooks/useModelGuides';
import { ArrowRight, ChevronLeft, ChevronRight, Cpu } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

export function ExploreModels() {
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';
  const { featuredGuides, loading } = useModelGuides();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener('scroll', checkScroll, { passive: true });
    return () => el?.removeEventListener('scroll', checkScroll);
  }, [featuredGuides]);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  if (loading || featuredGuides.length === 0) return null;

  return (
    <section className="my-8">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="typo-heading-section font-extrabold text-4xl">
            {isAr ? (
              <>استكشف <span className="border-b-2 border-[#F03E1B]/60">النماذج</span></>
            ) : (
              <>Explore our <span className="border-b-2 border-[#F03E1B]/60">models</span></>
            )}
          </h2>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            {isAr ? 'محركات الذكاء الاصطناعي التي تشغّل إبداعاتك' : 'Powerful AI engines behind your creations'}
          </p>
        </div>
      </div>

      <div className="relative group/carousel">
        {/* Arrows */}
        {canScrollLeft && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-background/90 border border-border/40 shadow-md flex items-center justify-center hover:bg-background transition-colors -ml-2 md:-ml-4"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-background/90 border border-border/40 shadow-md flex items-center justify-center hover:bg-background transition-colors -mr-2 md:-mr-4"
          >
            <ChevronRight size={20} />
          </button>
        )}

        <div
          ref={scrollRef}
          className="overflow-x-auto scrollbar-hide -mx-5 px-5 md:-mx-8 md:px-8"
        >
          <div className="flex gap-4 min-w-max pb-2">
            {featuredGuides.map(guide => {
              const name = isAr ? guide.name_ar : guide.name_en;
              // Dynamic font size: shorter names get larger text
              const nameFontSize = name.length <= 5 ? 'text-[24px]' : name.length <= 12 ? 'text-[20px]' : 'text-[17px]';

              return (
                <button
                  key={guide.id}
                  onClick={() => navigate(`/models/${guide.slug}`)}
                  className="group relative flex-shrink-0 w-[220px] md:w-[260px] rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#F03E1B]/10 transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="aspect-square relative">
                    {guide.main_image_url ? (
                      <img
                        src={guide.main_image_url}
                        alt={name}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#F03E1B]/20 to-[#F03E1B]/5 flex items-center justify-center">
                        <Cpu size={48} className="text-[#F03E1B]/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="absolute inset-0 bg-[#F03E1B]/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-extrabold leading-tight text-[22px] md:text-[26px] drop-shadow-md">
                        {name}
                      </h3>
                      <p className="text-white/60 text-[12px] mt-1 line-clamp-1">
                        {isAr ? guide.title_ar : guide.title_en}
                      </p>
                      <ArrowRight
                        size={14}
                        className={`text-[#F03E1B] mt-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ${isRTL ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
