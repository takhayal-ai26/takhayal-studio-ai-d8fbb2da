import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModelGuides } from '@/hooks/useModelGuides';
import { useApp } from '@/context/AppContext';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { ArrowRight, ArrowLeft, Zap, Star, Target, Gauge, Sparkles, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/layout/Footer';

function ModelDetailHero({ guide, isAr, isRTL, minCredits, onStart }: any) {
  const navigate = useNavigate();
  const tags = isAr ? guide.tags_ar : guide.tags_en;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.08]" style={{ background: 'radial-gradient(ellipse at 30% 40%, hsl(var(--primary)), transparent 70%)' }} />
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className={isRTL ? 'order-2 lg:order-1' : ''}>
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-6 transition-colors">
              {isRTL ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
              {isAr ? 'رجوع' : 'Back'}
            </button>

            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag: string, i: number) => (
                <span key={i} className="text-[11px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                  {tag}
                </span>
              ))}
            </div>

            {/* Model Name */}
            <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-2">
              {isAr ? guide.name_ar : guide.name_en}
            </p>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              {isAr ? guide.title_ar || guide.name_ar : guide.title_en || guide.name_en}
            </h1>

            {/* Subtitle */}
            <p className="text-muted-foreground text-[15px] mt-3 leading-relaxed max-w-lg">
              {isAr ? guide.subtitle_ar || guide.short_description_ar : guide.subtitle_en || guide.short_description_en}
            </p>

            {/* Credit badge */}
            {minCredits !== null && (
              <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1.5">
                <Coins size={13} />
                {isAr ? `يبدأ من ${minCredits} رصيد` : `From ${minCredits} credits`}
              </div>
            )}

            <div className="flex flex-wrap gap-3 mt-6">
              <Button onClick={onStart} size="lg" className="gap-2 rounded-xl text-[14px] font-semibold px-8">
                <Sparkles size={16} />
                {isAr ? 'ابدأ الإبداع' : 'Start Creating'}
              </Button>
              <Button onClick={onStart} variant="outline" size="lg" className="gap-2 rounded-xl text-[14px] px-6">
                {isAr ? 'افتح في الاستوديو' : 'Open in Studio'}
              </Button>
            </div>
          </div>

          {/* 1:1 Main Image */}
          <div className={`relative ${isRTL ? 'order-1 lg:order-2' : ''}`}>
            <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/20 aspect-square">
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

