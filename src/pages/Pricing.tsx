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
  usePricingPageContent,
} from '@/hooks/useBillingData';
import { useModels } from '@/hooks/useModels';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageSeo, absoluteUrl } from '@/components/seo/PageSeo';
import { CmsContentBlocks } from '@/components/cms/CmsContentBlocks';

// Credit cost data for the tool table
const CREDIT_COST_DATA = [
  { model: 'Flux Schnell', options: [{ label: '1K', credits: 3 }, { label: '2K', credits: 4 }, { label: '4K', credits: 5 }] },
  { model: 'Flux Dev', options: [{ label: '1K', credits: 5 }, { label: '2K', credits: 6 }, { label: '4K', credits: 7 }] },
  { model: 'GPT Image 2', options: [{ label: '1K', credits: 4 }, { label: '2K', credits: 6 }] },
  { model: 'Ideogram V3', options: [{ label: '1K', credits: 4 }, { label: '2K', credits: 5 }] },
  { model: 'Imagen 4', options: [{ label: '1K', credits: 6 }, { label: '2K', credits: 7 }] },
  { model: 'Nano Banana 2', options: [{ label: '1K', credits: 10 }, { label: '2K', credits: 14 }, { label: '4K', credits: 18 }] },
  { model: 'Nano Banana Pro', options: [{ label: '2K', credits: 18 }, { label: '4K', credits: 30 }] },
  { model: 'Recraft V3', options: [{ label: '1K', credits: 6 }, { label: '2K', credits: 7 }] },
  { model: 'Qwen Image', options: [{ label: '1K', credits: 4 }, { label: '2K', credits: 5 }] },
  { model: 'Seedream 4.5', options: [{ label: '1K', credits: 6 }, { label: '2K', credits: 6 }] },
];

