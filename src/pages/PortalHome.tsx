import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTools } from '@/hooks/useTools';
import { useTemplates } from '@/hooks/useTemplates';
import { DashboardHero } from '@/components/home/DashboardHero';
import { WhyTakhayal } from '@/components/home/WhyTakhayal';
import { FinalCTA } from '@/components/home/FinalCTA';
import { ContinueWhereLeftOff } from '@/components/home/ContinueWhereLeftOff';
import { WelcomeBack } from '@/components/home/WelcomeBack';
import { ExploreModels } from '@/components/home/ExploreModels';
import { QuickActions } from '@/components/home/QuickActions';
import { Footer } from '@/components/layout/Footer';
import { PageSeo } from '@/components/seo/PageSeo';
import { localizePath } from '@/lib/localized-routes';
import heroPoster from '@/assets/landing/hero-video-poster-960.avif';

const TestimonialsCarousel = lazy(() => import('@/components/home/TestimonialsCarousel').then(m => ({ default: m.TestimonialsCarousel })));
const PricingPreview = lazy(() => import('@/components/home/PricingPreview').then(m => ({ default: m.PricingPreview })));

function ratioToNumber(ratio: string): number {
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return 1;
  return w / h;
}

export default function PortalHome() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openAuthModal } = useApp();
  const { t, isRTL, lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === 'ar';
  const { tools: toolsData } = useTools();
  const { templates: dbTemplates, categories: dbCategories } = useTemplates();
  const [activeCategory, setActiveCategory] = useState('All');
  const isLoggedIn = !!user;

  // Fetch real approved community posts
  const { data: communityPosts = [] } = useQuery({
    queryKey: ['community-posts-featured'],
    queryFn: async () => {
      const { data } = await supabase
        .from('community_posts')
        .select('image_url, prompt, ratio')
        .eq('status', 'approved')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(8);
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'login' || authParam === 'signup') {
      openAuthModal(authParam);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, openAuthModal, setSearchParams]);

  const categoryKeys = [
    { key: 'All', label: t.portal.all },
    ...dbCategories.map(c => ({ key: c.name_en, label: c.name })),
  ];

  const go = (path: string) => navigate(localizePath(path, lang));

  const goToTemplateDetail = (tplId: string) => {
    go(`/templates/${tplId}`);
  };

  const featuredTemplates = dbTemplates.filter(tpl => tpl.featured);
  const filteredTemplates = activeCategory === 'All'
    ? featuredTemplates
    : featuredTemplates.filter(tpl => tpl.category === activeCategory);
  const toolOrder = ['generate', 'logo', 'upscale', 'remove-bg', 'restore', 'photo-restoration'];
  const sortedTools = [...toolsData].sort((a, b) => {
    const ai = toolOrder.findIndex(key => a.id === key);
    const bi = toolOrder.findIndex(key => b.id === key);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="flex-1 overflow-y-auto animate-page-enter" data-home-surface>
      <PageSeo
        title={isAr ? 'تخيّل | استوديو ذكاء اصطناعي عربي أولاً' : 'Takhayal.ai | Arabic-first AI creative studio'}
        description={isAr
          ? 'أنشئ صوراً وفيديوهات وقوالب جاهزة للإنتاج بالذكاء الاصطناعي، مع تجربة عربية أولاً مصممة للمبدعين في الخليج.'
          : 'Create production-ready AI images, videos, and templates with an Arabic-first creative studio built for Gulf creators.'}
        canonicalPath="/"
        image="/og-cover.jpg"
        pageType="CollectionPage"
      />

      {/* ── Cinematic Video Hero ── */}
      <DashboardHero />

      <div className="max-w-7xl mx-auto px-5 md:px-8">

        {/* ═══ LOGGED-IN: Product Mode ═══ */}
        {isLoggedIn && (
          <WelcomeBack />
        )}

        {/* ═══ Tools Section (both modes) ═══ */}

          <section className="my-8">
            <div className="rounded-2xl bg-card/40 border border-border/20 overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                <div className="relative flex-shrink-0 lg:w-[300px] p-8 lg:p-10 flex flex-col justify-center">
                  <div className="absolute inset-0 opacity-[0.06]" style={{ background: 'radial-gradient(ellipse at 30% 50%, hsl(var(--primary)), transparent 70%)' }} />
                  <div className="relative">
                    <Sparkles size={18} className="text-primary mb-4 opacity-70" />
                    <h2 className="typo-heading-section font-extrabold text-4xl">
                      {t.portal.whatWillYouCreate}<br />
                      <span className="text-primary font-light">{t.portal.createToday}</span>
                    </h2>
                    <p className="text-[13px] text-muted-foreground mt-4 leading-relaxed max-w-[240px]">{t.portal.toolsIntro}</p>
                    <button onClick={() => go('/tools')} className="mt-6 inline-flex items-center gap-2 h-11 md:h-10 px-5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-110 transition-all group">
                      {t.portal.exploreAllTools}
                      <ArrowRight size={14} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-3 p-4 lg:p-5 min-w-max">
                    {sortedTools.map(tool => (
                      <button key={tool.id} onClick={() => go(tool.route)} className="group relative flex-shrink-0 w-[220px] md:w-[260px] aspect-[3/4] rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-black/20 transition-shadow duration-300">
                        <img src={tool.image} alt={tool.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" width={260} height={347} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                        <div className="absolute inset-0 bg-primary/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <span className="text-white block font-extrabold text-xl">{tool.name}</span>
                          <span className="text-[11px] text-white/50 mt-0.5 block">{tool.shortDesc}</span>
                          <ArrowRight size={13} className={`text-primary mt-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ${isRTL ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                    ))}
                    {/* Generate Video card */}
                    <button onClick={() => go('/video')} className="group relative flex-shrink-0 w-[220px] md:w-[260px] aspect-[3/4] rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-black/20 transition-shadow duration-300">
                      <img src={heroPoster} alt={isAr ? 'إنشاء فيديو' : 'Generate Video'} className="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" width={260} height={347} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute inset-0 bg-primary/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="text-white block font-extrabold text-xl">{isAr ? 'إنشاء فيديو' : 'Generate Video'}</span>
                        <span className="text-[11px] text-white/50 mt-0.5 block">{isAr ? 'أنشئ فيديوهات من نص أو صورة' : 'Generate videos from text or image'}</span>
                        <ArrowRight size={13} className={`text-primary mt-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 ${isRTL ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
        </section>

        {/* ═══ LOGGED-OUT: Why Takhayal ═══ */}
        {!isLoggedIn && <WhyTakhayal />}

        {/* Explore Models moved below templates */}

        {/* ── Templates (both modes) ── */}
        <section className="mb-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="typo-heading-section font-extrabold text-4xl">{t.portal.startFromPowerful}</h2>
              <p className="text-[13px] text-muted-foreground mt-1.5">{t.portal.readyMadePrompts}</p>
            </div>
            <button onClick={() => go('/templates')} className="hidden md:flex items-center gap-1.5 text-[12px] text-primary font-medium hover:underline group">
              {t.portal.exploreAllTemplates} <ArrowRight size={12} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {categoryKeys.map(cat => (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)} className={`filter-pill flex-shrink-0 transition-all duration-300 ${activeCategory === cat.key ? 'active' : ''}`}>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="columns-2 md:columns-3 lg:columns-4 gap-1.5 [column-fill:_balance]">
            {filteredTemplates.map((tpl) => (
              <button key={tpl.id} onClick={() => goToTemplateDetail(tpl.id)} dir={isRTL ? 'rtl' : 'ltr'} className="group w-full rounded-2xl overflow-hidden break-inside-avoid mb-2 block text-start hover:shadow-lg hover:shadow-black/10 transition-shadow duration-300">
                <div className="relative overflow-hidden" style={{ aspectRatio: ratioToNumber(tpl.ratio) }}>
                  <img src={tpl.image} alt={tpl.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <h3 className="absolute bottom-2.5 left-3 right-3 font-semibold text-white leading-tight drop-shadow-md text-lg">{tpl.name}</h3>
                  <div className={`absolute top-2.5 ${isRTL ? 'left-2.5' : 'right-2.5'} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                    <span className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1 shadow-lg">{t.portal.use}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => go('/templates')} className="mt-4 flex md:hidden w-full h-11 items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold">
            {t.portal.exploreAllTemplates}
            <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
          </button>

          <div className="text-center mt-8">
            <p className="text-[13px] text-muted-foreground mb-3">{t.portal.needMoreInspiration}</p>
            <button onClick={() => go('/templates')} className="h-11 md:h-10 px-6 rounded-full border border-border/30 text-foreground text-[13px] font-medium hover:border-primary/40 hover:text-primary transition-all group inline-flex items-center gap-2">
              {t.portal.exploreTemplates}
              <ArrowRight size={14} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </section>

        {/* ═══ Explore Models — between templates and community ═══ */}
        <ExploreModels />

        {/* ═══ LOGGED-OUT: Testimonials ═══ */}
        {!isLoggedIn && (
          <Suspense fallback={null}>
            <TestimonialsCarousel />
          </Suspense>
        )}

        {/* ── Community (both, but optional for logged-in) ── */}
        <section className="mt-6 mb-14">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="typo-heading-section text-4xl">{t.portal.communityWorks}</h2>
                <p className="text-[13px] text-muted-foreground mt-1">{t.portal.seeWhatCreators}</p>
              </div>
              <button onClick={() => go('/community')} className="min-h-11 text-[12px] text-primary font-medium hover:underline flex items-center gap-1 group">
                {t.portal.exploreCommunity} <ArrowRight size={12} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
            {communityPosts.length > 0 ? (
              <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                {communityPosts.map((item, i) => (
                  <button key={i} onClick={() => go('/community')} className="group relative w-full rounded-2xl overflow-hidden break-inside-avoid block hover:shadow-lg hover:shadow-black/10 transition-shadow duration-300">
                    <img src={item.image_url} alt={item.prompt || ''} className="w-full object-cover" loading="lazy" decoding="async" width={400} height={500} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-[11px] text-white/80 line-clamp-1">{item.prompt}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <button onClick={() => go('/community')} className="w-full rounded-2xl border border-dashed border-border/40 bg-card/35 px-6 py-10 text-center hover:border-primary/40 transition-colors">
                <span className="block text-base font-semibold text-foreground">{isAr ? 'اكتشف مجتمع تخيّل' : 'Explore the Takhayal community'}</span>
                <span className="mt-2 block text-sm text-muted-foreground">{isAr ? 'شاهد أعمال المبدعين وشارك إلهامك.' : 'Browse creator work and share your own inspiration.'}</span>
              </button>
            )}
            <div className="text-center mt-8">
              <p className="text-[13px] text-muted-foreground mb-4">{t.portal.exploreMoreCommunity}</p>
              <button onClick={() => go('/community')} className="h-11 md:h-10 px-6 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-110 transition-all group inline-flex items-center gap-2">
                {t.portal.goToCommunity}
                <ArrowRight size={14} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </section>

        {/* ═══ LOGGED-OUT: Pricing Preview ═══ */}
        {!isLoggedIn && (
          <Suspense fallback={null}>
            <PricingPreview />
          </Suspense>
        )}

        {/* ═══ LOGGED-OUT: Final CTA ═══ */}
        {!isLoggedIn && <FinalCTA />}
      </div>

      <Footer />
    </div>
  );
}
