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
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';

  const stats = [
    { value: '14+', label: isAr ? 'نموذج ذكاء اصطناعي' : 'AI Models', icon: Layers },
    { value: '2', label: isAr ? 'لغات مدعومة' : 'Languages', icon: Globe2 },
    { value: 'GCC', label: isAr ? 'صُمم للمنطقة' : 'Built for Region', icon: MapPin },
    { value: '∞', label: isAr ? 'إمكانيات إبداعية' : 'Creative Possibilities', icon: Sparkles },
  ];

  const values = [
    {
      icon: CheckCircle2,
      title: isAr ? 'عربي أولاً بالتصميم' : 'Arabic-first by design',
      desc: isAr
        ? 'ليست فكرة لاحقة. كل أمر وقالب وسير عمل مبني مع المبدعين العرب في الاعتبار منذ اليوم الأول.'
        : 'Not an afterthought. Every prompt, template, and workflow is built with Arabic creators in mind from day one.',
    },
    {
      icon: Paintbrush,
      title: isAr ? 'واعٍ ثقافياً' : 'Culturally aware',
      desc: isAr
        ? 'من حملات رمضان إلى محتوى اليوم الوطني، أدواتنا تفهم ثقافة الخليج، وليس فقط لغة الخليج.'
        : 'From Ramadan campaigns to national day content, our tools understand Gulf culture, not just Gulf language.',
    },
    {
      icon: Star,
      title: isAr ? 'جودة بلا تنازل' : 'Quality without compromise',
      desc: isAr
        ? 'نوجّه كل عملية توليد عبر أفضل نموذج ذكاء اصطناعي متاح للمهمة — لتكون مخرجاتك دائماً الأفضل.'
        : 'We route every generation through the best available AI model for the task — so your output is always the best it can be.',
    },
    {
      icon: Clock,
      title: isAr ? 'سريع وصادق' : 'Fast and honest',
      desc: isAr
        ? 'لا تكاليف مخفية. ترى بالضبط تكلفة التوليد قبل الإنشاء — والنتائج تصل في ثوانٍ.'
        : 'No hidden costs. You see exactly what a generation costs before you create it — results arrive in seconds.',
    },
  ];

  const timeline = [
    {
      icon: Target,
      title: isAr ? 'الإحباط' : 'The Frustration',
      desc: isAr
        ? 'أقوى أدوات الذكاء الاصطناعي الإبداعية في العالم لم تُبنَ لنا. كانت تفتقر إلى دعم الأوامر العربية وتتجاهل جماليات الخليج.'
        : 'The most powerful AI creative tools in the world were not built for us. They lacked Arabic prompt support and ignored Gulf aesthetics.',
    },
    {
      icon: Zap,
      title: isAr ? 'الحل' : 'The Solution',
      desc: isAr
        ? 'بنينا تخيّل — استوديو يتحدث لغتك ويفهم مناسباتك ويقدم نفس الجودة التي يأخذها المبدعون العالميون كأمر مسلّم.'
        : 'We built Takhayal — a studio that speaks your language, understands your occasions, and delivers the same quality global creators take for granted.',
    },
    {
      icon: Globe2,
      title: isAr ? 'الآن' : 'Today',
      desc: isAr
        ? 'نحن فريق صغير ومركّز مقره الكويت، نخدم المبدعين في الكويت والسعودية ودول الخليج — وقد بدأنا للتو.'
        : 'We are a small, focused team based in Kuwait, serving creators across Kuwait, Saudi Arabia, and the wider GCC — and we are just getting started.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <PageSeo
        title={isAr ? 'من نحن | تخيّل' : 'About | Takhayal.ai'}
        description={isAr
          ? 'تعرّف على قصة تخيّل ورسالتها لبناء استوديو ذكاء اصطناعي عربي أولاً للمبدعين في الخليج.'
          : 'Learn about Takhayal, the Arabic-first AI creative studio built for creators and brands across the Gulf.'}
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
            {isAr ? 'رجوع' : 'Back'}
          </button>
          <Logo size="small" />
        </div>

        {/* Hero content */}
        <span className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/[0.12] border border-primary/30 text-primary text-[13px] font-medium mb-8 animate-fade-in">
          <Sparkles size={14} />
          {isAr ? 'من نحن' : 'ABOUT US'}
        </span>
        <h1 className="relative typo-display-hero max-w-[800px] animate-fade-in" style={{ animationDelay: '100ms' }}>
          {isAr ? 'صُمم لمبدعي' : 'Built for the'}{' '}
          <br className="hidden md:block" />
          <span className="text-primary font-light">
            {isAr ? 'الخليج' : 'Gulf creator.'}
          </span>
        </h1>
        <p className="relative text-base md:text-lg font-light text-muted-foreground mt-6 max-w-xl animate-fade-in leading-relaxed" style={{ animationDelay: '200ms' }}>
          {isAr
            ? 'تخيّل هو استوديو الذكاء الاصطناعي العربي أولاً الذي يحوّل رؤيتك الإبداعية إلى صور ومقاطع فيديو احترافية في ثوانٍ.'
            : 'Takhayal is the Arabic-first AI creative studio transforming your vision into professional images and videos in seconds.'}
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
                {isAr ? 'مهمتنا' : 'OUR MISSION'}
              </span>
            </div>
            <div className="relative">
              <div className={`absolute top-0 bottom-0 ${isRTL ? 'right-0' : 'left-0'} w-[3px] rounded-full bg-gradient-to-b from-primary via-primary/60 to-primary/20`} />
              <blockquote className={`${isRTL ? 'pr-8 md:pr-12' : 'pl-8 md:pl-12'}`}>
                <p className="text-xl md:text-3xl font-light leading-[1.5] text-foreground">
                  {isAr
                    ? 'وضع الذكاء الاصطناعي الإبداعي العالمي في أيدي كل مبدع ومصمم وعلامة تجارية ناطقة بالعربية في الخليج.'
                    : 'To put world-class creative AI in the hands of every Arabic-speaking creator, designer, and brand in the Gulf.'}
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
                {isAr ? 'ما نؤمن به' : 'WHAT WE STAND FOR'}
              </span>
              <h2 className="typo-heading-section">
                {isAr ? 'قيمنا الأساسية' : 'Our Core Values'}
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
                {isAr ? 'قصتنا' : 'OUR STORY'}
              </span>
              <h2 className="typo-heading-section">
                {isAr ? 'كيف بدأنا' : 'How it started'}
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
                          {isAr ? `الفصل ${i + 1}` : `Chapter ${i + 1}`}
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
                {isAr ? 'أين نحن' : 'WHERE WE ARE'}
              </span>
            </div>
            <div className="bg-card/50 border border-border/40 rounded-2xl p-6 md:p-8 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/[0.1] border border-primary/15 flex items-center justify-center shrink-0">
                <MapPin size={20} className="text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <h3 className="text-base font-medium text-foreground mb-1">
                  {isAr ? 'الكويت' : 'Kuwait'}
                </h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">
                  {isAr
                    ? 'المقر الرئيسي وفريق التأسيس. نخدم المبدعين في الكويت والسعودية ودول الخليج.'
                    : 'Headquarters and founding team. Serving creators across Kuwait, Saudi Arabia, and the wider GCC.'}
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
                {isAr ? 'مستعد لإنشاء شيء مذهل؟' : 'Ready to create something?'}
              </h2>
              <p className="text-muted-foreground mb-10 text-base max-w-md mx-auto">
                {isAr
                  ? 'انضم إلى المبدعين في الخليج الذين يستخدمون تخيّل كل يوم.'
                  : 'Join creators across the Gulf using Takhayal every day.'}
              </p>
              <button
                onClick={() => navigate('/home')}
                className="group h-14 px-10 rounded-full bg-primary text-primary-foreground text-base font-medium transition-all duration-300 hover:brightness-95 hover:-translate-y-0.5"
              >
                {isAr ? 'ابدأ الإنشاء مجاناً' : 'Start creating free'}
                <ArrowRight size={16} className={`inline ${isRTL ? 'mr-2 rotate-180' : 'ml-2'} group-hover:translate-x-1 transition-transform`} />
              </button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
