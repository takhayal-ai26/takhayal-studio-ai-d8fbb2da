import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModelGuides } from '@/hooks/useModelGuides';
import { useApp } from '@/context/AppContext';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { ArrowLeft, ArrowRight, Zap, Star, Target, Gauge, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRef, useState, useEffect } from 'react';

/* ─── Hero ─── */
function ModelDetailHero({ guide, isAr, isRTL, minCredits, onStart }: any) {
  const navigate = useNavigate();
  const tags = (isAr ? guide.tags_ar : guide.tags_en) || [];

  return (
    <section className="relative overflow-hidden">
      {/* Layered radial backgrounds for depth */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(240,62,27,0.06), transparent 60%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 70%, rgba(240,62,27,0.04), transparent 50%)' }} />

      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-4 pb-12 md:pt-6 md:pb-20">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground/70 hover:text-foreground mb-10 transition-colors group"
        >
          {isRTL ? <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" /> : <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />}
          {isAr ? 'الرئيسية' : 'Back'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Text column */}
          <div className={isRTL ? 'order-2 lg:order-1' : ''}>

            {/* Model Name — DOMINANT */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-black tracking-tight leading-[1.05] text-foreground">
              {isAr ? guide.name_ar : guide.name_en}
            </h1>

            {/* Title — secondary headline */}
            <p className="text-lg md:text-xl font-medium text-muted-foreground mt-3 leading-relaxed max-w-lg">
              {isAr ? guide.title_ar || '' : guide.title_en || ''}
            </p>

            {/* Subtitle */}
            {(isAr ? guide.subtitle_ar : guide.subtitle_en) && (
              <p className="text-muted-foreground/70 text-[14px] md:text-[15px] mt-2 leading-relaxed max-w-md">
                {isAr ? guide.subtitle_ar : guide.subtitle_en}
              </p>
            )}

            {/* Tags — below subtitle */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((tag: string, i: number) => (
                  <span key={i} className="text-[11px] font-medium text-[#F03E1B] bg-[#F03E1B]/8 border border-[#F03E1B]/15 rounded-full px-3 py-1">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Credit badge */}
            {minCredits !== null && (
              <div className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-white rounded-full px-4 py-1.5" style={{ background: 'linear-gradient(135deg, #F03E1B, #e8522e)' }}>
                <Zap size={14} fill="currentColor" />
                {minCredits}
              </div>
            )}

            {/* CTA — single gradient button */}
            <div className="mt-8">
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2.5 text-[15px] font-semibold text-white rounded-full px-10 py-3.5 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #F03E1B 0%, #d4341a 50%, #c42d15 100%)' }}
              >
                <Sparkles size={18} />
                {isAr ? 'ابدأ الإبداع' : 'Start Creating'}
              </button>
            </div>
          </div>

          {/* Image column */}
          <div className={`relative ${isRTL ? 'order-1 lg:order-2' : ''}`}>
            <div
              className="rounded-3xl overflow-hidden aspect-square relative"
              style={{
                boxShadow: '0 0 0 1px rgba(240,62,27,0.15), 0 25px 80px -12px rgba(0,0,0,0.2), 0 0 40px rgba(240,62,27,0.08)',
              }}
            >
              {guide.main_image_url ? (
                <img src={guide.main_image_url} alt={isAr ? guide.name_ar : guide.name_en} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted/20 flex items-center justify-center">
                  <Sparkles size={64} className="text-muted-foreground/20" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Quick Info Card ─── */
function QuickInfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/20 p-6 shadow-sm hover:shadow-md hover:border-[#F03E1B]/15 transition-all duration-300 group">
      <div className="p-2.5 rounded-xl bg-[#F03E1B]/8 w-fit mb-3 group-hover:bg-[#F03E1B]/12 transition-colors">
        <Icon size={18} className="text-[#F03E1B]" />
      </div>
      <p className="text-[11px] uppercase text-muted-foreground/50 tracking-wider font-medium">{label}</p>
      <p className="text-[15px] font-semibold mt-1 capitalize text-foreground">{value}</p>
    </div>
  );
}

/* ─── Scrollable Carousel ─── */
function ModelCarousel({ guides, isAr, isRTL, navigate }: any) {
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
  }, [guides]);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  return (
    <div className="relative group/carousel">
      {canScrollLeft && (
        <button onClick={() => scroll(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-background/90 border border-border/40 shadow-md flex items-center justify-center hover:bg-background transition-colors -ml-4">
          <ChevronLeft size={20} />
        </button>
      )}
      {canScrollRight && (
        <button onClick={() => scroll(1)} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-background/90 border border-border/40 shadow-md flex items-center justify-center hover:bg-background transition-colors -mr-4">
          <ChevronRight size={20} />
        </button>
      )}

      <div ref={scrollRef} className="overflow-x-auto scrollbar-hide -mx-5 px-5 md:-mx-8 md:px-8">
        <div className="flex gap-4 min-w-max pb-2">
          {guides.map((g: any) => (
            <button
              key={g.id}
              onClick={() => navigate(`/models/${g.slug}`)}
              className="group relative flex-shrink-0 w-[220px] md:w-[260px] rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-[#F03E1B]/10 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="aspect-square relative">
                {g.main_image_url ? (
                  <img src={g.main_image_url} alt={isAr ? g.name_ar : g.name_en} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F03E1B]/20 to-[#F03E1B]/5" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-[18px] leading-tight">{isAr ? g.name_ar : g.name_en}</h3>
                  <p className="text-white/50 text-[12px] mt-1 line-clamp-1">{isAr ? g.title_ar : g.title_en}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function ModelDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';
  const { activeGuides, loading } = useModelGuides();
  const { setActivePage, setSelectedModelId } = useApp();
  const { tiers, allTiers } = usePricingTiers();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
      </div>
    );
  }

  const guide = activeGuides.find(g => g.slug === slug);
  if (!guide) return <Navigate to="/" replace />;

  const otherGuides = activeGuides.filter(g => g.id !== guide.id);
  const bestForItems = guide.best_for_items || [];
  const bestForIcons = [Zap, Star, Target];

  let minCredits: number | null = null;
  if (guide.linked_model_id) {
    const modelTiers = (allTiers[guide.linked_model_id] || tiers.filter(t => t.model_id === guide.linked_model_id))
      .filter(t => t.is_active && t.is_available);
    if (modelTiers.length > 0) {
      minCredits = Math.min(...modelTiers.map(t => t.credits_charged));
    }
  }

  const handleStartCreating = () => {
    if (guide.linked_model_id) setSelectedModelId(guide.linked_model_id);
    setActivePage('canvas');
    navigate('/studio');
  };

  return (
    <div className="flex-1 overflow-y-auto animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <ModelDetailHero guide={guide} isAr={isAr} isRTL={isRTL} minCredits={minCredits} onStart={handleStartCreating} />

      <div className="max-w-7xl mx-auto px-5 md:px-8">

        {/* Quick Info */}
        <section className="my-14">
          <h2 className="typo-heading-section text-2xl font-bold mb-6">{isAr ? 'معلومات سريعة' : 'Quick Info'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickInfoCard icon={Gauge} label={isAr ? 'السرعة' : 'Speed'} value={guide.speed} />
            <QuickInfoCard icon={Star} label={isAr ? 'الجودة' : 'Quality'} value={guide.quality} />
            <QuickInfoCard icon={Target} label={isAr ? 'الأفضل لـ' : 'Best For'} value={isAr ? guide.best_for_line_ar : guide.best_for_line_en} />
          </div>
        </section>

        {/* About */}
        {(isAr ? guide.short_description_ar : guide.short_description_en) && (
          <section className="my-14">
            <h2 className="typo-heading-section text-2xl font-bold mb-5">{isAr ? 'عن النموذج' : 'About the model'}</h2>
            <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/20 p-7 md:p-8 shadow-sm">
              <p className="text-muted-foreground text-[15px] md:text-[16px] leading-[1.8] max-w-3xl">
                {isAr ? guide.short_description_ar : guide.short_description_en}
              </p>
            </div>
          </section>
        )}

        {/* Comparison */}
        {guide.comparison_enabled && guide.comparison_images.length > 0 && (
          <section className="my-14">
            <h2 className="typo-heading-section text-2xl font-bold mb-6">{isAr ? 'مقارنة النماذج' : 'Compare Models'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {guide.comparison_images.slice(0, 2).map((ci: any, i: number) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-card/60 border border-border/20">
                  <div className="aspect-square">
                    <img src={ci.url} alt={ci.model_name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium">{ci.model_name}</p>
                    {ci.tag && <span className="text-[11px] text-muted-foreground">{ci.tag}</span>}
                  </div>
                </div>
              ))}
              <div className="rounded-2xl overflow-hidden bg-card/60 border-2 border-[#F03E1B]/30 ring-2 ring-[#F03E1B]/10">
                <div className="aspect-square">
                  <img src={guide.main_image_url} alt={isAr ? guide.name_ar : guide.name_en} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <p className="text-sm font-bold text-[#F03E1B]">{isAr ? guide.name_ar : guide.name_en}</p>
                  <span className="text-[11px] text-[#F03E1B]/70">{isAr ? 'الحالي' : 'Current'}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Best For */}
        {bestForItems.length > 0 && (
          <section className="my-14">
            <h2 className="typo-heading-section text-2xl font-bold mb-6">{isAr ? 'الأفضل في' : "What it's best for"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bestForItems.slice(0, 3).map((item: any, i: number) => {
                const Icon = bestForIcons[i % bestForIcons.length];
                return (
                  <div key={i} className="rounded-2xl bg-card/60 border border-border/20 p-6 hover:border-[#F03E1B]/15 transition-all shadow-sm group">
                    <div className="p-2.5 rounded-xl bg-[#F03E1B]/8 w-fit mb-4 group-hover:bg-[#F03E1B]/12 transition-colors">
                      <Icon size={20} className="text-[#F03E1B]" />
                    </div>
                    <h3 className="font-semibold text-[15px]">{isAr ? item.title_ar : item.title_en}</h3>
                    <p className="text-[13px] text-muted-foreground mt-1.5">{isAr ? item.description_ar : item.description_en}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Explore Other Models */}
        {otherGuides.length > 0 && (
          <section className="my-14">
            <h2 className="typo-heading-section text-2xl font-bold mb-6">{isAr ? 'استكشف نماذج أخرى' : 'Explore other models'}</h2>
            <ModelCarousel guides={otherGuides} isAr={isAr} isRTL={isRTL} navigate={navigate} />
          </section>
        )}

        {/* Final CTA */}
        <section className="my-20 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold">
            {isAr ? `جاهز للإبداع باستخدام ${guide.name_ar}؟` : `Ready to create with ${guide.name_en}?`}
          </h2>
          <div className="mt-7">
            <button
              onClick={handleStartCreating}
              className="inline-flex items-center gap-2.5 text-[15px] font-semibold text-white rounded-full px-10 py-3.5 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #F03E1B 0%, #d4341a 50%, #c42d15 100%)' }}
            >
              <Sparkles size={18} />
              {isAr ? 'ابدأ الآن' : 'Start Now'}
            </button>
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
