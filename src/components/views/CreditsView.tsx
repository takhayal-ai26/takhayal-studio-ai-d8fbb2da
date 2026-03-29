import { Flame } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';

const plans = [
  { credits: 100, price: '3 KWD', badgeKey: null, popular: false },
  { credits: 300, price: '8 KWD', badgeKey: 'mostPopular', popular: true },
  { credits: 1000, price: '22 KWD', badgeKey: 'bestValue', popular: false },
];

const history = [
  { date: 'Mar 22', prompt: 'Cinematic Ramadan ad, golden lantern...', template: 'Ramadan', credits: 2 },
  { date: 'Mar 21', prompt: 'Professional product shot, white bg...', template: 'Product Shot', credits: 2 },
  { date: 'Mar 20', prompt: 'Luxury real estate, modern building...', template: 'Real Estate', credits: 4 },
  { date: 'Mar 19', prompt: 'Fashion editorial, modest style...', template: 'Fashion', credits: 2 },
];

export function CreditsView() {
  const { credits } = useApp();
  const { t } = useLanguage();

  const badgeLabels: Record<string, string> = { mostPopular: t.creditsView.mostPopular, bestValue: t.creditsView.bestValue };
  const headers = [t.creditsView.date, t.creditsView.promptLabel, t.creditsView.template, t.creditsView.title];

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto pb-20 md:pb-6 max-w-4xl">
      <h1 className="text-xl font-medium text-foreground mb-6">{t.creditsView.title}</h1>
      <div className="bg-card border-[1.5px] border-primary rounded-xl p-8 mb-8">
        <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{t.creditsView.currentBalance}</p>
        <p className="text-[56px] font-extralight text-foreground leading-none mt-2">{credits} <span className="text-xl">{t.creditsView.creditsWord}</span></p>
        <p className="text-sm text-muted-foreground mt-2">≈ {Math.floor(credits / 2)} {t.creditsView.imagesRemaining}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {plans.map(plan => (
          <div key={plan.credits} className={`bg-card rounded-xl p-6 border ${plan.popular ? 'border-primary' : 'border-surface-border'} relative`}>
            {plan.badgeKey && (<span className={`absolute -top-3 left-4 px-3 py-1 rounded-full text-[11px] font-medium ${plan.popular ? 'bg-primary text-primary-foreground' : 'border border-primary text-primary'}`}>{badgeLabels[plan.badgeKey]}</span>)}
            <p className="text-2xl font-medium text-foreground">{plan.credits}</p>
            <p className="text-[11px] text-muted-foreground">{t.creditsView.creditsWord}</p>
            <p className="text-base font-light text-muted-foreground mt-2">{plan.price}</p>
            <button className={`w-full h-10 rounded-lg text-[13px] font-medium mt-4 transition-colors ${plan.popular ? 'bg-primary text-primary-foreground hover:bg-ember-hover' : 'border border-surface-border text-foreground hover:bg-card'}`}>{t.creditsView.buyCredits}</button>
          </div>
        ))}
      </div>
      <div className="bg-card rounded-xl border border-surface-border overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-4 py-3 bg-background">
          {headers.map(h => (<span key={h} className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{h}</span>))}
        </div>
        {history.map((row, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3 border-t border-surface-border">
            <span className="text-[13px] text-foreground">{row.date}</span>
            <span className="text-[13px] text-foreground truncate">{row.prompt}</span>
            <span className="text-[13px] text-foreground">{row.template}</span>
            <span className="text-[13px] text-primary">-{row.credits}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 text-center">
        <p className="text-[11px] text-muted-foreground">
          <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
          {' · '}
          <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
          {' · '}
          <a href="/refund" className="hover:text-foreground transition-colors">Refund Policy</a>
        </p>
      </div>
    </div>
  );
}
