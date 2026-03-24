import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { AuthModal } from '@/components/AuthModal';
import { Check, Flame, Zap, Image, Sparkles, Clock } from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';

const Pricing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, plan, openAuthModal } = useApp();
  const { t } = useLanguage();

  const plans = [
    {
      id: 'free',
      name: t.pricing.free,
      price: '$0',
      period: t.pricing.perMonth,
      description: t.pricing.freeDesc,
      features: t.pricing.freeFeatures,
      cta: t.pricing.getStarted,
      highlighted: false,
    },
    {
      id: 'pro',
      name: t.pricing.pro,
      price: '$15',
      period: t.pricing.perMonth,
      description: t.pricing.proDesc,
      features: t.pricing.proFeatures,
      cta: t.pricing.upgradeToPro,
      highlighted: true,
    },
  ];

  const creditExamples = [
    { icon: Image, label: t.pricing.standardImage, cost: `1 ${t.pricing.credit}` },
    { icon: Sparkles, label: t.pricing.hdImage, cost: `3 ${t.pricing.creditsPlural}` },
    { icon: Zap, label: t.pricing.fourKResolution, cost: `5 ${t.pricing.creditsPlural}` },
  ];

  const handleCta = (planId: string) => {
    if (!isAuthenticated) { openAuthModal('signup'); return; }
    navigate('/studio');
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <TopNavbar />
      <div className="flex-1 pt-16 overflow-y-auto">
        <section className="pt-20 pb-16 px-6 text-center">
          <h1 className="text-[42px] md:text-[52px] font-extralight text-foreground leading-tight">{t.pricing.title}</h1>
          <p className="text-[16px] text-muted-foreground mt-4 max-w-md mx-auto font-light">{t.pricing.subtitle}</p>
        </section>
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map(p => (
              <div key={p.id} className={`rounded-2xl p-8 flex flex-col transition-transform duration-200 hover:scale-[1.02] ${
                p.highlighted ? 'bg-card border-[1.5px] border-primary relative' : 'bg-card border border-surface-border'
              }`}>
                {p.highlighted && (
                  <span className="absolute -top-3 left-6 px-3 py-1 rounded-full text-[11px] font-medium bg-primary text-primary-foreground">{t.pricing.mostPopular}</span>
                )}
                <h3 className="text-xl font-medium text-foreground">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[40px] font-extralight text-foreground">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
                <p className="text-[13px] text-muted-foreground mt-2">{p.description}</p>
                <ul className="mt-8 space-y-3 flex-1">
                  {p.features.map((f: string) => (
                    <li key={f} className="flex items-center gap-3 text-[13px] text-foreground">
                      <Check size={14} className="text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleCta(p.id)} className={`mt-8 w-full h-12 rounded-xl text-[14px] font-medium transition-colors ${
                  p.highlighted ? 'bg-primary text-primary-foreground hover:bg-ember-hover' : 'border border-surface-border text-foreground hover:bg-muted'
                }`}>
                  {plan === 'pro' && p.id === 'pro' ? t.pricing.currentPlan : p.cta}
                </button>
              </div>
            ))}
          </div>
        </section>
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <h2 className="text-lg font-medium text-foreground mb-6">{t.pricing.howCreditsWork}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {creditExamples.map(ex => (
              <div key={ex.label} className="bg-card rounded-xl border border-surface-border p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/[0.1] flex items-center justify-center">
                  <ex.icon size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-[13px] text-foreground font-medium">{ex.label}</p>
                  <p className="text-[12px] text-muted-foreground">{ex.cost}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="max-w-2xl mx-auto px-6 pb-24">
          <h2 className="text-lg font-medium text-foreground mb-6">{t.pricing.faq}</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {t.pricing.faqItems.map((faq: any, i: number) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-card rounded-xl border border-surface-border px-5 py-1 data-[state=open]:border-primary/30">
                <AccordionTrigger className="text-[14px] font-medium text-foreground hover:no-underline py-4">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-[13px] text-muted-foreground pb-4">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
      <AuthModal />
    </div>
  );
};

export default Pricing;
