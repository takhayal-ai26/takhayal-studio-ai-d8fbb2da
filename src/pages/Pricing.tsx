import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { AuthModal } from '@/components/AuthModal';
import { Check, Flame, Zap, Image, Sparkles, Clock } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/ month',
    description: 'Get started with AI image generation.',
    features: [
      '20 credits to start',
      'Standard image generation',
      'Basic templates',
      'Community styles',
    ],
    cta: 'Get started',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$15',
    period: '/ month',
    description: 'For creators who need more power.',
    features: [
      '500 credits / month',
      'High-quality image generation',
      'Faster generation speed',
      'Premium templates',
      'Priority processing',
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
];

const creditExamples = [
  { icon: Image, label: 'Standard image', cost: '1 credit' },
  { icon: Sparkles, label: 'HD image', cost: '3 credits' },
  { icon: Zap, label: '4K resolution', cost: '5 credits' },
];

const faqs = [
  {
    q: 'Do credits roll over?',
    a: 'Free credits do not roll over. Pro credits reset monthly on your billing date.',
  },
  {
    q: 'Can I cancel anytime?',
    a: "Yes. Cancel anytime from your account settings. You'll keep access until the end of your billing period.",
  },
  {
    q: 'What happens when I run out of credits?',
    a: "You'll be prompted to upgrade or wait for your monthly reset (Pro users). Free users can upgrade to continue.",
  },
  {
    q: 'Do you offer refunds?',
    a: 'We offer refunds within 7 days of purchase if no credits have been used.',
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, plan, openAuthModal } = useApp();

  const handleCta = (planId: string) => {
    if (planId === 'free') {
      if (!isAuthenticated) {
        openAuthModal('signup');
      } else {
        navigate('/canvas');
      }
    } else {
      if (!isAuthenticated) {
        openAuthModal('signup');
      } else {
        // Mock upgrade — in real app would go to Stripe
        navigate('/canvas');
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <TopNavbar />
      <div className="flex-1 pt-16 overflow-y-auto">
        {/* Hero */}
        <section className="pt-20 pb-16 px-6 text-center">
          <h1 className="text-[42px] md:text-[52px] font-extralight text-foreground leading-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-[16px] text-muted-foreground mt-4 max-w-md mx-auto font-light">
            Start free. Upgrade when you need more power.
          </p>
        </section>

        {/* Cards */}
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map(p => (
              <div
                key={p.id}
                className={`rounded-2xl p-8 flex flex-col transition-transform duration-200 hover:scale-[1.02] ${
                  p.highlighted
                    ? 'bg-card border-[1.5px] border-primary relative'
                    : 'bg-card border border-surface-border'
                }`}
              >
                {p.highlighted && (
                  <span className="absolute -top-3 left-6 px-3 py-1 rounded-full text-[11px] font-medium bg-primary text-primary-foreground">
                    Most popular
                  </span>
                )}
                <h3 className="text-xl font-medium text-foreground">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[40px] font-extralight text-foreground">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
                <p className="text-[13px] text-muted-foreground mt-2">{p.description}</p>

                <ul className="mt-8 space-y-3 flex-1">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-[13px] text-foreground">
                      <Check size={14} className="text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCta(p.id)}
                  className={`mt-8 w-full h-12 rounded-xl text-[14px] font-medium transition-colors ${
                    p.highlighted
                      ? 'bg-primary text-primary-foreground hover:bg-ember-hover'
                      : 'border border-surface-border text-foreground hover:bg-muted'
                  }`}
                >
                  {plan === 'pro' && p.id === 'pro' ? 'Current plan' : p.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Credits explanation */}
        <section className="max-w-3xl mx-auto px-6 pb-20">
          <h2 className="text-lg font-medium text-foreground mb-6">How credits work</h2>
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

        {/* FAQ */}
        <section className="max-w-2xl mx-auto px-6 pb-24">
          <h2 className="text-lg font-medium text-foreground mb-6">Frequently asked questions</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card rounded-xl border border-surface-border px-5 py-1 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-[14px] font-medium text-foreground hover:no-underline py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-[13px] text-muted-foreground pb-4">
                  {faq.a}
                </AccordionContent>
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
