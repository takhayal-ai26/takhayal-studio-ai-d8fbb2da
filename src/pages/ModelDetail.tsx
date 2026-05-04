import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModelGuides } from '@/hooks/useModelGuides';
import { useApp } from '@/context/AppContext';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { useVideoModels } from '@/hooks/useVideoModels';
import { ArrowLeft, ArrowRight, Zap, Star, Target, Gauge, Sparkles, ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { useRef, useState, useEffect } from 'react';
import { PageSeo, absoluteUrl } from '@/components/seo/PageSeo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toDateOnly } from '@/lib/seo-helpers';

/* ─── Hero ─── */
function ModelDetailHero({ guide, isAr, isRTL, minCredits, onStart }: any) {
  const navigate = useNavigate();
  const tags = (isAr ? guide.tags_ar : guide.tags_en) || [];
  const isVideo = guide.type === 'video';

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 30%, rgba(240,62,27,0.06), transparent 60%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 80% 70%, rgba(240,62,27,0.04), transparent 50%)' }} />

      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-4 pb-12 md:pt-6 md:pb-20">
        <button
          onClick={() => navigate(isVideo ? '/models' : '/')}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground/70 hover:text-foreground mb-10 transition-colors group"
        >
          {isRTL ? <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" /> : <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />}
          {isAr ? 'الرئيسية' : 'Back'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className={isRTL ? 'order-2 lg:order-1' : ''}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-black tracking-tight leading-[1.05] text-foreground">
              {isAr ? guide.name_ar : guide.name_en}
            </h1>
            <p className="text-lg md:text-xl font-medium text-muted-foreground mt-3 leading-relaxed max-w-lg">
              {isAr ? guide.title_ar || '' : guide.title_en || ''}
            </p>
            {(isAr ? guide.subtitle_ar : guide.subtitle_en) && (
              <p className="text-muted-foreground/70 text-[14px] md:text-[15px] mt-2 leading-relaxed max-w-md">
                {isAr ? guide.subtitle_ar : guide.subtitle_en}
              </p>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {tags.map((tag: string, i: number) => (
                  <span key={i} className="text-[11px] font-medium text-primary bg-primary/8 border border-primary/15 rounded-full px-3 py-1">{tag}</span>
                ))}
              </div>
            )}
            {minCredits !== null && (
              <div className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-white rounded-full px-4 py-1.5" style={{ background: 'linear-gradient(135deg, #F03E1B, #e8522e)' }}>
                <Zap size={14} fill="currentColor" />
                {minCredits}
              </div>
            )}
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

          {/* Media column */}
          <div className={`relative ${isRTL ? 'order-1 lg:order-2' : ''}`}>
            <div
              className="rounded-3xl overflow-hidden aspect-square relative"
              style={{ boxShadow: '0 0 0 1px rgba(240,62,27,0.15), 0 25px 80px -12px rgba(0,0,0,0.2), 0 0 40px rgba(240,62,27,0.08)' }}
            >
              {isVideo && guide.video_preview_url ? (
                <video
                  src={guide.video_preview_url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : guide.main_image_url ? (
                <img src={guide.main_image_url} alt={isAr ? guide.name_ar : guide.name_en} className="w-full h-full object-cover" />
              ) : isVideo ? (
                <div className="w-full h-full bg-gradient-to-br from-primary/15 to-zinc-900 flex items-center justify-center">
                  <div className="text-center">
                    <Film size={48} className="text-primary/30 mx-auto mb-3" />
                    <p className="text-zinc-500 font-semibold text-lg">{isAr ? guide.name_ar : guide.name_en}</p>
                  </div>
                </div>
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
    <div className="rounded-2xl bg-card/80 backdrop-blur-sm border border-border/20 p-6 shadow-sm hover:shadow-md hover:border-primary/15 transition-all duration-300 group">
      <div className="p-2.5 rounded-xl bg-primary/8 w-fit mb-3 group-hover:bg-primary/12 transition-colors">
        <Icon size={18} className="text-primary" />
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
              className="group relative flex-shrink-0 w-[220px] md:w-[260px] rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:scale-[1.02]"
            >
              <div className="aspect-square relative">
                {g.main_image_url ? (
                  <img src={g.main_image_url} alt={isAr ? g.name_ar : g.name_en} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
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
  const { models: videoModels } = useVideoModels(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
      </div>
    );
  }

  const guide = activeGuides.find(g => g.slug === slug);
  if (!guide) return <Navigate to="/" replace />;

  const isVideo = guide.type === 'video';
  const otherGuides = activeGuides.filter(g => g.id !== guide.id);
  const bestForItems = guide.best_for_items || [];
  const bestForIcons = [Zap, Star, Target];

  let minCredits: number | null = null;
  if (isVideo) {
    // Find matching video model by slug similarity
    const vm = videoModels.find(v => {
      const vmSlug = v.display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return vmSlug.includes(guide.slug.replace(/-/g, '')) || guide.slug.includes(vmSlug);
    });
    if (vm) {
      const minDuration = Math.min(...(vm.durations.length ? vm.durations : [5]));
      minCredits = minDuration * vm.credit_cost_per_second_no_audio;
    }
  } else if (guide.linked_model_id) {
    const modelTiers = (allTiers[guide.linked_model_id] || tiers.filter(t => t.model_id === guide.linked_model_id))
      .filter(t => t.is_active && t.is_available);
    if (modelTiers.length > 0) {
      minCredits = Math.min(...modelTiers.map(t => t.credits_charged));
    }
  }

  const handleStartCreating = () => {
    if (isVideo) {
      const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const matchedVideo = videoModels.find(model =>
        slugify(model.display_name) === guide.slug ||
        slugify(model.name) === guide.slug ||
        guide.slug.includes(slugify(model.display_name)) ||
        slugify(model.display_name).includes(guide.slug)
      );
      navigate(`/video/generate-video?modelId=${matchedVideo?.id || guide.slug}`);
    } else {
      if (guide.linked_model_id) setSelectedModelId(guide.linked_model_id);
      setActivePage('canvas');
      navigate(guide.linked_model_id ? `/studio?modelId=${guide.linked_model_id}` : '/studio');
    }
  };

  const displayName = isAr ? guide.name_ar : guide.name_en;
  const shortDescription = isAr
    ? guide.short_description_ar || guide.short_description_en || guide.title_ar
    : guide.short_description_en || guide.short_description_ar || guide.title_en;
  const bestForLine = isAr ? guide.best_for_line_ar : guide.best_for_line_en;
  const dateModified = toDateOnly(guide.updated_at);
  const updatedLabel = dateModified
    ? new Intl.DateTimeFormat(isAr ? 'ar-KW' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(dateModified))
    : null;
  const seoTitle = `${displayName} | Takhayal.ai`;
  const seoDescription = shortDescription
    ? `${shortDescription} ${isAr ? `الأفضل لـ ${bestForLine}.` : `Best for ${bestForLine}.`}`
    : `${displayName} | Takhayal.ai`;
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: isAr ? `ما هو نموذج ${displayName}؟` : `What is ${displayName}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: shortDescription || seoDescription,
        },
      },
      {
        '@type': 'Question',
        name: isAr ? 'ما أفضل استخدام لهذا النموذج؟' : 'What is this model best for?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: bestForLine || (isAr ? 'مهام إبداعية متنوعة داخل تخيّل.' : 'A range of creative tasks inside Takhayal.'),
        },
      },
      {
        '@type': 'Question',
        name: isAr ? 'كيف أبدأ باستخدامه؟' : 'How do I start with it?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: isVideo
            ? (isAr ? 'ابدأ من صفحة الفيديو ثم اختر النموذج المناسب ومدة التوليد.' : 'Start from the video page, then choose the model and generation duration.')
            : (isAr ? 'ابدأ من الاستوديو، ثم اختر النموذج وابدأ التوليد أو التعديل حسب المهمة.' : 'Start from the studio, choose the model, then generate or edit based on your workflow.'),
        },
      },
    ],
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: isAr ? 'النماذج' : 'Models',
        item: absoluteUrl('/models'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: displayName,
        item: absoluteUrl(`/models/${guide.slug}`),
      },
    ],
  };
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: displayName,
    description: seoDescription,
    url: absoluteUrl(`/models/${guide.slug}`),
    image: guide.main_image_url || guide.video_preview_url,
    applicationCategory: isVideo ? 'VideoApplication' : 'GraphicsApplication',
    operatingSystem: 'Web',
    inLanguage: isAr ? 'ar' : 'en',
    ...(dateModified ? { dateModified } : {}),
  };
  const faqs = [
    {
      q: isAr ? `ما الذي يميز ${displayName}؟` : `What makes ${displayName} different?`,
      a: seoDescription,
    },
    {
      q: isAr ? 'متى أختار هذا النموذج؟' : 'When should I choose this model?',
      a: isAr
        ? `اختره عندما يكون هدفك الأساسي هو ${bestForLine || 'الحصول على نتيجة إبداعية مناسبة'}.`
        : `Choose it when your main goal is ${bestForLine || 'getting the right creative output'}.`,
    },
    {
      q: isAr ? 'هل هو مناسب للمقارنة مع نماذج أخرى؟' : 'Is it suitable for side-by-side comparison?',
      a: isAr
        ? 'نعم. صفحة النموذج تعرض السرعة والجودة وأفضل استخدام، وبعض النماذج تتضمن مقارنات بصرية مباشرة.'
        : 'Yes. The page shows speed, quality, and best-for guidance, and some models include direct visual comparisons.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <PageSeo
        title={seoTitle}
        description={seoDescription}
        canonicalPath={`/models/${guide.slug}`}
        image={guide.main_image_url || guide.video_preview_url || undefined}
        pageType="WebPage"
        dateModified={dateModified}
        schemas={[breadcrumbSchema, softwareSchema, faqSchema]}
      />
      <ModelDetailHero guide={guide} isAr={isAr} isRTL={isRTL} minCredits={minCredits} onStart={handleStartCreating} />

      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <section className="my-14">
          <h2 className="typo-heading-section text-2xl font-bold mb-6">{isAr ? 'معلومات سريعة' : 'Quick Info'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <QuickInfoCard icon={Gauge} label={isAr ? 'السرعة' : 'Speed'} value={guide.speed} />
            <QuickInfoCard icon={Star} label={isAr ? 'الجودة' : 'Quality'} value={guide.quality} />
            <QuickInfoCard icon={Target} label={isAr ? 'الأفضل لـ' : 'Best For'} value={isAr ? guide.best_for_line_ar : guide.best_for_line_en} />
          </div>
          {updatedLabel && (
            <p className="text-[12px] text-muted-foreground mt-4">
              {isAr ? `آخر تحديث: ${updatedLabel}` : `Last updated: ${updatedLabel}`}
            </p>
          )}
        </section>

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
              <div className="rounded-2xl overflow-hidden bg-card/60 border-2 border-primary/30 ring-2 ring-primary/10">
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

        {bestForItems.length > 0 && (
          <section className="my-14">
            <h2 className="typo-heading-section text-2xl font-bold mb-6">{isAr ? 'الأفضل في' : "What it's best for"}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bestForItems.slice(0, 3).map((item: any, i: number) => {
                const Icon = bestForIcons[i % bestForIcons.length];
                return (
                  <div key={i} className="rounded-2xl bg-card/60 border border-border/20 p-6 hover:border-primary/15 transition-all shadow-sm group">
                    <div className="p-2.5 rounded-xl bg-primary/8 w-fit mb-4 group-hover:bg-primary/12 transition-colors">
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

        <section className="my-14">
          <h2 className="typo-heading-section text-2xl font-bold mb-5">{isAr ? 'أسئلة شائعة' : 'Frequently asked questions'}</h2>
          <div className="rounded-2xl bg-card/60 backdrop-blur-sm border border-border/20 p-4 md:p-6 shadow-sm">
            <Accordion type="single" collapsible>
              {faqs.map((item, index) => (
                <AccordionItem key={item.q} value={`faq-${index}`}>
                  <AccordionTrigger className="text-start font-medium">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-7">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {otherGuides.length > 0 && (
          <section className="my-14">
            <h2 className="typo-heading-section text-2xl font-bold mb-6">{isAr ? 'استكشف نماذج أخرى' : 'Explore other models'}</h2>
            <ModelCarousel guides={otherGuides} isAr={isAr} isRTL={isRTL} navigate={navigate} />
          </section>
        )}

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
