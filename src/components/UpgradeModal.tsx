import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { X, Check, Sparkles } from 'lucide-react';
import { useEffect } from 'react';

const PLANS = [
  {
    slug: 'creator', name: 'Creator', nameAr: 'المبدع', price: 12, credits: 300,
    features: ['All 14+ AI models', 'Up to 2K resolution', 'No watermark'],
    featuresAr: ['جميع النماذج 14+', 'دقة تصل إلى 2K', 'بدون علامة مائية'],
    featured: false,
  },
  {
    slug: 'studio', name: 'Studio', nameAr: 'الاستوديو', price: 29, credits: 1000,
    features: ['All models + early access', 'Up to 4K resolution', 'Brand kit & workspace'],
    featuresAr: ['جميع النماذج + وصول مبكر', 'دقة تصل إلى 4K', 'مجموعة العلامة التجارية'],
    featured: true,
  },
];

interface UpgradeModalProps {
  trigger?: 'credits' | 'model' | 'generic';
  modelName?: string;
}

export function UpgradeModal({ trigger = 'generic', modelName }: UpgradeModalProps) {
  const { upgradeModalOpen, closeUpgradeModal, setActivePage } = useApp();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const isAr = lang === 'ar';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeUpgradeModal(); };
    if (upgradeModalOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [upgradeModalOpen, closeUpgradeModal]);

  if (!upgradeModalOpen) return null;

  const title = trigger === 'model'
    ? (isAr ? `فتح ${modelName}` : `Unlock ${modelName}`)
    : trigger === 'credits'
    ? (isAr ? 'نفدت أرصدتك' : "You're out of credits")
    : (isAr ? 'ترقية خطتك' : 'Upgrade your plan');

  const subtitle = trigger === 'model'
    ? (isAr ? 'هذا النموذج متاح في خطة المبدع وأعلى.' : 'This model is available on Creator plan and above.')
    : trigger === 'credits'
    ? (isAr ? 'أضف رصيداً أو قم بترقية خطتك لمواصلة الإبداع.' : 'Top up your balance or upgrade your plan to keep creating.')
    : (isAr ? 'احصل على المزيد من الأرصدة والنماذج المتقدمة.' : 'Get more credits, faster generations, and premium models.');

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center animate-fade-in p-4" onClick={closeUpgradeModal}>
      <div className="absolute inset-0 bg-black/70" />
      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-[520px] bg-card rounded-2xl border-t-4 border-t-primary border border-border overflow-hidden animate-scale-in">
        <button onClick={closeUpgradeModal} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"><X size={18} /></button>

        <div className="p-6 pb-4">
          <h2 className="text-xl font-medium text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          {PLANS.map(p => (
            <div key={p.slug} className={`rounded-xl p-4 border ${p.featured ? 'border-primary relative' : 'border-border'}`}>
              {p.featured && (
                <span className="absolute -top-2.5 right-3 text-[10px] font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={10} /> {isAr ? 'الأكثر شعبية' : 'Most Popular'}
                </span>
              )}
              <h3 className="text-base font-medium text-foreground">{isAr ? p.nameAr : p.name}</h3>
              <p className="text-lg font-medium text-foreground mt-1">${p.price}<span className="text-xs text-muted-foreground">/{isAr ? 'شهر' : 'mo'}</span></p>
              <p className="text-xs text-muted-foreground mt-1">{p.credits} {isAr ? 'رصيد/شهر' : 'credits/mo'}</p>
              <ul className="mt-3 space-y-1.5">
                {(isAr ? p.featuresAr : p.features).map((f, i) => (
                  <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check size={12} className="text-primary flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { closeUpgradeModal(); navigate(`/checkout?plan=${p.slug}`); }}
                className={`w-full h-9 rounded-lg text-xs font-medium mt-4 transition-colors ${p.featured ? 'bg-primary text-primary-foreground hover:brightness-90' : 'border border-border text-foreground hover:bg-muted'}`}
              >
                {isAr ? `ترقية إلى ${p.nameAr}` : `Upgrade to ${p.name}`}
              </button>
            </div>
          ))}
        </div>

        <div className="px-6 pb-5 text-center">
          <button onClick={() => { closeUpgradeModal(); setActivePage('credits'); navigate('/studio'); }} className="text-xs text-primary hover:underline">
            {isAr ? 'أو أضف رصيداً بدلاً من ذلك →' : 'Or top up credits instead →'}
          </button>
        </div>
      </div>
    </div>
  );
}
