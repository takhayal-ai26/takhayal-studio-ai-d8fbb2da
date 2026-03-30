import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Check, Image, Sparkles, Zap } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  usePricingPlans, usePricingFaqs, useCreditExplanations, usePricingPageContent,
} from '@/hooks/useBillingData';

const iconMap: Record<string, React.ComponentType<any>> = { Image, Sparkles, Zap };

const Pricing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, plan, openAuthModal } = useApp();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const { data: plans = [] } = usePricingPlans();
  const { data: faqs = [] } = usePricingFaqs();
  const { data: explanations = [] } = useCreditExplanations();
  const { data: pageContent = [] } = usePricingPageContent();

  const pc = (section: string, field: string) => {
    const item = pageContent.find(c => c.section_key === section && c.field_key === field);
    return item ? (isAr ? item.value_ar : item.value_en) : '';
  };

  const activePlans = plans.filter(p => p.active);
  const activeFaqs = faqs.filter(f => f.active);
  const activeExplanations = explanations.filter(e => e.active);

  const handleCta = (p: any) => {
    const slug = p.slug;
    if (slug === 'free') {
      if (!isAuthenticated) { openAuthModal('signup'); return; }
      // Already on free — do nothing
      return;
    }
    if (!isAuthenticated) {
      sessionStorage.setItem('redirectAfterLogin', `/checkout?plan=${slug}`);
      openAuthModal('signup');
      return;
    }
    navigate(`/checkout?plan=${slug}`);
  };

  return (
    <div className="flex-1 pt-16 overflow-y-auto">
      {/* Hero */}
      <section className="pt-20 pb-16 px-6 text-center">
        <h1 className="text-[42px] md:text-[52px] font-extralight text-foreground leading-tight">
          {pc('hero', 'title') || 'Simple, transparent pricing'}
        </h1>
        <p className="text-[16px] text-muted-foreground mt-4 max-w-md mx-auto font-light">
          {pc('hero', 'subtitle') || 'Start free. Upgrade when you need more.'}
        </p>
      </section>

      {/* Plans */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activePlans.map(p => {
            const name = isAr ? p.name_ar : p.name_en;
            const desc = isAr ? p.description_ar : p.description_en;
            const badge = isAr ? p.badge_ar : p.badge_en;
            const cta = isAr ? p.cta_label_ar : p.cta_label_en;
            const features = (p.features || []).filter(f => f.active);
            const isCurrent = plan === p.slug;

            return (
              <div key={p.id} className={`rounded-2xl p-8 flex flex-col transition-transform duration-200 hover:scale-[1.02] ${
                p.featured ? 'bg-card border-[1.5px] border-primary relative' : 'bg-card border border-surface-border'
              }`}>
                {badge && (
                  <span className="absolute -top-3 left-6 px-3 py-1 rounded-full text-[11px] font-medium bg-primary text-primary-foreground">{badge}</span>
                )}
                <h3 className="text-xl font-medium text-foreground">{name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[40px] font-extralight text-foreground">${p.price}</span>
                  <span className="text-sm text-muted-foreground">/{p.billing_period}</span>
                </div>
                <p className="text-[13px] text-muted-foreground mt-2">{desc}</p>
                <ul className="mt-8 space-y-3 flex-1">
                  {features.map(f => (
                    <li key={f.id} className="flex items-center gap-3 text-[13px] text-foreground">
                      <Check size={14} className="text-primary flex-shrink-0" />
                      {isAr ? f.text_ar : f.text_en}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleCta(p)} className={`mt-8 w-full h-12 rounded-xl text-[14px] font-medium transition-colors ${
                  p.featured ? 'bg-primary text-primary-foreground hover:bg-ember-hover' : 'border border-surface-border text-foreground hover:bg-muted'
                }`}>
                  {isCurrent ? (isAr ? 'الخطة الحالية' : 'Current Plan') : cta}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* How Credits Work */}
      {activeExplanations.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <h2 className="text-lg font-medium text-foreground mb-6">{pc('credits_section', 'title') || 'How credits work'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {activeExplanations.map(ex => {
              const Icon = iconMap[ex.icon] || Image;
              return (
                <div key={ex.id} className="bg-card rounded-xl border border-surface-border p-5 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/[0.1] flex items-center justify-center">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-[13px] text-foreground font-medium">{isAr ? ex.title_ar : ex.title_en}</p>
                    <p className="text-[12px] text-muted-foreground">{isAr ? ex.subtitle_ar : ex.subtitle_en}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* FAQ */}
      {activeFaqs.length > 0 && (
        <section className="max-w-2xl mx-auto px-6 pb-24">
          <h2 className="text-lg font-medium text-foreground mb-6">{pc('faq_section', 'title') || 'FAQ'}</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {activeFaqs.map((faq, i) => (
              <AccordionItem key={faq.id} value={`faq-${i}`} className="bg-card rounded-xl border border-surface-border px-5 py-1 data-[state=open]:border-primary/30">
                <AccordionTrigger className="text-[14px] font-medium text-foreground hover:no-underline py-4">
                  {isAr ? faq.question_ar : faq.question_en}
                </AccordionTrigger>
                <AccordionContent className="text-[13px] text-muted-foreground pb-4">
                  {isAr ? faq.answer_ar : faq.answer_en}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      {/* Legal links */}
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
