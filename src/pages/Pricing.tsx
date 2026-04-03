import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Check, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  usePricingPlans, useCreditPackages, usePricingFaqs,
} from '@/hooks/useBillingData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Credit cost data for the tool table
const CREDIT_COST_DATA = [
  { model: 'Flux Schnell', options: [{ label: '1K', credits: 3 }, { label: '2K', credits: 4 }, { label: '4K', credits: 5 }] },
  { model: 'Flux Dev', options: [{ label: '1K', credits: 5 }, { label: '2K', credits: 6 }, { label: '4K', credits: 7 }] },
  { model: 'GPT Image 1.5', options: [{ label: '1K', credits: 6 }, { label: '2K', credits: 8 }] },
  { model: 'Ideogram V3', options: [{ label: '1K', credits: 4 }, { label: '2K', credits: 5 }] },
  { model: 'Imagen 4', options: [{ label: '1K', credits: 6 }, { label: '2K', credits: 7 }] },
  { model: 'Nano Banana 2', options: [{ label: '1K', credits: 10 }, { label: '2K', credits: 14 }, { label: '4K', credits: 18 }] },
  { model: 'Nano Banana Pro', options: [{ label: '2K', credits: 18 }, { label: '4K', credits: 30 }] },
  { model: 'Recraft V3', options: [{ label: '1K', credits: 6 }, { label: '2K', credits: 7 }] },
  { model: 'Qwen Image', options: [{ label: '1K', credits: 4 }, { label: '2K', credits: 5 }] },
  { model: 'Seedream 4.5', options: [{ label: '1K', credits: 6 }, { label: '2K', credits: 6 }] },
];

const FAQ_DATA = [
  { q_en: 'What is a credit?', q_ar: 'ما هو الرصيد؟', a_en: '1 credit = $0.01. Credits are deducted per generation based on the model and resolution you choose. You always see the credit cost before generating.', a_ar: 'رصيد واحد = 0.01 دولار. يتم خصم الأرصدة لكل عملية توليد بناءً على النموذج والدقة التي تختارها.' },
  { q_en: 'Do credits expire?', q_ar: 'هل تنتهي صلاحية الأرصدة؟', a_en: 'Subscription credits reset monthly. Top-up credits never expire.', a_ar: 'أرصدة الاشتراك تتجدد شهرياً. أرصدة الشحن لا تنتهي صلاحيتها.' },
  { q_en: 'Can I change my plan?', q_ar: 'هل يمكنني تغيير خطتي؟', a_en: 'Yes, upgrade or downgrade anytime. Changes take effect immediately.', a_ar: 'نعم، يمكنك الترقية أو التخفيض في أي وقت. التغييرات تسري فوراً.' },
  { q_en: 'What payment methods are accepted?', q_ar: 'ما طرق الدفع المقبولة؟', a_en: 'We accept Visa, Mastercard, KNET, Mada, and Apple Pay.', a_ar: 'نقبل Visa و Mastercard و KNET و مدى و Apple Pay.' },
  { q_en: 'Is there a free trial?', q_ar: 'هل يوجد تجربة مجانية؟', a_en: 'Yes — sign up free and get 15 credits instantly. No card required.', a_ar: 'نعم — سجل مجاناً واحصل على 15 رصيداً فوراً. لا حاجة لبطاقة.' },
  { q_en: 'Can I get a refund?', q_ar: 'هل يمكنني استرداد المبلغ؟', a_en: 'Annual subscriptions are eligible for refund within 7 days if fewer than 100 credits have been used. See our Refund Policy for details.', a_ar: 'الاشتراكات السنوية مؤهلة للاسترداد خلال 7 أيام إذا تم استخدام أقل من 100 رصيد.' },
];

interface PlanCardProps {
  p: any;
  isAr: boolean;
  billing: 'monthly' | 'annual';
  isAuthenticated: boolean;
  authLoading: boolean;
  userPlan: string;
  slugOrder: string[];
  fmt: (n: number) => string;
  getPrice: (p: any) => number;
  handleCta: (p: any) => void;
  scale?: number;
  dimmed?: boolean;
}

