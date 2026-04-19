import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, Star } from 'lucide-react';

export function PricingPreview() {
  const navigate = useNavigate();
  const { lang, isRTL } = useLanguage();
  const isAr = lang === 'ar';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const { data: plans = [] } = useQuery({
    queryKey: ['pricing-plans-preview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('active', true)
        .eq('visible_logged_out', true)
        .order('sort_order');
      return data || [];
    },
    staleTime: 60000,
  });

  const { data: planFeatures = [] } = useQuery({
    queryKey: ['pricing-plan-features-preview'],
    queryFn: async () => {
      const { data } = await supabase
        .from('pricing_plan_features')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      return data || [];
    },
    staleTime: 60000,
  });

  // Scroll to featured plan on mount
  useEffect(() => {
    if (!scrollRef.current || plans.length === 0) return;
    const featuredIdx = plans.findIndex(p => p.featured);
    if (featuredIdx > 0) {
      const card = scrollRef.current.children[featuredIdx] as HTMLElement;
      if (card) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({ left: card.offsetLeft - (scrollRef.current!.offsetWidth - card.offsetWidth) / 2, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [plans]);

  if (plans.length === 0) return null;

  return (
    <section className="my-12 md:my-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 className="typo-heading-section text-center mb-2">
        {isAr ? 'خطط بسيطة وشفافة' : 'Simple, transparent pricing'}
      </h2>
      <p className="text-[13px] text-muted-foreground text-center mb-6">
        {isAr ? 'ابدأ مجانًا، وقم بالترقية حسب الحاجة' : 'Start free, upgrade as you grow'}
      </p>

      {/* Billing toggle */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center gap-1 p-0.5 rounded-full bg-muted/60">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`min-h-11 px-4 py-2 rounded-full text-[12px] font-medium transition-all ${billingPeriod === 'monthly' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {isAr ? 'شهري' : 'Monthly'}
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`min-h-11 px-4 py-2 rounded-full text-[12px] font-medium transition-all flex items-center gap-1.5 ${billingPeriod === 'annual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {isAr ? 'سنوي' : 'Annual'}
            {plans.some(p => p.annual_discount_percent > 0) && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${billingPeriod === 'annual' ? 'bg-white/20' : 'bg-primary/15 text-primary'}`}>
                {isAr ? 'وفّر' : 'Save'} {plans.find(p => p.annual_discount_percent > 0)?.annual_discount_percent}%
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Cards carousel (mobile) / grid (desktop) */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 md:px-0 md:grid md:grid-cols-4"
        style={{ scrollPaddingInline: '16px' }}
      >
        {plans.map((plan) => {
          const name = isAr ? plan.name_ar : plan.name_en;
          const desc = isAr ? plan.description_ar : plan.description_en;
          const badge = isAr ? plan.badge_ar : plan.badge_en;
          const cta = isAr ? plan.cta_label_ar : plan.cta_label_en;
          const price = billingPeriod === 'annual' ? plan.price_annual_monthly_equivalent : plan.price_monthly_usd;
          const features = planFeatures.filter(f => f.plan_id === plan.id);

          return (
            <div
              key={plan.id}
              className={`snap-center flex-shrink-0 w-[82vw] md:w-auto rounded-2xl border p-5 md:p-6 flex flex-col transition-all duration-300 ${
                plan.featured
                  ? 'border-primary/30 bg-card shadow-lg shadow-primary/10 scale-[1.02]'
                  : 'border-border/15 bg-card/60'
              }`}
            >
              {/* Badge */}
              {badge && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary mb-3">
                  {plan.featured && <Star size={12} className="fill-primary" />}
                  {badge}
                </span>
              )}
              <h3 className="text-lg font-bold text-foreground">{name}</h3>
              {desc && <p className="text-[12px] text-muted-foreground mt-1 mb-4">{desc}</p>}

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-extrabold text-foreground">${price}</span>
                <span className="text-[12px] text-muted-foreground">/{isAr ? 'شهر' : 'mo'}</span>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-5 flex-1">
                {features.slice(0, 4).map((f) => (
                  <li key={f.id} className="flex items-start gap-2 text-[13px] text-foreground/80">
                    <Check size={14} className="text-primary mt-0.5 flex-shrink-0" />
                    <span>{isAr ? f.text_ar : f.text_en}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => navigate('/pricing')}
                className={`w-full h-11 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                  plan.featured
                    ? 'bg-primary text-primary-foreground hover:brightness-110'
                    : 'bg-muted/60 text-foreground hover:bg-muted'
                }`}
              >
                {cta || (isAr ? 'عرض التفاصيل' : 'View Details')}
              </button>
            </div>
          );
        })}
      </div>

      {/* View all pricing */}
      <div className="text-center mt-6">
        <button
          onClick={() => navigate('/pricing')}
          className="inline-flex min-h-11 items-center gap-2 px-3 text-[13px] text-primary font-medium hover:underline group"
        >
          {isAr ? 'عرض جميع الخطط' : 'View all plans'}
          <ArrowRight size={14} className={`group-hover:translate-x-1 transition-transform ${isRTL ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </section>
  );
}
