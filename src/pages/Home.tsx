import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Sparkles, Wand2, ArrowRight, Zap, Globe, Layers, ImageIcon, Maximize, Eraser, PenTool, Star } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { Logo } from '@/components/Logo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useState, useEffect, useRef } from 'react';
import { useMedia } from '@/hooks/useMedia';
import { HeroPromptComposer } from '@/components/home/HeroPromptComposer';

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, openAuthModal } = useApp();
  const { t, isRTL } = useLanguage();
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const { getUrlByName } = useMedia();

  // Handle ?auth=login or ?auth=signup query param
  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'login' || authParam === 'signup') {
      openAuthModal(authParam);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, openAuthModal, setSearchParams]);

  const categories = [
    { title: t.landing.catProductAds, image: getUrlByName('category-product.jpg') },
    { title: t.landing.catSocialMedia, image: getUrlByName('category-social.jpg') },
    { title: t.landing.catLogos, image: getUrlByName('category-logos.jpg') },
    { title: t.landing.catPosters, image: getUrlByName('category-posters.jpg') },
    { title: t.landing.catFashion, image: getUrlByName('category-fashion.jpg') },
    { title: t.landing.catFoodRestaurant, image: getUrlByName('category-food.jpg') },
  ];
  const beforeAfter = getUrlByName('before-after.jpg');

  const steps = [
    { icon: PenTool, title: t.landing.step1Title, desc: t.landing.step1Desc },
    { icon: Wand2, title: t.landing.step2Title, desc: t.landing.step2Desc },
    { icon: Zap, title: t.landing.step3Title, desc: t.landing.step3Desc },
  ];

  const tools = [
    { icon: ImageIcon, title: t.landing.generateImage, desc: t.landing.generateImageDesc, route: '/tools/generate' },
    { icon: Maximize, title: t.landing.upscaleImage, desc: t.landing.upscaleImageDesc, route: '/tools/upscale' },
    { icon: Eraser, title: t.landing.removeBackground, desc: t.landing.removeBackgroundDesc, route: '/tools/remove-bg' },
    { icon: PenTool, title: t.landing.createLogo, desc: t.landing.createLogoDesc, route: '/tools/logo' },
    { icon: Star, title: t.landing.enhanceImage, desc: t.landing.enhanceImageDesc, route: '/tools/enhance' },
  ];

  const whyCards = [
    { icon: Globe, title: t.landing.whyArabicFirst, desc: t.landing.whyArabicFirstDesc },
    { icon: Layers, title: t.landing.whyMENA, desc: t.landing.whyMENADesc },
    { icon: Sparkles, title: t.landing.whyCommercial, desc: t.landing.whyCommercialDesc },
    { icon: Zap, title: t.landing.whyNoSkills, desc: t.landing.whyNoSkillsDesc },
  ];

  const handleStartCreating = () => navigate('/home');

  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current || !dragging.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Floating top bar */}
      <header className="absolute top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-6 md:px-10">
        <Logo size="small" />
        <div className="flex items-center gap-3">
          <LanguageToggle />
          {isAuthenticated ? (
            <button onClick={() => navigate('/home')} className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-90 transition-all">
              {t.landing.goToStudio}
            </button>
          ) : (
            <>
              <button onClick={() => openAuthModal('login')} className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-2">{t.nav.login}</button>
              <button onClick={() => openAuthModal('signup')} className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-[13px] font-medium hover:brightness-90 transition-all">{t.nav.signup}</button>
            </>
          )}
        </div>
      </header>

      {/* ━━━ HERO WITH PROMPT COMPOSER ━━━ */}
      <HeroPromptComposer />

      {/* ━━━ CREATE ANYTHING ━━━ */}
      <section id="create-anything" className="px-6 md:px-12 pb-32 md:pb-40">
        <Section>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-[11px] font-medium text-primary uppercase tracking-[0.2em] mb-4 block">{t.landing.createAnythingLabel}</span>
              <h2 className="text-3xl md:text-5xl font-light text-foreground">{t.landing.createAnythingTitle}</h2>
              <p className="text-muted-foreground mt-4 text-base max-w-md mx-auto">{t.landing.createAnythingSubtitle}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {categories.map((cat, i) => (
                <button key={cat.title} onClick={() => navigate('/studio')} className="group relative aspect-[3/4] rounded-2xl overflow-hidden" style={{ animationDelay: `${i * 80}ms` }}>
                  <img src={cat.image} alt={cat.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.08]" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-primary/[0.1]" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                    <span className="text-sm md:text-lg font-medium text-foreground">{cat.title}</span>
                    <ArrowRight size={14} className={`text-foreground/0 group-hover:text-foreground/60 transition-all duration-300 mt-2 ${isRTL ? 'rotate-180' : ''} group-hover:translate-x-1`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Section>
      </section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <section className="relative px-6 md:px-12 pb-32 md:pb-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-muted/40 to-transparent" />
        <Section>
          <div className="max-w-5xl mx-auto pt-8">
            <div className="text-center mb-16">
              <span className="text-[11px] font-medium text-primary uppercase tracking-[0.2em] mb-4 block">{t.landing.howItWorksLabel}</span>
              <h2 className="text-3xl md:text-5xl font-light text-foreground">{t.landing.howItWorksTitle}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
              {steps.map((step, i) => (
                <div key={step.title} className="relative text-center group">
                  {i < steps.length - 1 && (
                    <div className={`hidden md:block absolute top-12 ${isRTL ? 'right-[60%]' : 'left-[60%]'} w-[80%] h-px bg-gradient-to-${isRTL ? 'l' : 'r'} from-muted/40 to-transparent`} />
                  )}
                  <div className="relative mx-auto w-24 h-24 rounded-2xl bg-card/80 border border-muted/60 flex items-center justify-center mb-6 group-hover:border-primary/40 group-hover:shadow-[0_0_30px_rgba(245,81,48,0.08)] transition-all duration-500">
                    <div className="absolute inset-0 rounded-2xl bg-primary/[0.06] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <step.icon size={28} className="text-primary relative" strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-semibold text-primary/70 uppercase tracking-[0.15em] mb-3 block">{t.landing.step} {i + 1}</span>
                  <h3 className="text-lg font-medium text-foreground mb-2">{step.title}</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[220px] mx-auto">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </section>

      {/* ━━━ BEFORE / AFTER ━━━ */}
      <section className="px-6 md:px-12 pb-28 md:pb-36">
        <Section>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-light text-foreground">{t.landing.seeTransformation}</h2>
              <p className="text-muted-foreground mt-3 text-base">{t.landing.dragToCompare}</p>
            </div>
            <div
              ref={sliderRef}
              className="relative aspect-[2/1] rounded-2xl overflow-hidden cursor-col-resize select-none border border-muted"
              onMouseDown={() => { dragging.current = true; }}
              onMouseUp={() => { dragging.current = false; }}
              onMouseLeave={() => { dragging.current = false; }}
              onMouseMove={(e) => handleSliderMove(e.clientX)}
              onTouchStart={() => { dragging.current = true; }}
              onTouchEnd={() => { dragging.current = false; }}
              onTouchMove={(e) => handleSliderMove(e.touches[0].clientX)}
            >
              <img src={beforeAfter} alt="After enhancement" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
                <img src={beforeAfter} alt="Before enhancement" className="absolute inset-0 w-full h-full object-cover blur-sm brightness-75" style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }} loading="lazy" />
                <div className="absolute inset-0 bg-black/20" />
              </div>
              <div className="absolute top-0 bottom-0" style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}>
                <div className="w-px h-full bg-foreground/80" />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-foreground/90 flex items-center justify-center shadow-lg">
                  <ArrowRight size={14} className="text-background rotate-180 -ml-0.5" />
                  <ArrowRight size={14} className="text-background -ml-1" />
                </div>
              </div>
              <span className={`absolute top-4 ${isRTL ? 'right-4' : 'left-4'} text-[11px] font-medium text-foreground/70 uppercase tracking-wider bg-black/40 px-3 py-1 rounded-full`}>{t.landing.before}</span>
              <span className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} text-[11px] font-medium text-foreground/70 uppercase tracking-wider bg-black/40 px-3 py-1 rounded-full`}>{t.landing.after}</span>
            </div>
          </div>
        </Section>
      </section>

      {/* ━━━ TOOLS ━━━ */}
      <section className="relative px-6 md:px-12 pb-32 md:pb-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-muted/40 to-transparent" />
        <Section>
          <div className="max-w-6xl mx-auto pt-8">
            <div className="flex items-end justify-between mb-14">
              <div>
                <span className="text-[11px] font-medium text-primary uppercase tracking-[0.2em] mb-4 block">{t.landing.aiToolsLabel}</span>
                <h2 className="text-3xl md:text-5xl font-light text-foreground">{t.landing.aiToolsTitle}</h2>
                <p className="text-muted-foreground mt-3 text-base">{t.landing.aiToolsSubtitle}</p>
              </div>
              <button onClick={() => navigate('/tools')} className="hidden md:flex items-center gap-2 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors group">
                {t.landing.seeAllTools} <ArrowRight size={14} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory -mx-6 px-6 md:-mx-0 md:px-0">
              {tools.map((tool) => (
                <button key={tool.title} onClick={() => navigate(tool.route)} className={`group relative flex-shrink-0 w-[260px] md:w-[280px] bg-card/50 border border-muted/50 rounded-2xl p-6 ${isRTL ? 'text-right' : 'text-left'} hover:border-primary/30 hover:bg-card/80 transition-all duration-500 snap-start`}>
                  <div className="absolute inset-0 rounded-2xl bg-primary/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-primary/[0.12] border border-primary/15 flex items-center justify-center mb-14 group-hover:bg-primary/[0.18] group-hover:shadow-[0_0_20px_rgba(245,81,48,0.1)] transition-all duration-500">
                      <tool.icon size={20} className="text-primary" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[15px] font-medium text-foreground mb-1.5">{tool.title}</h3>
                    <p className="text-[13px] text-muted-foreground mb-5">{tool.desc}</p>
                    <div className="flex items-center gap-1.5 text-[12px] text-primary/70 group-hover:text-primary transition-colors">
                      <span>{t.landing.tryNow}</span>
                      <ArrowRight size={12} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Section>
      </section>

      {/* ━━━ WHY TAKHAYAL ━━━ */}
      <section className="relative px-6 md:px-12 pb-32 md:pb-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-muted/40 to-transparent" />
        <Section>
          <div className="max-w-5xl mx-auto pt-8">
            <div className="text-center mb-16">
              <span className="text-[11px] font-medium text-primary uppercase tracking-[0.2em] mb-4 block">{t.landing.whyTakhayalLabel}</span>
              <h2 className="text-3xl md:text-5xl font-light text-foreground">{t.landing.whyTakhayalTitle}</h2>
              <p className="text-muted-foreground mt-4 text-base">{t.landing.whyTakhayalSubtitle}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {whyCards.map((card) => (
                <div key={card.title} className="group relative bg-card/40 border border-muted/50 rounded-2xl p-8 hover:border-primary/25 hover:bg-card/60 transition-all duration-500">
                  <div className="absolute inset-0 rounded-2xl bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-primary/[0.1] border border-primary/15 flex items-center justify-center mb-5 group-hover:bg-primary/[0.15] group-hover:shadow-[0_0_20px_rgba(245,81,48,0.1)] transition-all duration-500">
                      <card.icon size={20} className="text-primary" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-base font-medium text-foreground mb-2">{card.title}</h3>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </section>

      {/* ━━━ FINAL CTA ━━━ */}
      <section className="relative px-6 md:px-12 pb-32 md:pb-40">
        <Section>
          <div className="relative max-w-4xl mx-auto text-center py-20 md:py-24">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/[0.08] rounded-full blur-[120px]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-primary/[0.05] rounded-full blur-[60px]" />
            </div>
            <div className="absolute inset-0 rounded-3xl border border-muted/30 bg-card/20" />
            <div className="relative">
              <Sparkles size={24} className="text-primary mx-auto mb-6 opacity-60" />
              <h2 className="text-3xl md:text-5xl font-light text-foreground mb-5">{t.landing.finalCtaTitle}</h2>
              <p className="text-muted-foreground mb-10 text-base max-w-md mx-auto">{t.landing.finalCtaSubtitle}</p>
              <div className="flex items-center justify-center">
                <button onClick={handleStartCreating} className="group w-full max-w-md h-14 rounded-full bg-primary text-primary-foreground text-base md:text-lg font-medium hover:brightness-110 transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,81,48,0.35)] hover:scale-[1.02]">
                  {t.landing.startCreating}
                  <ArrowRight size={18} className={`inline ${isRTL ? 'mr-2 rotate-180' : 'ml-2'} group-hover:translate-x-1 transition-transform`} />
                </button>
              </div>
            </div>
          </div>
        </Section>
      </section>

      {/* Footer */}
      <footer className="border-t border-muted/30 px-6 py-10 text-center">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="small" />
          <p className="text-[12px] text-muted-foreground">{t.landing.allRightsReserved}</p>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/about')} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">{isRTL ? 'من نحن' : 'About Us'}</button>
            <button onClick={() => navigate('/pricing')} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">{t.nav.pricing}</button>
            <button onClick={() => navigate('/tools')} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">{t.nav.tools}</button>
            <button onClick={() => navigate('/community')} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">{t.nav.community}</button>
            <button onClick={() => navigate('/privacy')} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">{isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}</button>
            <button onClick={() => navigate('/terms')} className="text-[12px] text-muted-foreground hover:text-foreground transition-colors">{isRTL ? 'الشروط والأحكام' : 'Terms & Conditions'}</button>
          </div>
        </div>
      </footer>

      <AuthModal />
    </div>
  );
}