function PlanCard({ p, isAr, billing, isAuthenticated, authLoading, userPlan, slugOrder, fmt, getPrice, handleCta, scale = 1, dimmed = false }: PlanCardProps) {
  const name = isAr ? p.name_ar : p.name_en;
  const desc = isAr ? p.description_ar : p.description_en;
  const badge = isAr ? p.badge_ar : p.badge_en;
  const features: Array<{en: string; ar: string}> = p.features || [];
  const isCurrent = isAuthenticated && userPlan === p.slug;
  const price = getPrice(p);
  const currentIdx = slugOrder.indexOf(userPlan);
  const thisIdx = slugOrder.indexOf(p.slug);

  let btnText = isAr ? p.cta_label_ar : p.cta_label_en;
  let btnDisabled = false;
  let btnStyle = p.featured
    ? 'bg-primary text-primary-foreground hover:brightness-90'
    : 'bg-muted/50 text-foreground hover:bg-muted';

  if (!authLoading && isAuthenticated) {
    if (isCurrent) {
      btnText = isAr ? 'الخطة الحالية' : 'Current Plan';
      btnDisabled = true;
      btnStyle = 'bg-muted/30 text-muted-foreground cursor-default';
    } else if (thisIdx < currentIdx) {
      btnText = isAr ? 'تخفيض' : 'Downgrade';
      btnStyle = 'bg-muted/50 text-muted-foreground hover:bg-muted';
    } else {
      btnText = isAr ? `ترقية إلى ${name}` : `Upgrade to ${name}`;
    }
  }

  return (
    <div
      className={`rounded-2xl p-6 flex flex-col transition-all duration-200 relative ${
        p.featured ? 'bg-card shadow-[0_0_0_1.5px_hsl(var(--primary)),0_8px_30px_rgba(240,62,27,0.12)]' : 'bg-card shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
      }`}
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        opacity: dimmed ? 0.7 : 1,
        transformOrigin: 'center center',
      }}
    >
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-medium bg-primary text-primary-foreground whitespace-nowrap">{badge}</span>
      )}
      <h3 className="text-lg font-medium text-foreground">{name}</h3>
      <p className="text-[12px] text-muted-foreground mt-1">{desc}</p>

      <div className="mt-4 flex items-baseline gap-1">
        {billing === 'annual' && p.price_monthly_usd > 0 && (
          <span className="text-sm text-muted-foreground line-through mr-1">{fmt(p.price_monthly_usd)}</span>
        )}
        <span className="text-[36px] font-extralight text-foreground">{fmt(price)}</span>
        {p.price_monthly_usd > 0 && <span className="text-sm text-muted-foreground">/{isAr ? 'شهر' : 'mo'}</span>}
      </div>

      {billing === 'annual' && p.price_annual_usd > 0 && (
        <p className="text-[11px] text-muted-foreground mt-1">
          {isAr ? `يُفوتر سنوياً بمبلغ ${fmt(p.price_annual_usd)}` : `Billed as ${fmt(p.price_annual_usd)}/year`}
        </p>
      )}

      <div className="mt-4 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[12px] font-medium w-fit">
        {p.credits_monthly > 0 ? (
          <>{p.credits_monthly.toLocaleString()} {isAr ? 'رصيد / شهر' : 'credits / month'}</>
        ) : (
          <>{isAr ? '15 رصيداً للبدء' : '15 credits to start'}</>
        )}
      </div>
      {p.credits_monthly > 0 && (
        <p className="text-[11px] text-muted-foreground mt-1">≈ {Math.floor(p.credits_monthly / 6).toLocaleString()} {isAr ? 'صورة' : 'images'}</p>
      )}

      <ul className="mt-5 space-y-2.5 flex-1">
        {features.map((f: any, i: number) => (
          <li key={i} className="flex items-center gap-2.5 text-[12px] text-foreground">
            <Check size={13} className="text-primary flex-shrink-0" />
            {isAr ? f.ar : f.en}
          </li>
        ))}
      </ul>

      {authLoading ? (
        <div className="mt-6 w-full h-11 rounded-xl bg-muted/30 animate-pulse" />
      ) : (
        <button
          onClick={() => !btnDisabled && handleCta(p)}
          disabled={btnDisabled}
          className={`mt-6 w-full h-11 rounded-xl text-[13px] font-medium transition-all ${btnStyle} ${btnDisabled ? 'opacity-70' : ''}`}
        >
          {btnText}
        </button>
      )}
    </div>
  );
}