const FAQ_DATA = [
  { q_en: 'What is a credit?', q_ar: 'ما هو الرصيد؟', a_en: 'Credits are deducted per generation based on the model, duration, and resolution you choose. You always see the cost before generating.', a_ar: 'يتم خصم الأرصدة لكل عملية توليد بناءً على النموذج والمدة والدقة التي تختارها، وتظهر التكلفة قبل الإنشاء.' },
  { q_en: 'How should I choose a top-up?', q_ar: 'كيف أختار باقة الشحن؟', a_en: 'Pick Starter for occasional image edits, Creator or Pro for weekly image campaigns, and Studio or Power when video generation is part of your workflow.', a_ar: 'اختر مبتدئ للاستخدام الخفيف، وصانع محتوى أو محترف للحملات الأسبوعية، واستوديو أو مكثف عندما يكون الفيديو جزءاً من عملك.' },
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
        p.featured ? 'bg-primary/[0.03] border border-primary/35' : 'bg-card border border-border/40'
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
          className="absolute top-1/2 left-1 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-card text-foreground/70 transition-all active:scale-95"
          aria-label={isAr ? 'الخطة السابقة' : 'Previous plan'}
        >
          {isAr ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}
      {canNext && (
        <button
          onClick={() => scrollToIdx(activeIdx + 1)}
          className="absolute top-1/2 right-1 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border/50 bg-card text-foreground/70 transition-all active:scale-95"
          aria-label={isAr ? 'الخطة التالية' : 'Next plan'}
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
            className="flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300"
            aria-label={isAr ? `عرض الخطة ${i + 1}` : `Show plan ${i + 1}`}
          >
            <span className={`rounded-full transition-all duration-300 ${
              i === activeIdx
                ? 'w-6 h-2 bg-primary'
                : 'w-2.5 h-2.5 bg-muted-foreground/20'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
}

function TestimonialCarousel({ isAr }: { isAr: boolean }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const { data: testimonials = [] } = useQuery({
    queryKey: ['testimonials-public'],
    queryFn: async () => {
      const { data } = await supabase
        .from('testimonials')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('sort_order');
      return (data as any[]) || [];
    },
    staleTime: 60000,
  });

  useEffect(() => {
    if (!testimonials.length) return;
    setActiveIdx((current) => (current >= testimonials.length ? 0 : current));
  }, [testimonials.length]);

  useEffect(() => {
    if (testimonials.length < 2) return;
    const interval = window.setInterval(() => {
      setActiveIdx((current) => (current + 1) % testimonials.length);
    }, 3000);

    return () => window.clearInterval(interval);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;

  const activeTestimonial = testimonials[activeIdx];
  const name = isAr ? activeTestimonial.name_ar : activeTestimonial.name_en;
  const role = isAr ? activeTestimonial.role_ar : activeTestimonial.role_en;
  const quote = isAr ? activeTestimonial.testimonial_ar : activeTestimonial.testimonial_en;
  const location = isAr ? activeTestimonial.location_ar : activeTestimonial.location_en;
  const meta = [role, location].filter(Boolean).join(' • ');
  const initials = (name || activeTestimonial.name_en || '')
    .split(' ')
    .filter(Boolean)
    .map((word: string) => word[0])
    .join('')
    .slice(0, 2);

  return (
    <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <div className="mb-8 text-center">
        <h2 className="typo-heading-section">{isAr ? 'ماذا يقول مستخدمونا' : 'What our users say'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{isAr ? 'مبدعون حقيقيون، نتائج حقيقية' : 'Real creators, real results'}</p>
      </div>

      <div className="mx-auto max-w-[760px]">
        <article
          key={`${activeTestimonial.id}-${isAr ? 'ar' : 'en'}-${activeIdx}`}
          dir={isAr ? 'rtl' : 'ltr'}
          className={`animate-page-enter relative overflow-hidden rounded-[24px] border border-border/40 bg-card/80 p-5 sm:p-7 ${isAr ? 'text-right' : 'text-left'}`}
        >
          <div className={`pointer-events-none absolute inset-x-6 top-4 h-16 rounded-[20px] bg-primary/[0.03] ${isAr ? 'right-0' : 'left-0'}`} />
          <div className={`relative flex min-h-[270px] flex-col sm:min-h-[240px]`}>
            <span className="mb-5 text-4xl leading-none text-primary/45">“</span>

            <p className="text-[15px] leading-8 text-foreground/90 sm:text-lg sm:leading-8">
              {quote}
            </p>

            <div className={`mt-auto flex items-center gap-3 pt-6 `}>
              {activeTestimonial.avatar_url ? (
                <img
                  src={activeTestimonial.avatar_url}
                  alt={name}
                  className="h-11 w-11 flex-shrink-0 rounded-full object-cover ring-2 ring-primary/20"
                />
              ) : (
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary ring-2 ring-primary/15">
                  {initials}
                </div>
              )}

              <div>
                <p className="text-base font-semibold text-foreground">{name}</p>
                {meta ? <p className="text-sm text-muted-foreground">{meta}</p> : null}
              </div>
            </div>
          </div>
        </article>

        <div className="mt-5 flex items-center justify-center gap-2.5">
          {testimonials.map((testimonial: any, idx: number) => {
            const isActive = idx === activeIdx;

            return (
              <button
                key={testimonial.id}
                type="button"
                aria-label={isAr ? `عرض الشهادة ${idx + 1}` : `Show testimonial ${idx + 1}`}
                onClick={() => setActiveIdx(idx)}
                className="flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300"
              >
                <span
                  className={`rounded-full transition-all duration-300 ${isActive ? 'w-7 bg-primary' : 'w-2.5 bg-muted-foreground/20 hover:bg-muted-foreground/35'} h-2.5`}
                />
              </button>
            );
          })}
        </div>
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
  const { data: pageContent = [] } = usePricingPageContent();
  const { activeModels } = useModels();

  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlanPill, setSelectedPlanPill] = useState('creator');

  const fmt = (usd: number) => {
    return `$${usd % 1 === 0 ? usd.toFixed(0) : usd.toFixed(2)}`;
  };

  const activePlans = plans.filter((p: any) => p.active).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const activePackages = packages.filter((p: any) => p.active).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const pageText = useCallback((section: string, field: string, fallback: string) => {
    const item = pageContent.find((content: any) => content.active !== false && content.section_key === section && content.field_key === field);
    if (!item) return fallback;
    return (isAr ? item.value_ar || item.value_en : item.value_en || item.value_ar) || fallback;
  }, [isAr, pageContent]);

  // Use DB FAQs if available, otherwise fallback
  const faqs = dbFaqs.length > 0 ? dbFaqs.filter((f: any) => f.active) : FAQ_DATA.map((f, i) => ({ id: `faq-${i}`, question_en: f.q_en, question_ar: f.q_ar, answer_en: f.a_en, answer_ar: f.a_ar }));
  const seoTitle = isAr ? 'الأسعار' : 'Pricing';
  const seoDescription = isAr
    ? 'خطط وأسعار تخيّل مع أرصدة واضحة، شحن إضافي، وأسئلة شائعة للمبدعين والفرق في الخليج.'
    : 'Explore Takhayal pricing plans, credit top-ups, and FAQs for creators and teams building with AI in the Gulf.';
  const selectedPlanCredits = activePlans.find((p: any) => p.slug === selectedPlanPill)?.credits_monthly || 5000;
  const creditCostData = activeModels.length > 0
    ? activeModels
        .filter((model: any) => model.is_active && model.media_type === 'image' && model.credits_per_generation)
        .map((model: any) => ({
          model: model.model_name,
          options: [{
            label: model.default_resolution || model.max_resolution || model.supported_quality_tiers?.[0] || 'Default',
            credits: model.credits_per_generation,
          }],
        }))
    : CREDIT_COST_DATA;

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

  const pricingSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'OfferCatalog',
      name: isAr ? 'باقات تخيّل' : 'Takhayal pricing plans',
      itemListElement: activePlans.map((plan: any, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Offer',
          name: isAr ? plan.name_ar : plan.name_en,
          price: String(getPrice(plan)),
          priceCurrency: plan.currency || 'USD',
          url: absoluteUrl('/pricing'),
          availability: 'https://schema.org/InStock',
        },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.slice(0, 8).map((faq: any) => ({
        '@type': 'Question',
        name: isAr ? (faq.question_ar || faq.q_ar) : (faq.question_en || faq.q_en),
        acceptedAnswer: {
          '@type': 'Answer',
          text: isAr ? (faq.answer_ar || faq.a_ar) : (faq.answer_en || faq.a_en),
        },
      })),
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'calc(4rem + var(--banner-h, 0px))' }}>
      <PageSeo
        title={`${seoTitle} | Takhayal.ai`}
        description={seoDescription}
        canonicalPath="/pricing"
        pageType="CollectionPage"
        schemas={pricingSchemas}
      />
      {/* Sign up banner — logged out only */}
      {!isAuthenticated && !authLoading && (
        <div className="bg-primary text-primary-foreground text-center py-3 px-4">
          <p className="text-sm font-medium">
            {pageText('banner', 'signup_text', isAr ? 'سجل مجاناً واحصل على 15 رصيداً فوراً — لا حاجة لبطاقة' : 'Sign up free and get 15 credits instantly — no card required')}
            <button onClick={() => openAuthModal('signup')} className="ml-3 min-h-11 px-4 py-2 rounded-full bg-white text-primary text-xs font-semibold hover:bg-white/90 transition-colors">
              {pageText('banner', 'signup_cta', isAr ? 'ابدأ مجاناً' : 'Get started free')}
            </button>
          </p>
        </div>
      )}

      {/* Hero */}
      <section className="pt-20 pb-10 px-6 text-center">
        <h1 className="typo-display-hero">
          {pageText('hero', 'title', isAr ? 'أسعار بسيطة وشفافة' : 'Simple, transparent pricing')}
        </h1>
        <p className="text-[16px] text-muted-foreground mt-4 max-w-md mx-auto font-light">
          {pageText('hero', 'subtitle', isAr ? 'ابدأ مجاناً. قم بالترقية عندما تكون جاهزاً.' : 'Start free. Upgrade when you\'re ready.')}
        </p>
      </section>
      <CmsContentBlocks location="pricing" className="pb-10" />

      {/* Billing toggle */}
      <div className="flex justify-center mb-10">
        <div className="flex p-1 rounded-full bg-muted">
          <button onClick={() => setBilling('monthly')} className={`min-h-11 px-6 py-2.5 rounded-full text-[13px] font-medium transition-all ${billing === 'monthly' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {pageText('billing_toggle', 'monthly', isAr ? 'شهري' : 'Monthly')}
          </button>
          <button onClick={() => setBilling('annual')} className={`min-h-11 px-6 py-2.5 rounded-full text-[13px] font-medium transition-all flex items-center gap-2 ${billing === 'annual' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {pageText('billing_toggle', 'annual', isAr ? 'سنوي' : 'Annual')}
            <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{pageText('billing_toggle', 'annual_badge', isAr ? 'وفر 20%' : 'Save 20%')}</span>
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
          <h2 className="typo-heading-section">{pageText('credit_costs', 'title', isAr ? 'تكلفة الرصيد لكل أداة' : 'Credit cost per tool')}</h2>
          <p className="text-sm text-muted-foreground mt-2">{pageText('credit_costs', 'subtitle', isAr ? 'شاهد إلى أي مدى تصل أرصدتك' : 'See exactly how far your credits go')}</p>
        </div>

        {/* Plan pills */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {activePlans.map((p: any) => (
            <button
              key={p.slug}
              onClick={() => setSelectedPlanPill(p.slug)}
              className={`min-h-11 px-4 py-2.5 rounded-full text-[12px] font-medium transition-all ${
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
        <div className="bg-card/72 rounded-2xl overflow-hidden border border-border/40">
          <div className="grid grid-cols-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-6 py-4 bg-muted/20">
            <span>{pageText('credit_costs', 'model_label', isAr ? 'النموذج' : 'Model')}</span>
            <span>{pageText('credit_costs', 'option_label', isAr ? 'الخيار' : 'Option')}</span>
            <span>{pageText('credit_costs', 'cost_label', isAr ? 'التكلفة' : 'Cost')}</span>
            <span className="text-right">~{pageText('credit_costs', 'images_label', isAr ? 'الصور' : 'Images')}</span>
          </div>
          {creditCostData.map((model, mi) => (
            <div key={model.model}>
              {model.options.map((opt, oi) => (
                <div key={opt.label} className={`grid grid-cols-4 px-6 py-3.5 hover:bg-muted/10 transition-colors text-sm ${oi > 0 ? 'bg-muted/[0.03]' : ''}`}>
                  <span className={oi === 0 ? 'font-medium text-foreground' : 'text-transparent select-none'}>
                    {model.model}
                  </span>
                  <span className="text-muted-foreground">{opt.label} {pageText('credit_costs', 'resolution_label', isAr ? 'دقة' : 'resolution')}</span>
                  <span className="text-foreground">{opt.credits} {pageText('credit_costs', 'credits_label', isAr ? 'أرصدة' : 'credits')}</span>
                  <span className="text-right text-primary font-medium">~{Math.floor(selectedPlanCredits / opt.credits).toLocaleString()} {pageText('credit_costs', 'image_unit', isAr ? 'صورة' : 'images')}</span>
                </div>
              ))}
              {mi < creditCostData.length - 1 && <div className="h-px bg-gradient-to-r from-transparent via-muted-foreground/[0.06] to-transparent mx-4" />}
            </div>
          ))}
        </div>
      </section>

      {/* Top-Up Packages */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-8">
          <h2 className="typo-heading-section">{pageText('topups', 'title', isAr ? 'اشحن في أي وقت' : 'Top up anytime')}</h2>
          <p className="text-sm text-muted-foreground mt-2">{pageText('topups', 'subtitle', isAr ? 'اختر باقة تناسب وتيرة الصور والفيديو لديك.' : 'Choose a package that matches your image and video pace.')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {activePackages.map((pkg: any) => {
            const name = isAr ? pkg.name_ar : pkg.name_en;
            const badge = isAr ? pkg.badge_ar : pkg.badge_en;
            return (
              <div key={pkg.id} className={`bg-card rounded-xl p-5 flex flex-col items-center text-center relative border ${
                pkg.is_popular ? 'border-primary/45 bg-primary/[0.03]' : 'border-border/40'
              }`}>
                {badge && (
                  <span className="absolute -top-2.5 px-3 py-0.5 rounded-full text-[10px] font-medium bg-primary text-primary-foreground">{badge}</span>
                )}
                <p className="text-sm font-medium text-foreground mt-1">{name}</p>
                <p className="text-[32px] font-extralight text-foreground mt-2">{pkg.credits.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{pageText('topups', 'credits_label', isAr ? 'أرصدة' : 'credits')}</p>
                {pkg.bonus_credits > 0 && (
                  <span className="mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                    +{pkg.bonus_credits} {pageText('topups', 'bonus_label', isAr ? 'مكافأة' : 'bonus')}
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
                  className={`mt-4 w-full min-h-11 rounded-xl text-[13px] font-medium transition-all ${
                    pkg.is_popular
                      ? 'bg-primary text-primary-foreground hover:brightness-90'
                      : 'bg-muted/50 text-foreground hover:bg-muted'
                  }`}
                >
                  {pageText('topups', 'buy_cta', isAr ? 'شراء أرصدة' : 'Buy Credits')}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <div className="text-center mb-8">
          <h2 className="typo-heading-section">{pageText('faq', 'title', isAr ? 'أسئلة شائعة' : 'Common questions')}</h2>
        </div>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq: any, i: number) => (
            <AccordionItem key={faq.id || i} value={`faq-${i}`} className="bg-card rounded-xl border border-border/40 px-5 py-1 data-[state=open]:border-primary/30 data-[state=open]:bg-primary/[0.02]">
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
          {pageText('legal', 'prefix', isAr ? 'بالاشتراك أنت توافق على ' : 'By subscribing you agree to our ')}
          <a href="/terms" className="inline-flex min-h-11 items-center hover:text-foreground transition-colors">{pageText('legal', 'terms', isAr ? 'الشروط والأحكام' : 'Terms & Conditions')}</a>
          {pageText('legal', 'joiner', isAr ? ' و' : ' and ')}
          <a href="/privacy" className="inline-flex min-h-11 items-center hover:text-foreground transition-colors">{pageText('legal', 'privacy', isAr ? 'سياسة الخصوصية' : 'Privacy Policy')}</a>
        </p>
      </section>
    </div>
  );
};

export default Pricing;
