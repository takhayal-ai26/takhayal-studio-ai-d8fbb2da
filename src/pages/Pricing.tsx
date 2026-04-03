import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Check, Sparkles } from 'lucide-react';
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