function MobilePlanCarousel({ plans, isAr, ...cardProps }: { plans: any[] } & Omit<PlanCardProps, 'p' | 'scale' | 'dimmed'>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(() => {
    const featuredIdx = plans.findIndex((p: any) => p.featured);
    return featuredIdx >= 0 ? featuredIdx : Math.min(1, plans.length - 1);
  });

  const updateActiveFromScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || plans.length === 0) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    const cards = el.children;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(center - cardCenter);
      if (dist < minDist) { minDist = dist; closest = i; }
    }
    setActiveIdx(closest);
  }, [plans.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateActiveFromScroll, { passive: true });
    return () => el.removeEventListener('scroll', updateActiveFromScroll);
  }, [updateActiveFromScroll]);

  // Scroll to featured on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || plans.length === 0) return;
    const featuredIdx = plans.findIndex((p: any) => p.featured);
    const targetIdx = featuredIdx >= 0 ? featuredIdx : Math.min(1, plans.length - 1);
    const card = el.children[targetIdx] as HTMLElement;
    if (card) {
      const scrollTo = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
      el.scrollTo({ left: scrollTo, behavior: 'auto' });
    }
  }, [plans]);

  const scrollToIdx = (i: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[i] as HTMLElement;
    if (card) {
      const scrollTo = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
      el.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const canPrev = activeIdx > 0;
  const canNext = activeIdx < plans.length - 1;

  return (
    <div className="relative">
      {/* Arrow buttons */}
      {canPrev && (
        <button
          onClick={() => scrollToIdx(activeIdx - 1)}
          className="absolute top-1/2 left-0.5 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-card/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-foreground/50 active:scale-90 transition-all"
        >
          {isAr ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}
      {canNext && (
        <button
          onClick={() => scrollToIdx(activeIdx + 1)}
          className="absolute top-1/2 right-0.5 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-card/90 backdrop-blur-sm shadow-lg flex items-center justify-center text-foreground/50 active:scale-90 transition-all"
        >
          {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory pt-5 pb-4 scrollbar-none"
        style={{
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingLeft: '9vw',
          paddingRight: '9vw',
          gap: '12px',
        }}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {plans.map((p: any, i: number) => {
          const isActive = i === activeIdx;
          return (
            <div
              key={p.id}
              className="snap-center flex-shrink-0 transition-all duration-300 ease-out"
              style={{ width: '82vw', maxWidth: 340 }}
            >
              <div
                className="transition-all duration-300 ease-out"
                style={{
                  transform: isActive ? 'scale(1)' : 'scale(0.92)',
                  opacity: isActive ? 1 : 0.75,
                  transformOrigin: 'center center',
                }}
              >
                <PlanCard
                  p={p}
                  isAr={isAr}
                  scale={1}
                  dimmed={false}
                  {...cardProps}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination dots */}
      <div className="flex justify-center gap-2 mt-3">
        {plans.map((_: any, i: number) => (
          <button
            key={i}
            onClick={() => scrollToIdx(i)}
            className={`rounded-full transition-all duration-300 ${
              i === activeIdx
                ? 'w-6 h-2 bg-primary'
                : 'w-2 h-2 bg-muted-foreground/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function TestimonialCarousel({ isAr }: { isAr: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const { data: testimonials = [] } = useQuery({
    queryKey: ['testimonials-public'],
    queryFn: async () => {
      const { data } = await supabase.from('testimonials').select('*').eq('is_active', true).order('is_featured', { ascending: false }).order('sort_order');
      return (data as any[]) || [];
    },
    staleTime: 60000,
  });

  const updateActive = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const card = el.children[i] as HTMLElement;
      const dist = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (dist < minDist) { minDist = dist; closest = i; }
    }
    setActiveIdx(closest);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateActive, { passive: true });
    return () => el.removeEventListener('scroll', updateActive);
  }, [updateActive]);

  useEffect(() => {
    if (testimonials.length === 0) return;
    const interval = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      const next = (activeIdx + 1) % testimonials.length;
      const card = el.children[next] as HTMLElement;
      if (card) {
        el.scrollTo({ left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeIdx, testimonials.length]);

  if (testimonials.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto pb-20 px-0">
      <div className="text-center mb-10 px-6">
        <h2 className="text-2xl font-semibold text-foreground">{isAr ? 'ماذا يقول مستخدمونا' : 'What our users say'}</h2>
        <p className="text-sm text-muted-foreground mt-2">{isAr ? 'مبدعون حقيقيون، نتائج حقيقية' : 'Real creators, real results'}</p>
      </div>
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-none"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingLeft: '8vw', paddingRight: '8vw', gap: '16px' }}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {testimonials.map((t: any, i: number) => {
          const name = isAr ? t.name_ar : t.name_en;
          const role = isAr ? t.role_ar : t.role_en;
          const quote = isAr ? t.testimonial_ar : t.testimonial_en;
          const location = isAr ? t.location_ar : t.location_en;
          const initials = (t.name_en || '').split(' ').map((w: string) => w[0]).join('').slice(0, 2);
          const isActive = i === activeIdx;

          return (
            <div
              key={t.id}
              className="snap-center flex-shrink-0 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-500"
              style={{
                width: '84vw',
                maxWidth: 360,
                background: isActive
                  ? 'linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--card) / 0.8))'
                  : 'hsl(var(--card) / 0.5)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: isActive
                  ? '1px solid hsl(var(--primary) / 0.3)'
                  : '1px solid hsl(var(--border) / 0.1)',
                boxShadow: isActive
                  ? '0 8px 32px rgba(240,62,27,0.15), 0 2px 12px rgba(0,0,0,0.1)'
                  : '0 2px 12px rgba(0,0,0,0.06)',
                opacity: isActive ? 1 : 0.5,
                transform: isActive ? 'scale(1)' : 'scale(0.92)',
              }}
            >
              {/* Quote icon */}
              <div className="text-primary/40 text-3xl font-serif leading-none select-none">"</div>
              <p className="text-[15px] text-foreground/90 leading-relaxed" dir={isAr ? 'rtl' : 'ltr'}>
                {quote}
              </p>
              <div className="flex items-center gap-3 mt-auto pt-2 border-t border-border/10">
                {t.avatar_url ? (
                  <img src={t.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0 ring-2 ring-primary/15">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}{location ? ` · ${location}` : ''}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-2.5 mt-5">
        {testimonials.map((_: any, i: number) => (
          <button
            key={i}
            onClick={() => {
              const el = scrollRef.current;
              if (!el) return;
              const card = el.children[i] as HTMLElement;
              if (card) el.scrollTo({ left: card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' });
            }}
            className={`rounded-full transition-all duration-300 ${i === activeIdx ? 'w-6 h-2 bg-primary shadow-[0_0_8px_rgba(240,62,27,0.4)]' : 'w-2 h-2 bg-muted-foreground/25 hover:bg-muted-foreground/40'}`}
          />
        ))}
      </div>
    </section>
  );
}

const Pricing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, plan: userPlan, openAuthModal } = useApp();
  const { loading: authLoading } = useAuth();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const { data: plans = [] } = usePricingPlans();
  const { data: packages = [] } = useCreditPackages();
  const { data: dbFaqs = [] } = usePricingFaqs();

  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanPill, setSelectedPlanPill] = useState('creator');

  const fmt = (usd: number) => {
    return `$${usd % 1 === 0 ? usd.toFixed(0) : usd.toFixed(2)}`;
  };

  const activePlans = plans.filter((p: any) => p.active).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const activePackages = packages.filter((p: any) => p.active).sort((a: any, b: any) => a.sort_order - b.sort_order);

  // Use DB FAQs if available, otherwise fallback
  const faqs = dbFaqs.length > 0 ? dbFaqs.filter((f: any) => f.active) : FAQ_DATA.map((f, i) => ({ id: `faq-${i}`, question_en: f.q_en, question_ar: f.q_ar, answer_en: f.a_en, answer_ar: f.a_ar }));

  const selectedPlanCredits = activePlans.find((p: any) => p.slug === selectedPlanPill)?.credits_monthly || 5000;

  const slugOrder = ['free', 'starter', 'creator', 'studio'];

  const handleCta = (p: any) => {
    const slug = p.slug;
    if (slug === 'free') {
      if (!isAuthenticated) { openAuthModal('signup'); return; }
      return;
    }
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', `/checkout?plan=${slug}&billing=${billing}`);
      openAuthModal('signup');
      return;
    }
    navigate(`/checkout?plan=${slug}&billing=${billing}`);
  };

  const getPrice = (p: any) => {
    if (billing === 'annual') return p.price_annual_monthly_equivalent || p.price_monthly_usd;
    return p.price_monthly_usd || p.price;
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'calc(4rem + var(--banner-h, 0px))' }}>
      {/* Sign up banner — logged out only */}
      {!isAuthenticated && !authLoading && (
        <div className="bg-primary text-primary-foreground text-center py-3 px-4">
          <p className="text-sm font-medium">
            {isAr ? 'سجل مجاناً واحصل على 15 رصيداً فوراً — لا حاجة لبطاقة' : 'Sign up free and get 15 credits instantly — no card required'}
            <button onClick={() => openAuthModal('signup')} className="ml-3 px-4 py-1 rounded-full bg-white text-primary text-xs font-semibold hover:bg-white/90 transition-colors">
              {isAr ? 'ابدأ مجاناً' : 'Get started free'}
            </button>
          </p>
        </div>
      )}

      {/* Hero */}
      <section className="pt-20 pb-10 px-6 text-center">
        <h1 className="text-[42px] md:text-[52px] font-extralight text-foreground leading-tight">
          {isAr ? 'أسعار بسيطة وشفافة' : 'Simple, transparent pricing'}
        </h1>
        <p className="text-[16px] text-muted-foreground mt-4 max-w-md mx-auto font-light">
          {isAr ? 'ابدأ مجاناً. قم بالترقية عندما تكون جاهزاً.' : 'Start free. Upgrade when you\'re ready.'}
        </p>
      </section>

      {/* Billing toggle */}
      <div className="flex justify-center mb-10">
        <div className="flex p-1 rounded-full bg-muted">
          <button onClick={() => setBilling('monthly')} className={`px-6 py-2.5 rounded-full text-[13px] font-medium transition-all ${billing === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {isAr ? 'شهري' : 'Monthly'}
          </button>
          <button onClick={() => setBilling('annual')} className={`px-6 py-2.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-2 ${billing === 'annual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {isAr ? 'سنوي' : 'Annual'}
            <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{isAr ? 'وفر 20%' : 'Save 20%'}</span>
          </button>
        </div>
      </div>

      {/* Plan cards — carousel on mobile, grid on desktop */}
      <section className="max-w-5xl mx-auto pb-20">
        {/* Desktop grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5 px-6">
          {activePlans.map((p: any) => (
            <PlanCard key={p.id} p={p} isAr={isAr} billing={billing} isAuthenticated={isAuthenticated} authLoading={authLoading} userPlan={userPlan} slugOrder={slugOrder} fmt={fmt} getPrice={getPrice} handleCta={handleCta} />
          ))}
        </div>
        {/* Mobile carousel */}
        <div className="md:hidden">
          <MobilePlanCarousel plans={activePlans} isAr={isAr} billing={billing} isAuthenticated={isAuthenticated} authLoading={authLoading} userPlan={userPlan} slugOrder={slugOrder} fmt={fmt} getPrice={getPrice} handleCta={handleCta} />
        </div>
      </section>

      {/* Testimonials */}
      <TestimonialCarousel isAr={isAr} />

      {/* Credit Cost Per Tool */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-foreground">{isAr ? 'تكلفة الرصيد لكل أداة' : 'Credit cost per tool'}</h2>
          <p className="text-sm text-muted-foreground mt-2">{isAr ? 'شاهد إلى أي مدى تصل أرصدتك' : 'See exactly how far your credits go'}</p>
        </div>

        {/* Plan pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {activePlans.map((p: any) => (
            <button
              key={p.slug}
              onClick={() => setSelectedPlanPill(p.slug)}
              className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all ${
                selectedPlanPill === p.slug
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? p.name_ar : p.name_en} — {p.credits_monthly > 0 ? `${p.credits_monthly.toLocaleString()}cr` : '15cr'}
            </button>
          ))}
        </div>

        {/* Credit cost table */}
        <div className="bg-card/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
          <div className="grid grid-cols-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-6 py-4 bg-muted/20">
            <span>{isAr ? 'النموذج' : 'Model'}</span>
            <span>{isAr ? 'الخيار' : 'Option'}</span>
            <span>{isAr ? 'التكلفة' : 'Cost'}</span>
            <span className="text-right">~{isAr ? 'الصور' : 'Images'}</span>
          </div>
          {CREDIT_COST_DATA.map((model, mi) => (
            <div key={model.model}>
              {model.options.map((opt, oi) => (
                <div key={opt.label} className={`grid grid-cols-4 px-6 py-3.5 hover:bg-muted/10 transition-colors text-sm ${oi > 0 ? 'bg-muted/[0.03]' : ''}`}>
                  <span className={oi === 0 ? 'font-medium text-foreground' : 'text-transparent select-none'}>
                    {model.model}
                  </span>
                  <span className="text-muted-foreground">{opt.label} resolution</span>
                  <span className="text-foreground">{opt.credits} {isAr ? 'أرصدة' : 'credits'}</span>
                  <span className="text-right text-primary font-medium">~{Math.floor(selectedPlanCredits / opt.credits).toLocaleString()} {isAr ? 'صورة' : 'images'}</span>
                </div>
              ))}
              {mi < CREDIT_COST_DATA.length - 1 && <div className="h-px bg-gradient-to-r from-transparent via-muted-foreground/[0.06] to-transparent mx-4" />}
            </div>
          ))}
        </div>
      </section>

      {/* Top-Up Packages */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-foreground">{isAr ? 'اشحن في أي وقت' : 'Top up anytime'}</h2>
          <p className="text-sm text-muted-foreground mt-2">{isAr ? 'الأرصدة لا تنتهي صلاحيتها. اشترِ المزيد متى احتجت.' : 'Credits never expire. Buy more whenever you need them.'}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activePackages.map((pkg: any) => {
            const name = isAr ? pkg.name_ar : pkg.name_en;
            const badge = isAr ? pkg.badge_ar : pkg.badge_en;
            return (
              <div key={pkg.id} className={`bg-card rounded-xl p-5 flex flex-col items-center text-center relative ${
                pkg.is_popular ? 'shadow-[0_0_0_1.5px_hsl(var(--primary)),0_8px_30px_rgba(240,62,27,0.12)]' : 'shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
              }`}>
                {badge && (
                  <span className="absolute -top-2.5 px-3 py-0.5 rounded-full text-[10px] font-medium bg-primary text-primary-foreground">{badge}</span>
                )}
                <p className="text-sm font-medium text-foreground mt-1">{name}</p>
                <p className="text-[32px] font-extralight text-foreground mt-2">{pkg.credits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{isAr ? 'أرصدة' : 'credits'}</p>
                {pkg.bonus_credits > 0 && (
                  <span className="mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                    +{pkg.bonus_credits} {isAr ? 'مكافأة' : 'bonus'}
                  </span>
                )}
                <p className="text-lg font-medium text-foreground mt-3">{fmt(pkg.price)}</p>
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      sessionStorage.setItem('redirectAfterLogin', `/checkout?credits=${pkg.credits}&price=${pkg.price}`);
                      openAuthModal('signup');
                      return;
                    }
                    navigate(`/checkout?credits=${pkg.credits}&price=${pkg.price}`);
                  }}
                  className={`mt-4 w-full h-10 rounded-xl text-[13px] font-medium transition-all ${
                    pkg.is_popular
                      ? 'bg-primary text-primary-foreground hover:brightness-90'
                      : 'bg-muted/50 text-foreground hover:bg-muted'
                  }`}
                >
                  {isAr ? 'شراء أرصدة' : 'Buy Credits'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-light text-foreground">{isAr ? 'أسئلة شائعة' : 'Common questions'}</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq: any, i: number) => (
            <AccordionItem key={faq.id || i} value={`faq-${i}`} className="bg-card rounded-xl px-5 py-1 shadow-[0_1px_6px_rgba(0,0,0,0.04)] data-[state=open]:shadow-[0_0_0_1px_rgba(240,62,27,0.15),0_4px_16px_rgba(0,0,0,0.06)]">
              <AccordionTrigger className="text-[14px] font-medium text-foreground hover:no-underline py-4">
                {isAr ? (faq.question_ar || faq.q_ar) : (faq.question_en || faq.q_en)}
              </AccordionTrigger>
              <AccordionContent className="text-[13px] text-muted-foreground pb-4 leading-relaxed">
                {isAr ? (faq.answer_ar || faq.a_ar) : (faq.answer_en || faq.a_en)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Legal */}
      <section className="max-w-2xl mx-auto px-6 pb-16 text-center">
        <p className="text-[12px] text-muted-foreground">
          {isAr ? 'بالاشتراك أنت توافق على ' : 'By subscribing you agree to our '}
          <a href="/terms" className="hover:text-foreground transition-colors">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</a>
          {isAr ? ' و' : ' and '}
          <a href="/privacy" className="hover:text-foreground transition-colors">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</a>
        </p>
      </section>
    </div>
  );
};

export default Pricing;
