import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { Logo } from '@/components/Logo';
import {
  ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Globe2,
  Star, Clock, MapPin, Layers, Paintbrush, Zap, Target,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PageSeo } from '@/components/seo/PageSeo';

/* ── scroll-reveal hook (same as landing) ── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, vis };
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, vis } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${vis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function About() {
  const navigate = useNavigate();
  const { isRTL, t } = useLanguage();
  const copy = t.about;

  const stats = [
    { value: copy.statsModelsValue, label: copy.statsModelsLabel, icon: Layers },
    { value: copy.statsLanguagesValue, label: copy.statsLanguagesLabel, icon: Globe2 },
    { value: copy.statsRegionValue, label: copy.statsRegionLabel, icon: MapPin },
    { value: copy.statsCreativeValue, label: copy.statsCreativeLabel, icon: Sparkles },
  ];

  const values = [
    {
      icon: CheckCircle2,
      title: copy.valueArabicTitle,
      desc: copy.valueArabicDesc,
    },
    {
      icon: Paintbrush,
      title: copy.valueCultureTitle,
      desc: copy.valueCultureDesc,
    },
    {
      icon: Star,
      title: copy.valueQualityTitle,
      desc: copy.valueQualityDesc,
    },
    {
      icon: Clock,
      title: copy.valueSpeedTitle,
      desc: copy.valueSpeedDesc,
    },
  ];

  const timeline = [
    {
      icon: Target,
      title: copy.timelineFrustrationTitle,
      desc: copy.timelineFrustrationDesc,
    },
    {
      icon: Zap,
      title: copy.timelineSolutionTitle,
      desc: copy.timelineSolutionDesc,
    },
    {
      icon: Globe2,
      title: copy.timelineTodayTitle,
      desc: copy.timelineTodayDesc,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <PageSeo
        title={copy.seoTitle}
        description={copy.seoDescription}
        canonicalPath="/about"
        pageType="AboutPage"
      />

      {/* ━━━ HERO ━━━ */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 md:pt-44 md:pb-32 overflow-hidden">
        {/* Quiet studio backdrop */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ background: 'radial-gradient(ellipse 72% 46% at 30% 62%, hsl(var(--primary) / 0.22), transparent), radial-gradient(ellipse 56% 34% at 70% 38%, hsl(var(--primary) / 0.12), transparent)', filter: 'blur(96px)' }}
          />
          <div className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[560px] h-[360px] rounded-full"
            style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, transparent 72%)', filter: 'blur(120px)' }}
          />
        </div>

        {/* Back + Logo */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border/40 text-[13px] text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-card/50 transition-all duration-300"
          >
            <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} />
            {copy.back}
          </button>
          <Logo size="small" />
        </div>

        {/* Hero content */}
        <span className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/[0.12] border border-primary/30 text-primary text-[13px] font-medium mb-8 animate-fade-in">
          <Sparkles size={14} />
          {copy.badge}
        </span>
        <h1 className="relative typo-display-hero max-w-[800px] animate-fade-in" style={{ animationDelay: '100ms' }}>
          {copy.heroTitlePrefix}{' '}
          <br className="hidden md:block" />
          <span className="text-primary font-light">
            {copy.heroTitleHighlight}
          </span>
        </h1>
        <p className="relative text-base md:text-lg font-light text-muted-foreground mt-6 max-w-xl animate-fade-in leading-relaxed" style={{ animationDelay: '200ms' }}>
          {copy.heroSubtitle}
        </p>
      </section>

      {/* ━━━ STATS ━━━ */}
      <section className="px-6 md:px-12 pb-24 md:pb-32">
        <Reveal>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {stats.map((s, i) => (
              <Reveal key={s.value + i} delay={i * 80}>
                <div className="group relative bg-card/65 border border-border/50 rounded-2xl p-6 text-center hover:border-primary/20 transition-all duration-500">
                  <div className="absolute inset-0 rounded-2xl bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-primary/[0.08] border border-primary/12 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/[0.12] transition-all duration-500">
                      <s.icon size={18} className="text-primary" strokeWidth={1.5} />
                    </div>
                    <div className="text-3xl md:text-4xl font-light text-primary mb-1">{s.value}</div>
                    <div className="text-[13px] text-muted-foreground">{s.label}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ━━━ MISSION ━━━ */}
      <section className="relative px-6 md:px-12 pb-24 md:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <Reveal>
          <div className="max-w-4xl mx-auto pt-8">
            <div className="text-center mb-12">
              <span className="text-[11px] font-medium text-primary uppercase tracking-[0.2em] mb-4 block">
                {copy.missionLabel}
              </span>
            </div>
            <div className="relative">
              <div className={`absolute top-0 bottom-0 ${isRTL ? 'right-0' : 'left-0'} w-[3px] rounded-full bg-gradient-to-b from-primary via-primary/60 to-primary/20`} />
              <blockquote className={`${isRTL ? 'pr-8 md:pr-12' : 'pl-8 md:pl-12'}`}>
                <p className="text-xl md:text-3xl font-light leading-[1.5] text-foreground">
                  {copy.missionText}
                </p>
              </blockquote>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ━━━ VALUES ━━━ */}
      <section className="relative px-6 md:px-12 pb-24 md:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <Reveal>
          <div className="max-w-5xl mx-auto pt-8">
            <div className="text-center mb-14">
              <span className="text-[11px] font-medium text-primary uppercase tracking-[0.2em] mb-4 block">
                {copy.valuesLabel}
              </span>
              <h2 className="typo-heading-section">
                {copy.valuesTitle}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {values.map((v, i) => (
                <Reveal key={v.title} delay={i * 100}>
                  <div className="group relative bg-card/58 border border-border/45 rounded-2xl p-7 hover:border-primary/18 hover:bg-card/72 transition-all duration-500 h-full">
                    <div className="absolute inset-0 rounded-2xl bg-primary/[0.015] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative">
                      <div className="w-11 h-11 rounded-xl bg-primary/[0.08] border border-primary/12 flex items-center justify-center mb-5 group-hover:bg-primary/[0.14] transition-all duration-500">
                        <v.icon size={20} className="text-primary" strokeWidth={1.5} />
                      </div>
                      <h3 className="text-base font-medium text-foreground mb-2">{v.title}</h3>
                      <p className="text-[13px] text-muted-foreground leading-relaxed">{v.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ━━━ OUR STORY — TIMELINE ━━━ */}
      <section className="relative px-6 md:px-12 pb-24 md:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <Reveal>
          <div className="max-w-4xl mx-auto pt-8">
            <div className="text-center mb-14">
              <span className="text-[11px] font-medium text-primary uppercase tracking-[0.2em] mb-4 block">
                {copy.storyLabel}
              </span>
              <h2 className="typo-heading-section">
                {copy.storyTitle}
              </h2>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className={`absolute top-0 bottom-0 ${isRTL ? 'right-5 md:right-8' : 'left-5 md:left-8'} w-px bg-gradient-to-b from-primary/40 via-border/40 to-transparent`} />

              <div className="space-y-10">
                {timeline.map((item, i) => (
                  <Reveal key={item.title} delay={i * 150}>
                    <div className={`relative flex items-start gap-6 md:gap-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {/* Dot */}
                      <div className="relative z-10 w-10 h-10 md:w-16 md:h-16 rounded-2xl bg-card border border-border/60 flex items-center justify-center shrink-0 group-hover:border-primary/25 transition-colors">
                        <div className="absolute inset-0 rounded-2xl bg-primary/[0.04]" />
                        <item.icon size={20} className="text-primary relative" strokeWidth={1.5} />
                      </div>
                      {/* Content */}
                      <div className="pt-1">
                        <span className="text-[11px] font-semibold text-primary/70 uppercase tracking-[0.15em] mb-2 block">
                          {copy.chapter} {i + 1}
                        </span>
                        <h3 className="text-lg font-medium text-foreground mb-2">{item.title}</h3>
                        <p className="text-[14px] text-muted-foreground leading-[1.8]">{item.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ━━━ LOCATION ━━━ */}
      <section className="relative px-6 md:px-12 pb-24 md:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
        <Reveal>
          <div className="max-w-4xl mx-auto pt-8">
            <div className="text-center mb-10">
              <span className="text-[11px] font-medium text-primary uppercase tracking-[0.2em] mb-4 block">
                {copy.locationLabel}
              </span>
            </div>
            <div className="bg-card/50 border border-border/40 rounded-2xl p-6 md:p-8 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/[0.1] border border-primary/15 flex items-center justify-center shrink-0">
                <MapPin size={20} className="text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-base font-medium text-foreground mb-1">
                  {copy.locationTitle}
                </h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  {copy.locationDesc}
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section className="relative px-6 md:px-12 pb-24 md:pb-32">
        <Reveal>
          <div className="relative max-w-4xl mx-auto text-center py-16 md:py-20">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-12 inset-y-8 rounded-[32px] bg-primary/[0.03]" />
            </div>
            <div className="absolute inset-0 rounded-3xl border border-border/40 bg-card/40" />
            <div className="relative">
              <Sparkles size={22} className="text-primary mx-auto mb-6 opacity-45" />
              <h2 className="typo-heading-section mb-4">
                {copy.ctaTitle}
              </h2>
              <p className="text-muted-foreground mb-10 text-base max-w-md mx-auto">
                {copy.ctaSubtitle}
              </p>
              <button
                onClick={() => navigate('/home')}
                className="group h-14 px-10 rounded-full bg-primary text-primary-foreground text-base font-medium transition-all duration-300 hover:brightness-95 hover:-translate-y-0.5"
              >
                {copy.ctaButton}
                <ArrowRight size={16} className={`inline ${isRTL ? 'mr-2 rotate-180' : 'ml-2'} group-hover:translate-x-1 transition-transform`} />
              </button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
