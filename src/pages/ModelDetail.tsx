import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModelGuides } from '@/hooks/useModelGuides';
import { useApp } from '@/context/AppContext';
import { useModels } from '@/hooks/useModels';
import { ArrowRight, ArrowLeft, Zap, Star, Target, Gauge, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Footer } from '@/components/layout/Footer';

export default function ModelDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';
  const { activeGuides, loading } = useModelGuides();
  const { setActivePage, setSelectedModel } = useApp();
  const { models } = useModels();

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
  const tags = isAr ? guide.tags_ar : guide.tags_en;
  const bestForItems = guide.best_for_items || [];
  const bestForIcons = [Zap, Star, Target];

  const handleStartCreating = () => {
    if (guide.linked_model_id) {
      const m = models.find(md => md.id === guide.linked_model_id);
      if (m) setSelectedModel(m);
    }
    setActivePage('canvas');
    navigate('/studio');
  };

  return (
    <div className="flex-1 overflow-y-auto animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08]" style={{ background: 'radial-gradient(ellipse at 30% 40%, hsl(var(--primary)), transparent 70%)' }} />
        <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left */}
            <div className={isRTL ? 'order-2 lg:order-1' : ''}>
              <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground mb-6 transition-colors">
                {isRTL ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                {isAr ? 'رجوع' : 'Back'}
              </button>

              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map((tag, i) => (
                  <span key={i} className="text-[11px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-3 py-1">
                    {tag}
                  </span>
                ))}
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                {isAr ? guide.title_ar || guide.name_ar : guide.title_en || guide.name_en}
              </h1>
              <p className="text-muted-foreground text-[15px] mt-4 leading-relaxed max-w-lg">
                {isAr ? guide.subtitle_ar || guide.short_description_ar : guide.subtitle_en || guide.short_description_en}
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                <Button onClick={handleStartCreating} size="lg" className="gap-2 rounded-xl text-[14px] font-semibold px-8">
                  <Sparkles size={16} />
                  {isAr ? 'ابدأ الإبداع' : 'Start Creating'}
                </Button>
                <Button onClick={handleStartCreating} variant="outline" size="lg" className="gap-2 rounded-xl text-[14px] px-6">
                  {isAr ? 'افتح في الاستوديو' : 'Open in Studio'}
                </Button>
              </div>
            </div>

            {/* Right - Main Image */}
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

      <div className="max-w-7xl mx-auto px-5 md:px-8">
        {/* Comparison */}
        {guide.comparison_enabled && guide.comparison_images.length > 0 && (
          <section className="my-12">
            <h2 className="typo-heading-section text-2xl font-bold mb-6">{isAr ? 'مقارنة النماذج' : 'Compare Models'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {guide.comparison_images.slice(0, 2).map((ci, i) => (
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
              {bestForItems.slice(0, 3).map((item, i) => {
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
                    className="group relative flex-shrink-0 w-[200px] md:w-[240px] aspect-[3/4] rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-400 hover:scale-[1.02]"
                  >
                    {g.main_image_url ? (
                      <img src={g.main_image_url} alt={isAr ? g.name_ar : g.name_en} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-base">{isAr ? g.name_ar : g.name_en}</h3>
                      <p className="text-white/50 text-[11px] mt-0.5 line-clamp-1">{isAr ? g.short_description_ar : g.short_description_en}</p>
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