export default function ModelDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';
  const { activeGuides, loading } = useModelGuides();
  const { setActivePage, setSelectedModelId } = useApp();
  const { tiers } = usePricingTiers();

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

  // Get min credits from linked model pricing tiers
  let minCredits: number | null = null;
  if (guide.linked_model_id && tiers.length > 0) {
    const modelTiers = tiers.filter(t => t.model_id === guide.linked_model_id && t.is_active && t.is_available);
    if (modelTiers.length > 0) {
      minCredits = Math.min(...modelTiers.map(t => t.credits_charged));
    }
  }

  const handleStartCreating = () => {
    if (guide.linked_model_id) {
      setSelectedModelId(guide.linked_model_id);
    }
    setActivePage('canvas');
    navigate('/studio');
  };

  return (
    <div className="flex-1 overflow-y-auto animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <ModelDetailHero guide={guide} isAr={isAr} isRTL={isRTL} minCredits={minCredits} onStart={handleStartCreating} />

      <div className="max-w-7xl mx-auto px-5 md:px-8">
        {/* About the Model */}
        {(isAr ? guide.short_description_ar : guide.short_description_en) && (
          <section className="my-12">
            <h2 className="typo-heading-section text-2xl font-bold mb-4">{isAr ? 'عن النموذج' : 'About the model'}</h2>
            <p className="text-muted-foreground text-[15px] leading-relaxed max-w-3xl">
              {isAr ? guide.short_description_ar : guide.short_description_en}
            </p>
          </section>
        )}

        {/* Quick Info */}
        <section className="my-12">
          <h2 className="typo-heading-section text-2xl font-bold mb-6">{isAr ? 'معلومات سريعة' : 'Quick Info'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-card/40 border border-border/20 p-5">
              <Gauge size={18} className="text-muted-foreground mb-2" />
              <p className="text-[11px] uppercase text-muted-foreground/60 tracking-wider">{isAr ? 'السرعة' : 'Speed'}</p>
              <p className="text-sm font-semibold mt-0.5 capitalize">{guide.speed}</p>
            </div>
            <div className="rounded-2xl bg-card/40 border border-border/20 p-5">
              <Star size={18} className="text-muted-foreground mb-2" />
              <p className="text-[11px] uppercase text-muted-foreground/60 tracking-wider">{isAr ? 'الجودة' : 'Quality'}</p>
              <p className="text-sm font-semibold mt-0.5 capitalize">{guide.quality}</p>
            </div>
            <div className="rounded-2xl bg-card/40 border border-border/20 p-5">
              <Target size={18} className="text-muted-foreground mb-2" />
              <p className="text-[11px] uppercase text-muted-foreground/60 tracking-wider">{isAr ? 'الأفضل لـ' : 'Best For'}</p>
              <p className="text-sm font-semibold mt-0.5">{isAr ? guide.best_for_line_ar : guide.best_for_line_en}</p>
            </div>
          </div>
        </section>

        {/* Comparison */}
        {guide.comparison_enabled && guide.comparison_images.length > 0 && (
          <section className="my-12">
            <h2 className="typo-heading-section text-2xl font-bold mb-6">{isAr ? 'مقارنة النماذج' : 'Compare Models'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {guide.comparison_images.slice(0, 2).map((ci: any, i: number) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-card/40 border border-border/20">
                  <div className="aspect-square">
                    <img src={ci.url} alt={ci.model_name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium">{ci.model_name}</p>
                    {ci.tag && <span className="text-[11px] text-muted-foreground">{ci.tag}</span>}
                  </div>
                </div>
              ))}
              <div className="rounded-2xl overflow-hidden bg-card/40 border-2 border-primary/30 ring-2 ring-primary/10">
                <div className="aspect-square">
                  <img src={guide.main_image_url} alt={isAr ? guide.name_ar : guide.name_en} className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <p className="text-sm font-bold text-primary">{isAr ? guide.name_ar : guide.name_en}</p>
                  <span className="text-[11px] text-primary/70">{isAr ? 'الحالي' : 'Current'}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Best For */}
        {bestForItems.length > 0 && (
          <section className="my-12">
            <h2 className="typo-heading-section text-2xl font-bold mb-6">{isAr ? 'الأفضل في' : "What it's best for"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bestForItems.slice(0, 3).map((item: any, i: number) => {
                const Icon = bestForIcons[i % bestForIcons.length];
                return (
                  <div key={i} className="rounded-2xl bg-card/40 border border-border/20 p-6 hover:border-primary/20 transition-colors">
                    <div className="p-2.5 rounded-xl bg-primary/10 w-fit mb-4">
                      <Icon size={20} className="text-primary" />
                    </div>
                    <h3 className="font-semibold text-[15px]">{isAr ? item.title_ar : item.title_en}</h3>
                    <p className="text-[13px] text-muted-foreground mt-1.5">{isAr ? item.description_ar : item.description_en}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Model Explorer */}
        {otherGuides.length > 0 && (
          <section className="my-12">
            <h2 className="typo-heading-section text-2xl font-bold mb-6">{isAr ? 'استكشف نماذج أخرى' : 'Explore other models'}</h2>
            <div className="overflow-x-auto scrollbar-hide -mx-5 px-5 md:-mx-8 md:px-8">
              <div className="flex gap-4 min-w-max pb-2">
                {otherGuides.map(g => (
                  <button
                    key={g.id}
                    onClick={() => navigate(`/models/${g.slug}`)}
                    className="group relative flex-shrink-0 w-[180px] md:w-[220px] rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-400 hover:scale-[1.02]"
                  >
                    <div className="aspect-square relative">
                      {g.main_image_url ? (
                        <img src={g.main_image_url} alt={isAr ? g.name_ar : g.name_en} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-bold text-sm">{isAr ? g.name_ar : g.name_en}</h3>
                        <p className="text-white/50 text-[11px] mt-0.5 line-clamp-1">{isAr ? g.title_ar : g.title_en}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="my-16 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold">
            {isAr ? `جاهز للإبداع باستخدام ${guide.name_ar}؟` : `Ready to create with ${guide.name_en}?`}
          </h2>
          <Button onClick={handleStartCreating} size="lg" className="mt-6 gap-2 rounded-xl text-[14px] font-semibold px-10">
            <Sparkles size={16} />
            {isAr ? 'ابدأ الآن' : 'Start Now'}
          </Button>
        </section>
      </div>

      <Footer />
    </div>
  );
}
