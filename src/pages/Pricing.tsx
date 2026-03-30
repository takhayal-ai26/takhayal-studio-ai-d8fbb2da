import { useState } from 'react';
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
  const [currency, setCurrency] = useState<'USD' | 'KWD'>('USD');

  const KWD_RATE = 0.308;
  const fmt = (usd: number) => {
    if (currency === 'KWD') {
      const kwd = usd * KWD_RATE;
      return `${kwd % 1 === 0 ? kwd.toFixed(0) : kwd.toFixed(2)} KD`;
    }
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
    <div className="flex-1 pt-16 overflow-y-auto">
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

      {/* Currency toggle */}
      <div className="flex justify-center mb-10">
        <div className="flex p-1 rounded-full bg-muted">
          <button onClick={() => setCurrency('USD')} className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all ${currency === 'USD' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            USD $
          </button>
          <button onClick={() => setCurrency('KWD')} className={`px-4 py-2 rounded-full text-[12px] font-medium transition-all ${currency === 'KWD' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            KWD د.ك
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {activePlans.map((p: any) => {
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
              : 'border border-border text-foreground hover:bg-muted';

            if (!authLoading && isAuthenticated) {
              if (isCurrent) {
                btnText = isAr ? 'الخطة الحالية' : 'Current Plan';
                btnDisabled = true;
                btnStyle = 'bg-card border border-border text-muted-foreground cursor-default';
              } else if (thisIdx < currentIdx) {
                btnText = isAr ? 'تخفيض' : 'Downgrade';
                btnStyle = 'border border-border text-muted-foreground hover:bg-muted';
              } else {
                btnText = isAr ? `ترقية إلى ${name}` : `Upgrade to ${name}`;
              }
            }

            return (
              <div key={p.id} className={`rounded-2xl p-6 flex flex-col transition-all duration-200 hover:scale-[1.01] relative ${
                p.featured ? 'bg-card border-2 border-primary shadow-[0_0_0_1px_rgba(240,62,27,0.2)]' : 'bg-card border border-border'
              }`}>
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

                {/* Credits pill */}
                <div className="mt-4 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[12px] font-medium w-fit">
                  {p.credits_monthly > 0 ? (
                    <>
                      {p.credits_monthly.toLocaleString()} {isAr ? 'رصيد / شهر' : 'credits / month'}
                    </>
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
                  <div className="mt-6 w-full h-11 rounded-xl bg-card border border-border animate-pulse" />
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
          })}
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
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {isAr ? p.name_ar : p.name_en} — {p.credits_monthly > 0 ? `${p.credits_monthly.toLocaleString()}cr` : '15cr'}
            </button>
          ))}
        </div>

        {/* Credit cost table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-6 py-3 border-b border-border bg-muted/30">
            <span>{isAr ? 'النموذج' : 'Model'}</span>
            <span>{isAr ? 'الخيار' : 'Option'}</span>
            <span>{isAr ? 'التكلفة' : 'Cost'}</span>
            <span className="text-right">~{isAr ? 'الصور' : 'Images'}</span>
          </div>
          {CREDIT_COST_DATA.map((model, mi) => (
            <div key={model.model}>
              {model.options.map((opt, oi) => (
                <div key={opt.label} className="grid grid-cols-4 px-6 py-3 border-b border-border/50 hover:bg-muted/20 transition-colors text-sm">
                  <span className={oi === 0 ? 'font-medium text-foreground' : 'text-transparent'}>
                    {oi === 0 ? model.model : model.model}
                  </span>
                  <span className="text-muted-foreground">{opt.label} resolution</span>
                  <span className="text-foreground">{opt.credits} {isAr ? 'أرصدة' : 'credits'}</span>
                  <span className="text-right text-primary font-medium">~{Math.floor(selectedPlanCredits / opt.credits).toLocaleString()} {isAr ? 'صورة' : 'images'}</span>
                </div>
              ))}
              {mi < CREDIT_COST_DATA.length - 1 && <div className="border-b border-border" />}
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
                pkg.is_popular ? 'border-[1.5px] border-primary' : 'border border-border'
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
                      : 'border border-border text-foreground hover:bg-muted'
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
            <AccordionItem key={faq.id || i} value={`faq-${i}`} className="bg-card rounded-xl border border-border px-5 py-1 data-[state=open]:border-primary/30">
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
