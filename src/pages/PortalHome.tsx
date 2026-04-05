import { useNavigate, useSearchParams } from 'react-router-dom';
import { TEMPLATE_PROMPTS, useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useTools } from '@/hooks/useTools';
import { useTemplates } from '@/hooks/useTemplates';
import { DashboardHero } from '@/components/home/DashboardHero';
import { WhyTakhayal } from '@/components/home/WhyTakhayal';
import { FinalCTA } from '@/components/home/FinalCTA';
import { ContinueWhereLeftOff } from '@/components/home/ContinueWhereLeftOff';
import { QuickActions } from '@/components/home/QuickActions';
import { Footer } from '@/components/layout/Footer';

const TestimonialsCarousel = lazy(() => import('@/components/home/TestimonialsCarousel').then(m => ({ default: m.TestimonialsCarousel })));
const PricingPreview = lazy(() => import('@/components/home/PricingPreview').then(m => ({ default: m.PricingPreview })));

import imgFashion from '@/assets/portal/feat-fashion.jpg';
import imgCinema from '@/assets/portal/feat-cinema.jpg';
import imgCoffee from '@/assets/portal/feat-coffee.jpg';
import imgPortrait from '@/assets/portal/feat-portrait.jpg';
import imgLogo from '@/assets/portal/feat-logo.jpg';
import imgArchitecture from '@/assets/portal/feat-architecture.jpg';

function ratioToNumber(ratio: string): number {
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return 1;
  return w / h;
}

export default function PortalHome() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setPrompt, setSelectedTemplate, setActivePage, openAuthModal, requireAuth } = useApp();
  const { t, isRTL, lang } = useLanguage();
  const { user } = useAuth();
  const isAr = lang === 'ar';
  const { tools: toolsData } = useTools();
  const { templates: dbTemplates, categories: dbCategories, loading: templatesLoading } = useTemplates();
  const [activeCategory, setActiveCategory] = useState('All');
  const isLoggedIn = !!user;

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

  const goToTemplateDetail = (tplId: string) => {
    navigate(`/templates/${tplId}`);
  };

  const filteredTemplates = activeCategory === 'All'
    ? dbTemplates
    : dbTemplates.filter(tpl => tpl.category === activeCategory);

  return (
    <div className="flex-1 overflow-y-auto animate-page-enter" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>

      {/* ── Hero (both modes, DashboardHero adapts) ── */}
      <DashboardHero />

      <div className="max-w-7xl mx-auto px-5 md:px-8">

        {/* ═══ LOGGED-IN: Product Mode ═══ */}
        {isLoggedIn && (
          <>
            {/* Continue where you left off */}
            <ContinueWhereLeftOff />
          </>
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
                    <button onClick={() => navigate('/tools')} className="mt-6 inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-110 transition-all group">
                      {t.portal.exploreAllTools}
                      <ArrowRight size={14} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-3 p-4 lg:p-5 min-w-max">
                    {toolsData.map(tool => (
                      <button key={tool.id} onClick={() => navigate(tool.route)} className="group relative flex-shrink-0 w-[220px] md:w-[260px] aspect-[3/4] rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-black/20 transition-shadow duration-400">
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
                  </div>
                </div>
              </div>
            </div>
        </section>

        {/* ═══ LOGGED-OUT: Why Takhayal ═══ */}
        {!isLoggedIn && <WhyTakhayal />}

        {/* ── Templates (both modes) ── */}
        <section className="mb-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="typo-heading-section font-extrabold text-4xl">{t.portal.startFromPowerful}</h2>
              <p className="text-[13px] text-muted-foreground mt-1.5">{t.portal.readyMadePrompts}</p>
            </div>
            <button onClick={() => navigate('/templates')} className="hidden md:flex items-center gap-1.5 text-[12px] text-primary font-medium hover:underline group">
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
              <button key={tpl.id} onClick={() => goToTemplateDetail(tpl.id)} className="group w-full rounded-2xl overflow-hidden break-inside-avoid mb-2 block text-left hover:shadow-lg hover:shadow-black/10 transition-shadow duration-300">
                <div className="relative overflow-hidden" style={{ aspectRatio: ratioToNumber(tpl.ratio) }}>
                  <img src={tpl.image} alt={tpl.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <h3 className="absolute bottom-2.5 left-3 right-3 font-semibold text-white leading-tight drop-shadow-md text-lg">{tpl.name}</h3>
                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="h-7 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1 shadow-lg">{t.portal.use}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-[13px] text-muted-foreground mb-3">{t.portal.needMoreInspiration}</p>
            <button onClick={() => navigate('/templates')} className="h-10 px-6 rounded-full border border-border/30 text-foreground text-[13px] font-medium hover:border-primary/40 hover:text-primary transition-all group inline-flex items-center gap-2">
              {t.portal.exploreTemplates}
              <ArrowRight size={14} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </section>

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
            <button onClick={() => navigate('/community')} className="text-[12px] text-primary font-medium hover:underline flex items-center gap-1 group">
              {t.portal.exploreCommunity} <ArrowRight size={12} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
            {[
              { img: imgFashion, promptEn: 'High-end fashion editorial, modern modest style', promptAr: 'تصوير أزياء راقي، أسلوب محتشم عصري' },
              { img: imgCinema, promptEn: 'Luxury perfume bottle, dramatic studio lighting', promptAr: 'زجاجة عطر فاخرة، إضاءة استوديو درامية' },
              { img: imgCoffee, promptEn: 'Artisan coffee flat lay, warm morning light', promptAr: 'عرض قهوة حرفية، ضوء صباحي دافئ' },
              { img: imgPortrait, promptEn: 'Cinematic portrait, volumetric fog, moody tones', promptAr: 'بورتريه سينمائي، ضباب حجمي، ألوان درامية' },
              { img: imgLogo, promptEn: 'Premium 3D logo mockup, golden metallic finish', promptAr: 'نموذج شعار ثلاثي الأبعاد، لمسة معدنية ذهبية' },
              { img: imgArchitecture, promptEn: 'Modern villa exterior, blue sky, lush garden', promptAr: 'واجهة فيلا عصرية، سماء زرقاء، حديقة خضراء' },
            ].map((item, i) => (
              <button key={i} onClick={() => navigate('/community')} className="group relative w-full rounded-2xl overflow-hidden break-inside-avoid block hover:shadow-lg hover:shadow-black/10 transition-shadow duration-300">
                <img src={item.img} alt={isAr ? item.promptAr : item.promptEn} className="w-full object-cover" loading="lazy" decoding="async" width={400} height={500} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-[11px] text-white/80 line-clamp-1">{isAr ? item.promptAr : item.promptEn}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-[13px] text-muted-foreground mb-4">{t.portal.exploreMoreCommunity}</p>
            <button onClick={() => navigate('/community')} className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-110 transition-all group inline-flex items-center gap-2">
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
